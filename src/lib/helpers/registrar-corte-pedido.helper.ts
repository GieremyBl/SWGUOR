import { prisma } from '@/lib/prisma';
import { crearNotificacion } from '@/lib/helpers/crear-notificacion.helper';
import { parseDescripcionDetallada } from '@/lib/helpers/ficha-tecnica-descripcion.helper';

export interface MedidaCorteData {
  id: string;
  punto_medida: string | null;
  talla: string | null;
  valor_cm: number | null;
  tolerancia: number | null;
}

export interface FichaCorteData {
  id: string;
  version: string | null;
  estado: string | null;
  ficha_url: string | null;
  imagen_geometral: string | null;
  descripcionTexto: string | null;
  evidencias: string[];
  detalle: Array<{
    id: string;
    cantidad_consumo: number;
    porcentaje_desperdicio: number | null;
    material: {
      nombre: string;
      tipo: string;
      composicion: string | null;
      color: string | null;
      unidad: string;
    } | null;
    insumo: {
      nombre: string;
      tipo: string;
      unidad: string;
    } | null;
    observaciones: string | null;
  }>;
  medidas: MedidaCorteData[];
}

export interface ItemCorteConFicha {
  itemId: string;
  cantidad: number;
  productoId: string;
  productoNombre: string;
  productoSku: string | null;
  varianteColor: string | null;
  varianteTalla: string | null;
  ficha: FichaCorteData | null;
}

