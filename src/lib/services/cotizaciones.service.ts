import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma, EstadoCotizacion, EstadoProducto, EstadoCliente } from '@prisma/client';
import { calcularTotalesCotizacion } from '@/lib/logic/cotizaciones-logic';
import { recalcularDescuentoCotizacion } from '@/lib/helpers/rpc-helpers';
import { notificarClienteSobrePedido } from '@/lib/helpers/pedido-seguimiento.helper';
import { crearNotificacionCliente } from '@/lib/helpers/crear-notificacion.helper';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface CotizacionRow {
  id: number;
  cotizacion_id: string;
  cliente: string | null;
  descripcion: string | null;
  monto: number;
  estado: string;
  costo_envio: number;
  fecha_vencimiento: string;
  fecha_creacion: string;
  expirada?: boolean;
}

export interface ItemInput {
  producto_id: string;
  variante_id: string;
  cantidad: number;
  precio_unitario: number;
  color_snapshot: string;
  talla_snapshot: string;
  modelo_snapshot: string | null;
  prenda_tipo_snapshot: string | null;
}

export type CotizacionItemDetalle = {
  id: number;
  producto_id: number;
  producto_nombre: string;
  producto_sku: string;
  variante_id: number | null;
  color: string;
  talla: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type CotizacionDetalleAdmin = {
  id: number;
  numero: string;
  estado: string;
  origen: string | null;
  created_at: string | null;
  valida_hasta: string;
  notas_internas: string | null;
  subtotal: number;
  igv: number;
  total: number;
  costo_envio: number;
  monto_descuento: number;
  cliente: {
    id: number;
    razon_social: string | null;
    ruc: string;
    nombre_comercial: string | null;
  } | null;
  items: CotizacionItemDetalle[];
};

export type PrecioItemAprobacion = {
  item_id: number;
  precio_unitario: number;
};

export interface CrearCotizacionInput {
  cliente_id?: string;
  nombre_cliente_manual?: string;
  valida_hasta: string;
  moneda: string;
  tasa_impuesto: string;
  tipo_operacion?: string;
  notas_internas?: string;
  costo_envio?: number;
  zona_envio?: string;
  /** borrador = borrador interno; enviada = pendiente de aprobación admin */
  estado_inicial?: 'borrador' | 'enviada';
  // Metadatos ERP opcionales
  empresa?: string;
  contacto?: string;
  tipo_destino?: string;
  vendedor?: string;
  tipo_venta?: string;
  unidad_negocio?: string;
  forma_pago?: string;
  metodo?: string;
  direccion_entrega?: string;
  direccion_factura?: string;
  condicion_entrega?: string;
  tiempo_entrega?: string;
  idioma?: string;
  referencia?: string;
  probabilidad?: string;
  fecha_cierre?: string;
  items: ItemInput[];
}

// FIX: Declaramos el tipo de payload de Prisma exacto que incluye la relación con cliente
type CotizacionConCliente = Prisma.cotizacionesGetPayload<{
  include: { cliente: true };
}>;

// ── Helpers internos ───────────────────────────────────────────────────────────

// FIX: Reemplazado 'row: any' por el tipo exacto generado por Prisma
function buildCotizacionRow(row: CotizacionConCliente, today: Date): CotizacionRow {
  const validaHasta = new Date(row.valida_hasta);
  validaHasta.setHours(0, 0, 0, 0);
  const estaExpirada = row.estado === EstadoCotizacion.enviada && today > validaHasta;

  return {
    id: Number(row.id),
    cotizacion_id: row.numero,
    cliente: row.cliente?.razon_social ?? null,
    descripcion: row.notas_internas ?? null,
    monto: Number(row.total ?? 0),
    estado: estaExpirada ? 'expirada' : (row.estado ?? 'borrador'),
    costo_envio: Number(row.costo_envio ?? 0),
    fecha_vencimiento: row.valida_hasta.toISOString().split('T')[0],
    fecha_creacion: row.created_at?.toISOString().split('T')[0] ?? '',
    expirada: estaExpirada,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────

export const CotizacionesService = {

  async listar(estado?: string): Promise<CotizacionRow[]> {
    // FIX: Reemplazado 'Record<string, unknown>' por el tipo estricto WhereInput de Prisma
    const where: Prisma.cotizacionesWhereInput = {};
    if (estado && estado !== 'todos') {
      where.estado = estado as EstadoCotizacion;
    }

    const rows = await prisma.cotizaciones.findMany({
      where,
      include: { cliente: true },
      orderBy: { created_at: 'desc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return serializeBigInt(rows.map((row) => buildCotizacionRow(row, today)));
  },

  async obtenerPorId(id: string) {
    const cotizacion = await prisma.cotizaciones.findUnique({
      where: { id: BigInt(id) },
      include: { cliente: true, cotizacion_items: true },
    });
    return cotizacion ? serializeBigInt(cotizacion) : null;
  },

  async obtenerDetalleAdmin(id: string): Promise<CotizacionDetalleAdmin | null> {
    const row = await prisma.cotizaciones.findUnique({
      where: { id: BigInt(id) },
      include: {
        cliente: {
          select: {
            id: true,
            razon_social: true,
            ruc: true,
            nombre_comercial: true,
          },
        },
        cotizacion_items: {
          include: {
            productos: { select: { id: true, nombre: true, sku: true } },
            variantes_producto: {
              select: { id: true, color: true, talla: true, sku: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!row) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validaHasta = new Date(row.valida_hasta);
    validaHasta.setHours(0, 0, 0, 0);
    const estaExpirada =
      row.estado === EstadoCotizacion.enviada && today > validaHasta;

    return serializeBigInt({
      id: Number(row.id),
      numero: row.numero,
      estado: estaExpirada ? 'expirada' : (row.estado ?? 'borrador'),
      origen: row.origen,
      created_at: row.created_at?.toISOString() ?? null,
      valida_hasta: row.valida_hasta.toISOString().split('T')[0],
      notas_internas: row.notas_internas,
      subtotal: Number(row.subtotal ?? 0),
      igv: Number(row.igv ?? 0),
      total: Number(row.total ?? 0),
      costo_envio: Number(row.costo_envio ?? 0),
      monto_descuento: Number(row.monto_descuento ?? 0),
      cliente: row.cliente
        ? {
            id: Number(row.cliente.id),
            razon_social: row.cliente.razon_social,
            ruc: row.cliente.ruc,
            nombre_comercial: row.cliente.nombre_comercial,
          }
        : null,
      items: row.cotizacion_items.map((item) => ({
        id: Number(item.id),
        producto_id: Number(item.producto_id),
        producto_nombre: item.productos?.nombre ?? 'Producto',
        producto_sku: item.productos?.sku ?? '—',
        variante_id: item.variante_id ? Number(item.variante_id) : null,
        color: item.color_snapshot || item.variantes_producto?.color || '—',
        talla: item.talla_snapshot || item.variantes_producto?.talla || '—',
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario_snapshot),
        subtotal: Number(item.subtotal),
      })),
    }) as CotizacionDetalleAdmin;
  },

  async crear(input: CrearCotizacionInput): Promise<CotizacionRow> {
    const {
      cliente_id,
      nombre_cliente_manual,
      valida_hasta,
      moneda,
      tasa_impuesto,
      tipo_operacion,
      notas_internas,
      items,
      costo_envio,
      ...metadatos
    } = input;

    // Calcular totales con la lógica de negocio existente
    const totales = calcularTotalesCotizacion(
      items.map((i) => ({ precioBase: i.precio_unitario, cantidad: i.cantidad }))
    );

    const esExportacion = tipo_operacion === 'Exportación';
    const tasa = esExportacion ? 0 : (tasa_impuesto === 'IGV' ? 0.18 : 0);
    const igv = totales.subtotalConDescuento * tasa;
    const costoEnvio = Number(costo_envio ?? 0);
    const total = totales.subtotalConDescuento + igv + costoEnvio;

    const count = await prisma.cotizaciones.count();
    const numero = `COT-${String(count + 1).padStart(6, '0')}`;

    const clienteIdProcesado = (() => {
      if (!cliente_id || cliente_id === 'none' || cliente_id.trim() === '') return null;
      return BigInt(cliente_id);
    })();

    // Construir notas con metadatos ERP
    let notasFinales = notas_internas ?? '';
    if (nombre_cliente_manual && !clienteIdProcesado) {
      notasFinales = `CLIENTE MANUAL: ${nombre_cliente_manual}\n\n${notasFinales}`.trim();
    }
    if (!notasFinales.includes('[ERP_META]')) {
      const erpMeta = JSON.stringify({ tipo_operacion, ...metadatos });
      notasFinales = notasFinales
        ? `${notasFinales}\n\n[ERP_META]: ${erpMeta}`
        : `[ERP_META]: ${erpMeta}`;
    }

    const estadoInicial =
      input.estado_inicial === 'enviada' ? 'enviada' : 'borrador';

    const itemsConVariante = await Promise.all(
      items.map(async (item) => {
        let varianteId = item.variante_id?.trim();
        if (!varianteId) {
          const variante = await prisma.variantes_producto.findFirst({
            where: {
              producto_id: BigInt(item.producto_id),
              estado: EstadoProducto.activo,
            },
            select: { id: true, color: true, talla: true },
            orderBy: { id: 'asc' },
          });
          if (!variante) {
            throw new Error(
              `El producto ${item.producto_id} no tiene variantes activas`,
            );
          }
          varianteId = variante.id.toString();
          if (!item.color_snapshot) item.color_snapshot = variante.color;
          if (!item.talla_snapshot) item.talla_snapshot = variante.talla;
        }
        return { ...item, variante_id: varianteId };
      }),
    );

    const cotizacion = await prisma.$transaction(async (tx) => {
      return tx.cotizaciones.create({
        data: {
          numero,
          cliente_id: clienteIdProcesado,
          estado: estadoInicial,
          origen: estadoInicial === 'enviada' ? 'manual_admin' : 'manual',
          subtotal: new Prisma.Decimal(totales.subtotalConDescuento),
          igv: new Prisma.Decimal(igv),
          total: new Prisma.Decimal(total),
          valida_hasta: new Date(valida_hasta),
          expira_at: new Date(valida_hasta),
          notas_internas: notasFinales,
          costo_envio: new Prisma.Decimal(costoEnvio),
          costo_total_estimado: new Prisma.Decimal(total),
          moneda: moneda ?? 'PEN',
          cotizacion_items: {
            create: itemsConVariante.map((item) => ({
              producto_id: BigInt(item.producto_id),
              variante_id: BigInt(item.variante_id),
              cantidad: item.cantidad,
              precio_unitario_snapshot: new Prisma.Decimal(item.precio_unitario),
              subtotal: new Prisma.Decimal(item.cantidad * item.precio_unitario),
              color_snapshot: item.color_snapshot || 'N/A',
              talla_snapshot: item.talla_snapshot || 'N/A',
              modelo_snapshot: item.modelo_snapshot,
              prenda_tipo_snapshot: item.prenda_tipo_snapshot,
            })),
          },
        },
        include: { cliente: true },
      });
    });

    // Llamamos al RPC para recalcular descuentos según las reglas de la base de datos
    await recalcularDescuentoCotizacion(Number(cotizacion.id)).catch((err: unknown) => {
      console.error('Error al recalcular descuento vía RPC:', err);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return serializeBigInt(buildCotizacionRow(cotizacion, today));
  },

  async actualizarEstado(
    id: string,
    nuevoEstado: 'enviada' | 'aprobada' | 'rechazada' | 'expirada' | 'borrador' | 'convertida',
    motivo?: string
  ): Promise<{ success: boolean; error?: string }> {
    const cotizacion = await prisma.cotizaciones.findUnique({ where: { id: BigInt(id) } });
    if (!cotizacion) return { success: false, error: 'Cotización no encontrada' };

    const transiciones: Record<string, string[]> = {
      borrador: ['enviada'],
      enviada: ['aprobada', 'rechazada', 'expirada'],
      aprobada: ['convertida'],
      rechazada: ['enviada'],
      expirada: ['enviada'],
      convertida: [],
    };

    const estadoActual = cotizacion.estado ?? 'borrador';
    const permitidos = transiciones[estadoActual] ?? [];

    if (!permitidos.includes(nuevoEstado)) {
      return {
        success: false,
        error: `No se puede cambiar de '${estadoActual}' a '${nuevoEstado}'. Permitidos: ${permitidos.join(', ')}`,
      };
    }

    const updateData: Prisma.cotizacionesUpdateInput = { estado: nuevoEstado as EstadoCotizacion };
    if (nuevoEstado === 'aprobada') updateData.aprobado_at = new Date();
    if (motivo) {
      const prefijo = nuevoEstado === 'rechazada' ? '[RECHAZO]' : '[NOTA]';
      updateData.notas_internas =
        `${cotizacion.notas_internas ?? ''}\n${prefijo}: ${motivo}`.trim();
    }

    await prisma.cotizaciones.update({ where: { id: BigInt(id) }, data: updateData });
    return { success: true };
  },

  async aprobar(
    id: string,
    precios?: PrecioItemAprobacion[],
  ): Promise<{ success: boolean; pedidoId?: number; error?: string }> {
    const cotizacion = await prisma.cotizaciones.findUnique({
      where: { id: BigInt(id) },
      include: { cotizacion_items: true },
    });

    if (!cotizacion) return { success: false, error: 'Cotización no encontrada' };

    if (cotizacion.estado !== 'enviada') {
      return {
        success: false,
        error: `Solo se pueden aprobar cotizaciones en estado 'enviada' (actual: '${cotizacion.estado}')`,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validaHasta = new Date(cotizacion.valida_hasta);
    validaHasta.setHours(0, 0, 0, 0);
    if (today > validaHasta) {
      return { success: false, error: 'La cotización está expirada.' };
    }

    if (precios?.length) {
      for (const p of precios) {
        if (p.precio_unitario <= 0) {
          return {
            success: false,
            error: `Precio inválido en ítem ${p.item_id}`,
          };
        }
        const existe = cotizacion.cotizacion_items.some(
          (i) => Number(i.id) === p.item_id,
        );
        if (!existe) {
          return { success: false, error: `Ítem ${p.item_id} no pertenece a la cotización` };
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (precios?.length) {
        for (const p of precios) {
          const item = cotizacion.cotizacion_items.find(
            (i) => Number(i.id) === p.item_id,
          );
          if (!item) continue;
          const subtotalLinea = item.cantidad * p.precio_unitario;
          await tx.cotizacion_items.update({
            where: { id: item.id },
            data: {
              precio_unitario_snapshot: new Prisma.Decimal(p.precio_unitario),
              subtotal: new Prisma.Decimal(subtotalLinea),
            },
          });
        }
      }

      const itemsActualizados = await tx.cotizacion_items.findMany({
        where: { cotizacion_id: BigInt(id) },
      });

      const subtotalBruto = itemsActualizados.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0,
      );
      const montoDescuento = Number(cotizacion.monto_descuento ?? 0);
      const subtotalNeto = Math.max(0, subtotalBruto - montoDescuento);
      const igv = subtotalNeto * 0.18;
      const costoEnvio = Number(cotizacion.costo_envio ?? 0);
      const total = subtotalNeto + igv + costoEnvio;

      const totalUnidades = itemsActualizados.reduce(
        (sum, item) => sum + item.cantidad,
        0,
      );

      const pedido = await tx.pedidos.create({
        data: {
          cliente_id: cotizacion.cliente_id,
          cotizacion_id: cotizacion.id,
          estado: 'pendiente',
          prioridad: 'normal',
          notas_pedido: cotizacion.notas_internas ?? null,
          direccion_despacho: cotizacion.direccion_despacho ?? null,
          total_unidades: totalUnidades,
          subtotal: new Prisma.Decimal(subtotalBruto),
          igv: new Prisma.Decimal(igv),
          total: new Prisma.Decimal(total),
          total_estimado: new Prisma.Decimal(total),
          monto_descuento: new Prisma.Decimal(montoDescuento),
          costo_envio: cotizacion.costo_envio ?? new Prisma.Decimal(0),
          saldo_pendiente: new Prisma.Decimal(total),
          moneda: cotizacion.moneda ?? 'PEN',
          pedido_items: {
            create: itemsActualizados.map((item) => ({
              producto_id: item.producto_id,
              variante_id: item.variante_id,
              cantidad: item.cantidad,
              especificaciones: {
                precio_unitario: Number(item.precio_unitario_snapshot),
                subtotal: Number(item.subtotal),
                color: item.color_snapshot,
                modelo: item.modelo_snapshot,
                prenda_tipo: item.prenda_tipo_snapshot,
                talla: item.talla_snapshot,
              },
            })),
          },
        },
      });

      await tx.seguimiento_pedido.create({
        data: {
          pedido_id: pedido.id,
          status: 'pendiente',
          notas:
            'Cotización aprobada y convertida en pedido de producción.',
        },
      });

      await tx.cotizaciones.update({
        where: { id: BigInt(id) },
        data: {
          subtotal: new Prisma.Decimal(subtotalBruto),
          igv: new Prisma.Decimal(igv),
          total: new Prisma.Decimal(total),
          costo_total_estimado: new Prisma.Decimal(total),
          estado: 'convertida',
          aprobado_at: new Date(),
        },
      });

      return { pedidoId: Number(pedido.id), clienteId: cotizacion.cliente_id };
    });

    if (result.clienteId) {
      await notificarClienteSobrePedido({
        clienteId: result.clienteId,
        pedidoId: BigInt(result.pedidoId),
        titulo: 'Cotización aprobada',
        mensaje: `Su cotización fue aprobada y se generó el pedido #${result.pedidoId}. Puede seguir el avance en Trazabilidad.`,
      });
    }

    return { success: true, pedidoId: result.pedidoId };
  },

  async rechazar(id: string, motivo?: string): Promise<{ success: boolean; error?: string }> {
    const cotizacion = await prisma.cotizaciones.findUnique({ where: { id: BigInt(id) } });
    if (!cotizacion) return { success: false, error: 'Cotización no encontrada' };

    if (cotizacion.estado !== 'enviada') {
      return {
        success: false,
        error: `Solo se pueden rechazar cotizaciones en estado 'enviada' (actual: '${cotizacion.estado}')`,
      };
    }

    await prisma.cotizaciones.update({
      where: { id: BigInt(id) },
      data: {
        estado: 'rechazada',
        notas_internas: motivo
          ? `${cotizacion.notas_internas ?? ''}\n[RECHAZO]: ${motivo}`.trim()
          : cotizacion.notas_internas,
      },
    });

    if (cotizacion.cliente_id) {
      await crearNotificacionCliente({
        clienteId: cotizacion.cliente_id,
        tipo: 'sistema',
        referencia_tipo: 'COTIZACION',
        referencia_id: cotizacion.id,
        url_destino: '/portal/cotizaciones',
        titulo: 'Cotización rechazada',
        mensaje:
          motivo?.trim()
            ? `Su cotización fue rechazada. Motivo: ${motivo.trim()}`
            : 'Su cotización fue rechazada. Contacte a su asesor comercial para más detalle.',
      });
    }

    return { success: true };
  },

  async listarProductos() {
    const productos = await prisma.productos.findMany({
      where: { estado: EstadoProducto.activo },
      select: {
        id: true,
        nombre: true,
        sku: true,
        precio: true,
        variantes_producto: {
          where: { estado: EstadoProducto.activo },
          select: { id: true, color: true, talla: true, sku: true },
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
      orderBy: { nombre: 'asc' },
    });
    return serializeBigInt(
      productos.map((p) => ({
        id: Number(p.id),
        nombre: p.nombre,
        sku: p.sku,
        precio: Number(p.precio),
        variantes: p.variantes_producto.map((v) => ({
          id: Number(v.id),
          color: v.color,
          talla: v.talla,
          sku: v.sku,
        })),
      })),
    );
  },

  async listarClientes() {
    const clientes = await prisma.clientes.findMany({
      where: { estado: EstadoCliente.activo },
      select: { id: true, razon_social: true, ruc: true },
      orderBy: { razon_social: 'asc' },
    });
    return serializeBigInt(
      clientes.map((c) => ({
        id: Number(c.id),
        razon_social: c.razon_social,
        ruc: c.ruc,
      }))
    );
  },
};