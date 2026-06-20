import { prisma } from '@/lib/prisma';
import type {
  AdminPagoDetalle,
  AdminPagoDetalleComprobante,
  AdminPagoDetallePedido,
  AdminPagoDetalleUsuario,
} from '@/lib/schemas/admin-pago-detalle';

function mapUsuario(
  usuario: {
    id: bigint;
    personal_interno: { nombre_completo: string | null }[];
  } | null,
): AdminPagoDetalleUsuario | null {
  if (!usuario) return null;
  return {
    id: Number(usuario.id),
    nombre_completo: usuario.personal_interno[0]?.nombre_completo ?? 'Sistema',
  };
}

function mapComprobante(
  comprobante: {
    id_uuid: string;
    tipo: string;
    serie: string;
    correlativo: string;
    numero_completo: string | null;
    subtotal: unknown;
    igv: unknown;
    total: unknown;
    moneda: string;
    estado_sunat: string;
    fecha_emision: Date;
    pdf_url: string | null;
    xml_url: string | null;
    cdr_url: string | null;
  } | undefined,
): AdminPagoDetalleComprobante | null {
  if (!comprobante) return null;

  return {
    id: comprobante.id_uuid,
    tipo: comprobante.tipo,
    serie: comprobante.serie,
    correlativo: comprobante.correlativo,
    numero_completo: comprobante.numero_completo,
    subtotal: Number(comprobante.subtotal ?? 0),
    igv: Number(comprobante.igv ?? 0),
    total: Number(comprobante.total ?? 0),
    moneda: comprobante.moneda,
    estado_sunat: comprobante.estado_sunat,
    fecha_emision: comprobante.fecha_emision.toISOString(),
    pdf_url: comprobante.pdf_url,
    xml_url: comprobante.xml_url,
    cdr_url: comprobante.cdr_url,
  };
}

export async function obtenerPagoDetalleAdmin(idUuid: string): Promise<AdminPagoDetalle | null> {
  const pago = await prisma.pagos.findUnique({
    where: { id_uuid: idUuid },
    include: {
      pedidos: {
        select: {
          id: true,
          estado: true,
          created_at: true,
          total: true,
          monto_pagado: true,
          saldo_pendiente: true,
          moneda: true,
          total_unidades: true,
          clientes: {
            select: {
              id: true,
              ruc: true,
              razon_social: true,
              nombre_comercial: true,
              email: true,
              telefono: true,
            },
          },
          pedido_items: {
            take: 6,
            orderBy: { id: 'asc' },
            select: {
              cantidad: true,
              productos: {
                select: { nombre: true, sku: true },
              },
            },
          },
          _count: {
            select: { pedido_items: true },
          },
        },
      },
      comprobantes: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      usuario: {
        select: {
          id: true,
          personal_interno: {
            select: { nombre_completo: true },
            take: 1,
          },
        },
      },
      verificado_por_usuario: {
        select: {
          id: true,
          personal_interno: {
            select: { nombre_completo: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!pago?.pedidos) return null;

  const pedidoRaw = pago.pedidos;
  const pedido: AdminPagoDetallePedido = {
    id: Number(pedidoRaw.id),
    estado: pedidoRaw.estado,
    created_at: pedidoRaw.created_at?.toISOString() ?? null,
    total: Number(pedidoRaw.total ?? 0),
    monto_pagado: Number(pedidoRaw.monto_pagado ?? 0),
    saldo_pendiente: Number(pedidoRaw.saldo_pendiente ?? 0),
    moneda: pedidoRaw.moneda,
    total_unidades: pedidoRaw.total_unidades,
    items_count: pedidoRaw._count.pedido_items,
    items: pedidoRaw.pedido_items.map((item: typeof pedidoRaw.pedido_items[number]) => ({
      cantidad: item.cantidad,
      subtotal: 0,
      producto_nombre: item.productos?.nombre ?? 'Producto',
      producto_sku: item.productos?.sku ?? null,
    })),
    cliente: pedidoRaw.clientes
      ? {
        id: Number(pedidoRaw.clientes.id),
        ruc: pedidoRaw.clientes.ruc,
        razon_social: pedidoRaw.clientes.razon_social,
        nombre_comercial: pedidoRaw.clientes.nombre_comercial,
        email: pedidoRaw.clientes.email,
        telefono: pedidoRaw.clientes.telefono,
      }
      : null,
  };

  return {
    id_uuid: pago.id_uuid,
    pedido_id: Number(pago.pedido_id),
    monto: Number(pago.monto ?? 0),
    metodo_pago: pago.metodo_pago,
    tipo: pago.tipo,
    estado: pago.estado,
    fecha_pago: pago.fecha_pago.toISOString(),
    notas: pago.notas,
    verificado_at: pago.verificado_at?.toISOString() ?? null,
    usuario: mapUsuario(pago.usuario),
    verificado_por_usuario: mapUsuario(pago.verificado_por_usuario),
    pedido,
    comprobante: mapComprobante(pago.comprobantes[0]),
  };
}