export interface ResultadoRegistroCorte {
  ordenId: bigint;
  confeccionId: bigint;
  tallerNombre: string;
  corteYaRegistrado: boolean;
  ordenNueva: boolean;
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

async function seleccionarTallerConfeccion() {
  const preferidos = await prisma.talleres.findMany({
    where: { estado: 'activo', especialidad: 'confeccion' },
    orderBy: { id: 'asc' },
    select: { id: true, nombre: true },
  });

  if (preferidos.length > 0) return preferidos[0];

  const cualquiera = await prisma.talleres.findFirst({
    where: { estado: 'activo' },
    orderBy: { id: 'asc' },
    select: { id: true, nombre: true },
  });

  if (!cualquiera) {
    throw new Error('No hay talleres activos disponibles para asignar la confección.');
  }

  return cualquiera;
}

/** responsable_id en confecciones debe ser rol representante_taller (check BD). */
async function seleccionarRepresentanteTaller(): Promise<bigint | null> {
  const representante = await prisma.usuarios.findFirst({
    where: { rol: 'representante_taller', estado: 'activo' },
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  return representante?.id ?? null;
}

async function notificarRepresentantesTaller(params: {
  ordenId: bigint;
  tallerNombre: string;
}) {
  const representantes = await prisma.usuarios.findMany({
    where: { rol: 'representante_taller', estado: 'activo' },
    select: { id: true },
  });

  const url = `/representante/ordenes/${params.ordenId}`;

  await Promise.all(
    representantes.map((rep) =>
      crearNotificacion({
        usuario_id: rep.id,
        tipo: 'orden_produccion',
        titulo: 'Nueva orden de confección',
        mensaje: `Tienes una nueva orden de confección asignada al taller ${params.tallerNombre}.`,
        referencia_tipo: 'ORDEN_PRODUCCION',
        referencia_id: params.ordenId,
        url_destino: url,
      }),
    ),
  );
}

async function buscarCorteRegistrado(pedidoId: bigint) {
  return prisma.seguimiento_produccion.findFirst({
    where: {
      etapa: 'corte',
      completado_en: { not: null },
      ordenes_produccion: { pedido_id: pedidoId, estado: { not: 'cancelada' } },
    },
    include: {
      ordenes_produccion: {
        include: { confecciones: { take: 1 } },
      },
    },
  });
}

/**
 * Trigger operativo del cortador: registra el hito físico de corte y autogenera
 * la orden de confección para el taller externo. El estado macro del pedido
 * (en_produccion) NO se modifica.
 */
export async function registrarCortePedidoCompletado(params: {
  pedidoId: bigint;
  usuarioId: bigint;
  notas?: string;
}): Promise<ResultadoRegistroCorte> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.pedidoId },
    include: {
      pedido_items: {
        include: {
          productos: { select: { id: true, nombre: true } },
        },
      },
    },
  });

  if (!pedido) {
    throw new Error('Pedido no encontrado');
  }

  if (pedido.estado !== 'en_produccion') {
    throw new Error(
      'El pedido debe estar en producción antes de registrar el corte. Espere a que el diseñador apruebe todas las fichas.',
    );
  }

  if (!pedido.pedido_items.length) {
    throw new Error('El pedido no tiene ítems para procesar');
  }

  const corteExistente = await buscarCorteRegistrado(params.pedidoId);
  if (corteExistente?.ordenes_produccion) {
    const conf = corteExistente.ordenes_produccion.confecciones[0];
    return {
      ordenId: corteExistente.ordenes_produccion.id,
      confeccionId: conf?.id ?? BigInt(0),
      tallerNombre: '',
      corteYaRegistrado: true,
      ordenNueva: false,
    };
  }

  const productoId = resolverProductoPrincipalId(pedido.pedido_items);
  const producto = pedido.pedido_items.find(
    (i) => String(i.productos?.id ?? i.producto_id) === String(productoId),
  )?.productos;

  const ficha = await prisma.fichas_tecnicas.findFirst({
    where: { id_producto: productoId, estado: 'aprobada' },
    orderBy: { created_at: 'desc' },
    select: { id: true },
  });

  if (!ficha) {
    throw new Error(
      'No hay ficha técnica aprobada para el producto principal. Solicite al diseñador que la apruebe.',
    );
  }

  const taller = await seleccionarTallerConfeccion();
  const representanteId = await seleccionarRepresentanteTaller();
  const notasCorte = params.notas?.trim() || 'Corte completado en planta.';

  let ordenNueva = false;
  let confeccionNueva = false;

  const resultado = await prisma.$transaction(async (tx) => {
    let orden = await tx.ordenes_produccion.findFirst({
      where: {
        pedido_id: params.pedidoId,
        producto_id: productoId,
        estado: { not: 'cancelada' },
      },
      orderBy: { created_at: 'desc' },
      include: { confecciones: { take: 1 } },
    });

    if (!orden) {
      ordenNueva = true;
      orden = await tx.ordenes_produccion.create({
        data: {
          producto_id: productoId,
          taller_id: taller.id,
          ficha_id: ficha.id,
          estado: 'confirmada',
          cantidad_solicitada: pedido.total_unidades ?? 0,
          pedido_id: params.pedidoId,
          creado_por: params.usuarioId,
          notas: notasCorte,
        },
        include: { confecciones: { take: 1 } },
      });
    }

    await tx.seguimiento_produccion.create({
      data: {
        orden_id: orden.id,
        etapa: 'corte',
        completado_en: new Date(),
        usuario_id: params.usuarioId,
        observaciones: notasCorte,
        activo: true,
      },
    });

    let confeccion = orden.confecciones?.[0];

    if (!confeccion) {
      confeccionNueva = true;
      confeccion = await tx.confecciones.create({
        data: {
          taller_id: taller.id,
          orden_produccion_id: orden.id,
          estado: 'pendiente',
          prenda: producto?.nombre ?? 'Prenda',
          cantidad: pedido.total_unidades ?? 0,
          notas: notasCorte,
          fecha_inicio: new Date(),
          responsable_id: representanteId,
        },
      });

      await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: confeccion.id,
          estado_nuevo: 'pendiente',
          notas: 'Orden de confección generada automáticamente tras el corte.',
          responsable_id: representanteId,
        },
      });
    }

    return {
      ordenId: orden.id,
      confeccionId: confeccion.id,
      tallerNombre: taller.nombre,
    };
  });

  if (confeccionNueva || ordenNueva) {
    await notificarRepresentantesTaller({
      ordenId: resultado.ordenId,
      tallerNombre: resultado.tallerNombre,
    });
  }

  return {
    ...resultado,
    corteYaRegistrado: false,
    ordenNueva,
  };
}

