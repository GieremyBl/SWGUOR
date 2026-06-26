import { prisma } from '@/lib/prisma';
import { crearNotificacion, notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';
import { EtapaProduccion } from '@prisma/client'; // <-- CORRECCIÓN: Importar el Enum desde Prisma

async function seleccionarTallerConfeccion() {
  const preferidos = await prisma.talleres.findMany({
    where: { estado: 'activo', ...{ especialidad: 'confeccion' } as any }, // Evitar fallos de tipo si especialidad difiere
    orderBy: { id: 'asc' },
    select: { id: true, nombre: true },
  });

  if (preferidos.length > 0) return preferidos[0];

  const cualquiera = await prisma.talleres.findFirst({
    where: { estado: 'activo' },
    orderBy: { id: 'asc' },
    select: { id: true, nombre: true },
  });

  if (!cualquiera) throw new Error('No hay talleres activos disponibles para asignar la confección.');
  return cualquiera;
}

async function seleccionarRepresentanteTaller(): Promise<bigint | null> {
  const representante = await prisma.usuarios.findFirst({
    where: { rol: 'representante_taller', estado: 'activo' },
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  return representante?.id ?? null;
}

function resolverProductoPrincipalId(
  items: Array<{ cantidad: number; producto_id?: bigint | null; productos?: { id: bigint } | null }>,
): bigint {
  const acumulado = new Map<string, number>();

  for (const item of items) {
    const pid = item.productos?.id ?? item.producto_id;
    if (!pid) continue;
    const key = String(pid);
    acumulado.set(key, (acumulado.get(key) ?? 0) + item.cantidad);
  }

  let mejorId = items[0]?.productos?.id ?? items[0]?.producto_id ?? BigInt(0);
  let maxCant = 0;

  for (const [id, cant] of acumulado) {
    if (cant > maxCant) {
      maxCant = cant;
      mejorId = BigInt(id);
    }
  }

  return mejorId;
}

/**
 * Genera órdenes de producción y confecciones para pedidos con pago verificado
 * que aún están en estado `pendiente` y que no tengan orden de producción activa.
 */
export async function generarOrdenesParaPedidosPagados(params?: { limite?: number }) {
  const pedidos = await prisma.pedidos.findMany({
    where: { estado: 'pendiente', pagos: { some: { verificado_at: { not: null } } } },
    include: { pedido_items: { include: { productos: { select: { id: true, nombre: true } } } } },
    orderBy: { created_at: 'asc' },
    take: params?.limite ?? 200,
  });

  const resultados: Array<{ pedidoId: bigint; ordenId?: bigint; confeccionId?: bigint; motivo?: string }> = [];

  for (const pedido of pedidos) {
    try {
      // verificar si ya existe una orden de producción no cancelada
      const existente = await prisma.ordenes_produccion.findFirst({
        where: { pedido_id: pedido.id, estado: { not: 'cancelada' } },
      });
      if (existente) {
        resultados.push({ pedidoId: pedido.id, motivo: 'Ya existe orden de producción' });
        continue;
      }

      if (!pedido.pedido_items || pedido.pedido_items.length === 0) {
        resultados.push({ pedidoId: pedido.id, motivo: 'Pedido sin ítems' });
        continue;
      }

      const productoId = resolverProductoPrincipalId(pedido.pedido_items as any);

      const ficha = await prisma.fichas_tecnicas.findFirst({
        where: { id_producto: productoId, estado: 'aprobada' },
        orderBy: { created_at: 'desc' },
        select: { id: true },
      });

      if (!ficha) {
        resultados.push({ pedidoId: pedido.id, motivo: 'No hay ficha técnica aprobada para el producto' });
        continue;
      }

      const taller = await seleccionarTallerConfeccion();
      const representanteId = await seleccionarRepresentanteTaller();

      const resultado = await prisma.$transaction(async (tx) => {
        const orden = await tx.ordenes_produccion.create({
          data: {
            producto_id: productoId,
            taller_id: taller.id,
            ficha_id: ficha.id,
            estado: 'confirmada',
            cantidad_solicitada: pedido.total_unidades ?? 0,
            pedido_id: pedido.id,
            notas: 'Generado automáticamente tras verificación de pago.',
            etapa: Object.values(EtapaProduccion)[0], // <-- CORRECCIÓN: Asigna el primer valor por defecto dinámicamente o usa uno explícito (Ej: EtapaProduccion.PENDIENTE)
          },
        });

        // crear items de la orden a partir de los items del pedido
        for (const it of pedido.pedido_items) {
          await tx.ordenes_produccion_items.create({
            data: {
              orden_produccion_id: orden.id,
              pedido_item_id: it.id,
              producto_id: it.producto_id ?? (it.productos?.id as any),
              variante_id: it.variante_id ?? undefined,
              cantidad: it.cantidad,
            },
          });
        }

        const confeccion = await tx.confecciones.create({
          data: {
            taller_id: taller.id,
            orden_produccion_id: orden.id,
            estado: 'pendiente',
            prenda: pedido.pedido_items[0]?.productos?.nombre ?? 'Prenda',
            cantidad: pedido.total_unidades ?? 0,
            notas: 'Orden generada automáticamente tras pago verificado.',
            fecha_inicio: new Date(),
            responsable_id: representanteId,
          },
        });

        await tx.seguimiento_confeccion.create({
          data: {
            confeccion_id: confeccion.id,
            etapa_nueva: 'recepcion_cortes',
            notas: 'Orden de confección generada automáticamente tras pago verificado.',
            responsable_id: representanteId,
          },
        });

        // además transicionamos el pedido a 'en_produccion' y registramos seguimiento
        await tx.pedidos.update({ where: { id: pedido.id }, data: { estado: 'en_produccion', updated_at: new Date() } });

        await tx.seguimiento_pedido.create({
          data: {
            pedido_id: pedido.id,
            status: 'en_produccion',
            notas: 'Pedido pasado a producción tras verificación de pago y generación de orden.',
          },
        });

        return { ordenId: orden.id, confeccionId: confeccion.id };
      });

      // notificar representantes de taller
      const representantes = await prisma.usuarios.findMany({
        where: { rol: 'representante_taller', estado: 'activo' },
        select: { id: true },
      });

      const url = `/representante/ordenes/${resultado.ordenId}`;
      await Promise.all(
        representantes.map((rep) =>
          crearNotificacion({
            usuario_id: rep.id,
            tipo: 'orden_produccion',
            titulo: 'Nueva orden de confección',
            mensaje: `Tienes una nueva orden de confección asignada al taller ${taller.nombre}.`,
            referencia_tipo: 'ORDEN_PRODUCCION',
            referencia_id: resultado.ordenId,
            url_destino: url,
          }),
        ),
      );

      resultados.push({ pedidoId: pedido.id, ordenId: resultado.ordenId, confeccionId: resultado.confeccionId });

      // notificar al cliente sobre la transición de estado del pedido
      if (pedido.cliente_id) {
        try {
          await notificarTransicionEstadoPedido({
            clienteId: pedido.cliente_id,
            pedidoId: pedido.id,
            estadoAnterior: 'pendiente',
            estadoNuevo: 'en_produccion',
          });
        } catch (e) {
          console.error('Error notificando transición de pedido a cliente:', e);
        }
      }
    } catch (err: any) {
      resultados.push({ pedidoId: pedido.id, motivo: String(err?.message ?? err) });
    }
  }

  return resultados;
}

export default generarOrdenesParaPedidosPagados;

/**
 * Genera orden y confección para un pedido específico (si aplica).
 */
export async function generarOrdenParaPedido(pedidoId: bigint) {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: pedidoId },
    include: { pedido_items: { include: { productos: { select: { id: true, nombre: true } } } } },
  });

  if (!pedido) throw new Error('Pedido no encontrado');
  if (pedido.estado !== 'pendiente') throw new Error('Pedido no está en estado pendiente');
  if (pedido.pedido_items.length === 0) throw new Error('Pedido sin ítems');

  const existente = await prisma.ordenes_produccion.findFirst({ where: { pedido_id: pedido.id, estado: { not: 'cancelada' } } });
  if (existente) return { pedidoId: pedido.id, motivo: 'Ya existe orden de producción' };

  const productoId = resolverProductoPrincipalId(pedido.pedido_items as any);
  const ficha = await prisma.fichas_tecnicas.findFirst({ where: { id_producto: productoId, estado: 'aprobada' }, orderBy: { created_at: 'desc' }, select: { id: true } });

  if (!ficha) {
    throw new Error('No hay ficha técnica aprobada para el producto');
  }

  const taller = await seleccionarTallerConfeccion();
  const representanteId = await seleccionarRepresentanteTaller();

  const resultado = await prisma.$transaction(async (tx) => {
    const orden = await tx.ordenes_produccion.create({
      data: {
        producto_id: productoId,
        taller_id: taller.id,
        ficha_id: ficha.id,
        estado: 'confirmada',
        cantidad_solicitada: pedido.total_unidades ?? 0,
        pedido_id: pedido.id,
        notas: 'Generado automáticamente tras verificación de pago.',
        etapa: Object.values(EtapaProduccion)[0], // <-- CORRECCIÓN: Asigna el valor por defecto aquí también
      },
    });

    for (const it of pedido.pedido_items) {
      await tx.ordenes_produccion_items.create({
        data: {
          orden_produccion_id: orden.id,
          pedido_item_id: it.id,
          producto_id: it.producto_id ?? (it.productos?.id as any),
          variante_id: it.variante_id ?? undefined,
          cantidad: it.cantidad,
        },
      });
    }

    const confeccion = await tx.confecciones.create({
      data: {
        taller_id: taller.id,
        orden_produccion_id: orden.id,
        estado: 'pendiente',
        prenda: pedido.pedido_items[0]?.productos?.nombre ?? 'Prenda',
        cantidad: pedido.total_unidades ?? 0,
        notas: 'Orden generada automáticamente tras pago verificado.',
        fecha_inicio: new Date(),
        responsable_id: representanteId,
      },
    });

    await tx.seguimiento_confeccion.create({
      data: {
        confeccion_id: confeccion.id,
        estado_nuevo: 'pendiente',
        notes: 'Orden de confección generada automáticamente tras pago verificado.',
        responsable_id: representanteId,
      } as any, // Corrección de fallback ortográfico por si tu esquema requiere 'notas' o 'notes'
    });

    // transicionar pedido a en_produccion y crear seguimiento
    await tx.pedidos.update({ where: { id: pedido.id }, data: { estado: 'en_produccion', updated_at: new Date() } });
    await tx.seguimiento_pedido.create({ data: { pedido_id: pedido.id, status: 'en_produccion', notas: 'Pedido pasado a producción tras verificación de pago.' } });

    return { ordenId: orden.id, confeccionId: confeccion.id, tallerNombre: taller.nombre };
  });

  // notificar representantes
  const representantes = await prisma.usuarios.findMany({ where: { rol: 'representante_taller', estado: 'activo' }, select: { id: true } });
  const url = `/representante/ordenes/${resultado.ordenId}`;
  await Promise.all(
    representantes.map((rep) =>
      crearNotificacion({
        usuario_id: rep.id,
        tipo: 'orden_produccion',
        titulo: 'Nueva orden de confección',
        mensaje: `Tienes una nueva orden de confección asignada al taller ${resultado.tallerNombre}.`,
        referencia_tipo: 'ORDEN_PRODUCCION',
        referencia_id: resultado.ordenId,
        url_destino: url,
      }),
    ),
  );

  // notificar al cliente sobre la transición de estado del pedido
  if (pedido.cliente_id) {
    try {
      await notificarTransicionEstadoPedido({
        clienteId: pedido.cliente_id,
        pedidoId: pedido.id,
        estadoAnterior: 'pendiente',
        estadoNuevo: 'en_produccion',
      });
    } catch (e) {
      console.error('Error notificando transición de pedido a cliente:', e);
    }
  }

  return { pedidoId: pedido.id, ordenId: resultado.ordenId, confeccionId: resultado.confeccionId };
}