export async function obtenerEstadoCortePedido(pedidoId: bigint) {
  const corte = await buscarCorteRegistrado(pedidoId);
  return {
    corteCompletado: Boolean(corte),
    ordenId: corte?.ordenes_produccion?.id ? String(corte.ordenes_produccion.id) : null,
  };
}

export async function obtenerDatosFichaParaCorte(productoId: bigint) {
  const ficha = await prisma.fichas_tecnicas.findFirst({
    where: { id_producto: productoId, estado: 'aprobada' },
    orderBy: { created_at: 'desc' },
    include: {
      ficha_medidas: {
        orderBy: [{ talla: 'asc' }, { punto_medida: 'asc' }],
      },
      fichas_tecnicas_detalle: {
        include: {
          materiales: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              composicion: true,
              color: true,
              unidad_medida: true,
            },
          },
          insumo: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              unidad_medida: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!ficha) return null;

  const descripcion = parseDescripcionDetallada(ficha.descripcion_detallada);

  return {
    id: String(ficha.id),
    version: ficha.version,
    estado: ficha.estado,
    ficha_url: ficha.ficha_url,
    imagen_geometral: ficha.imagen_geometral,
    descripcionTexto: descripcion.texto,
    evidencias: descripcion.evidencias,
    detalle: ficha.fichas_tecnicas_detalle.map((d) => ({
      id: String(d.id),
      cantidad_consumo: Number(d.cantidad_consumo),
      porcentaje_desperdicio:
        d.porcentaje_desperdicio != null ? Number(d.porcentaje_desperdicio) : null,
      material: d.materiales
        ? {
            nombre: d.materiales.nombre,
            tipo: d.materiales.tipo,
            composicion: d.materiales.composicion,
            color: d.materiales.color,
            unidad: d.materiales.unidad_medida,
          }
        : null,
      insumo: d.insumo
        ? {
            nombre: d.insumo.nombre,
            tipo: d.insumo.tipo,
            unidad: d.insumo.unidad_medida,
          }
        : null,
      observaciones: d.observaciones,
    })),
    medidas: ficha.ficha_medidas.map((m) => ({
      id: String(m.id),
      punto_medida: m.punto_medida,
      talla: m.talla,
      valor_cm: m.valor_cm,
      tolerancia: m.tolerancia,
    })),
  };
}

export async function obtenerItemsConFichaParaCorte(
  items: Array<{
    id: bigint;
    cantidad: number;
    producto_id?: bigint | null;
    productos?: { id: bigint; nombre: string; sku: string | null } | null;
    variantes_producto?: { color: string | null; talla: string | null } | null;
  }>,
): Promise<ItemCorteConFicha[]> {
  const fichaCache = new Map<string, FichaCorteData | null>();
  const resultado: ItemCorteConFicha[] = [];

  for (const item of items) {
    const productoId = item.productos?.id ?? item.producto_id;
    if (!productoId) continue;

    const pid = String(productoId);
    if (!fichaCache.has(pid)) {
      fichaCache.set(pid, await obtenerDatosFichaParaCorte(productoId));
    }

    resultado.push({
      itemId: String(item.id),
      cantidad: item.cantidad,
      productoId: pid,
      productoNombre: item.productos?.nombre ?? 'Producto',
      productoSku: item.productos?.sku ?? null,
      varianteColor: item.variantes_producto?.color ?? null,
      varianteTalla: item.variantes_producto?.talla ?? null,
      ficha: fichaCache.get(pid) ?? null,
    });
  }

  return resultado;
}
