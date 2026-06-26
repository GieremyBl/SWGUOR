import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { REGLAS_NEGOCIO } from '@/lib/constants/estados';
import { resolverItemsPedido } from '@/lib/helpers/portal-pedido-items.helper';
import { resolverCostoEnvioPedido } from '@/lib/helpers/portal-costo-envio.helper';
import { descontarStockLineaPedido } from '@/lib/helpers/producto-stock-transaction.helper';
import { notificarClienteSobrePedido } from '@/lib/helpers/pedido-seguimiento.helper';
import { calcularDescuentosEscalaAutomaticos } from '@/lib/services/descuento-escala-automatico.service';

const IGV_RATE = 0.18;
const PREVIEW_TTL_MS = 30 * 60 * 1000;

export interface GuorinoPedidoItemInput {
  producto_id: number;
  cantidad: number;
  variante_id?: number | null;
  color_snapshot?: string;
  talla_snapshot?: string;
}

export interface GuorinoPedidoPreview {
  id: string;
  cliente_id: string;
  created_at: string;
  expira_en: string;
  items: Array<{
    producto_id: number;
    variante_id: number;
    nombre: string;
    sku: string | null;
    talla: string;
    color: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    stock_disponible: number;
    moq: number;
  }>;
  totales: {
    subtotal_bruto: number;
    monto_descuento: number;
    subtotal_con_descuento: number;
    igv: number;
    costo_envio: number;
    total: number;
    total_unidades: number;
    cumple_moq_global: boolean;
  };
  errores: string[];
  advertencias: string[];
  sugerencias: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    items: GuorinoPedidoItemInput[];
  }>;
  direccion_despacho: string | null;
  notas_cliente: string | null;
}

function clavePreview(clienteId: bigint, previewId: string) {
  return `guorino_preview_${clienteId}_${previewId}`;
}

async function stockDisponibleVariante(varianteId: bigint, cantidad: number) {
  const variante = await prisma.variantes_producto.findUnique({
    where: { id: varianteId },
    select: { id: true, stock: true },
  });
  if (!variante) return { ok: false, disponible: 0 };

  const reservasActivas = await prisma.reservas_stock.findMany({
    where: {
      variante_id: varianteId,
      estado: 'activa',
      expira_en: { gt: new Date() },
    },
    select: { cantidad: true },
  });
  const reservado = reservasActivas.reduce((s, r) => s + r.cantidad, 0);
  const disponible = variante.stock - reservado;
  return { ok: cantidad <= disponible, disponible };
}

async function guardarPreview(clienteId: bigint, preview: GuorinoPedidoPreview) {
  await prisma.configuracion_sistema.upsert({
    where: { clave: clavePreview(clienteId, preview.id) },
    create: {
      clave: clavePreview(clienteId, preview.id),
      valor: JSON.stringify(preview),
      categoria: 'guorino',
      tipo_dato: 'json',
      descripcion: 'Borrador de pedido Guorino',
    },
    update: { valor: JSON.stringify(preview), updated_at: new Date() },
  });
}

async function leerPreview(clienteId: bigint, previewId: string): Promise<GuorinoPedidoPreview | null> {
  const row = await prisma.configuracion_sistema.findUnique({
    where: { clave: clavePreview(clienteId, previewId) },
    select: { valor: true },
  });
  if (!row?.valor) return null;
  try {
    const preview = JSON.parse(row.valor) as GuorinoPedidoPreview;
    if (new Date(preview.expira_en).getTime() < Date.now()) return null;
    return preview;
  } catch {
    return null;
  }
}

async function eliminarPreview(clienteId: bigint, previewId: string) {
  await prisma.configuracion_sistema.deleteMany({
    where: { clave: clavePreview(clienteId, previewId) },
  });
}

function sugerirCantidadMoq(cantidad: number, moq: number): number {
  if (cantidad >= moq) return cantidad;
  return moq;
}

export async function prepararPedidoGuorino(params: {
  clienteId: bigint;
  items: GuorinoPedidoItemInput[];
  direccion_despacho?: string | null;
  notas_cliente?: string | null;
}): Promise<GuorinoPedidoPreview> {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const sugerencias: GuorinoPedidoPreview['sugerencias'] = [];

  if (!params.items?.length) {
    throw new Error('Debe indicar al menos un producto para el pedido.');
  }

  const itemsResueltos = await resolverItemsPedido(params.items);
  if ('error' in itemsResueltos) {
    throw new Error(
      'No hay variante activa para uno de los productos solicitados. Revise talla/color o elija otro modelo del catálogo.',
    );
  }

  const productoIds = [...new Set(itemsResueltos.items.map((i) => BigInt(i.producto_id)))];
  const productos = await prisma.productos.findMany({
    where: { id: { in: productoIds }, estado: 'activo' },
    select: {
      id: true,
      nombre: true,
      sku: true,
      precio: true,
      moq: true,
    },
  });
  const productoMap = new Map(productos.map((p) => [Number(p.id), p]));

  const varianteIds = [...new Set(itemsResueltos.items.map((i) => BigInt(i.variante_id)))];
  const variantes = await prisma.variantes_producto.findMany({
    where: { id: { in: varianteIds } },
    select: { id: true, talla: true, color: true },
  });
  const varianteMap = new Map(variantes.map((v) => [Number(v.id), v]));

  const lineasPreview: GuorinoPedidoPreview['items'] = [];

  for (const item of itemsResueltos.items) {
    const producto = productoMap.get(Number(item.producto_id));
    if (!producto) {
      errores.push(`El producto #${item.producto_id} no está disponible.`);
      continue;
    }

    const moq = producto.moq ?? REGLAS_NEGOCIO.MOQ_GENERAL;
    const cantidad = Number(item.cantidad);
    const stock = await stockDisponibleVariante(BigInt(item.variante_id), cantidad);

    if (!stock.ok) {
      errores.push(
        `Stock insuficiente para "${producto.nombre}": solicitó ${cantidad}, disponible ${stock.disponible}.`,
      );
    }

    if (cantidad < moq) {
      errores.push(
        `MOQ no cumplido en "${producto.nombre}": mínimo ${moq} uds, solicitó ${cantidad}.`,
      );
      const sugerenciaId = `sug_moq_${producto.id}`;
      if (!sugerencias.some((s) => s.id === sugerenciaId)) {
        sugerencias.push({
          id: sugerenciaId,
          titulo: `Ajustar a MOQ en ${producto.nombre}`,
          descripcion: `¿Desea pedir ${sugerirCantidadMoq(cantidad, moq)} unidades para cumplir el mínimo de ${moq}?`,
          items: itemsResueltos.items.map((linea) =>
            Number(linea.producto_id) === Number(producto.id)
              ? { ...linea, cantidad: sugerirCantidadMoq(cantidad, moq) }
              : linea,
          ),
        });
      }
    }

    const precio = Number(producto.precio);
    const variante = varianteMap.get(Number(item.variante_id));
    const talla = item.talla_snapshot?.trim() || variante?.talla || '—';
    const color = item.color_snapshot?.trim() || variante?.color || '—';

    lineasPreview.push({
      producto_id: Number(producto.id),
      variante_id: Number(item.variante_id),
      nombre: producto.nombre,
      sku: producto.sku,
      talla,
      color,
      cantidad,
      precio_unitario: precio,
      subtotal: precio * cantidad,
      stock_disponible: stock.disponible,
      moq,
    });
  }

  const itemsCalculo = lineasPreview.map((l) => ({
    producto_id: l.producto_id,
    cantidad: l.cantidad,
    precio_unitario: l.precio_unitario,
  }));

  const { costo_envio: costoEnvio } = await resolverCostoEnvioPedido({});
  const descuentos = await calcularDescuentosEscalaAutomaticos(itemsCalculo, {
    costoEnvio,
    tasaIgv: IGV_RATE,
  });

  if (!descuentos.cumpleMOQ) {
    advertencias.push(
      `El pedido no alcanza el MOQ global de ${REGLAS_NEGOCIO.MOQ_GENERAL} unidades (actual: ${descuentos.cantidadTotal}).`,
    );
  }

  const previewId = `prev_${Date.now()}`;
  const ahora = new Date();

  const preview: GuorinoPedidoPreview = {
    id: previewId,
    cliente_id: String(params.clienteId),
    created_at: ahora.toISOString(),
    expira_en: new Date(ahora.getTime() + PREVIEW_TTL_MS).toISOString(),
    items: lineasPreview,
    totales: {
      subtotal_bruto: descuentos.subtotalBruto,
      monto_descuento: descuentos.montoDescuento,
      subtotal_con_descuento: descuentos.subtotalConDescuento,
      igv: descuentos.igv,
      costo_envio: costoEnvio,
      total: descuentos.total,
      total_unidades: descuentos.cantidadTotal,
      cumple_moq_global: descuentos.cumpleMOQ,
    },
    errores,
    advertencias,
    sugerencias,
    direccion_despacho: params.direccion_despacho ?? null,
    notas_cliente: params.notas_cliente ?? null,
  };

  await guardarPreview(params.clienteId, preview);
  return preview;
}

export async function obtenerPreviewPedidoGuorino(
  clienteId: bigint,
  previewId: string,
): Promise<GuorinoPedidoPreview | null> {
  const preview = await leerPreview(clienteId, previewId);
  if (!preview || preview.cliente_id !== String(clienteId)) return null;
  return preview;
}

export async function confirmarPedidoGuorino(params: {
  clienteId: bigint;
  usuarioId: bigint;
  previewId: string;
}): Promise<{ pedidoId: bigint }> {
  const preview = await leerPreview(params.clienteId, params.previewId);
  if (!preview) {
    throw new Error('La previsualización del pedido expiró. Solicite a Guorino armar el pedido nuevamente.');
  }

  if (preview.errores.length > 0) {
    throw new Error('No se puede confirmar el pedido porque no cumple stock o reglas de negocio.');
  }

  if (!preview.totales.cumple_moq_global) {
    throw new Error(
      `El pedido no cumple el MOQ global de ${REGLAS_NEGOCIO.MOQ_GENERAL} unidades.`,
    );
  }

  for (const item of preview.items) {
    const check = await stockDisponibleVariante(BigInt(item.variante_id), item.cantidad);
    if (!check.ok) {
      throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${check.disponible}.`);
    }
  }

  const { costo_envio: costoEnvio, zona_envio_id: zonaEnvioId } =
    await resolverCostoEnvioPedido({});

  const resultado = await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedidos.create({
      data: {
        cliente_id: params.clienteId,
        created_by: params.usuarioId,
        estado: 'pendiente',
        subtotal: new Prisma.Decimal(preview.totales.subtotal_con_descuento),
        igv: new Prisma.Decimal(preview.totales.igv),
        total: new Prisma.Decimal(preview.totales.total),
        total_estimado: new Prisma.Decimal(preview.totales.total),
        monto_descuento: new Prisma.Decimal(preview.totales.monto_descuento),
        costo_envio: new Prisma.Decimal(costoEnvio),
        total_unidades: preview.totales.total_unidades,
        moq_aplicado: REGLAS_NEGOCIO.MOQ_GENERAL,
        direccion_despacho: preview.direccion_despacho,
        notas_cliente: preview.notas_cliente
          ? `${preview.notas_cliente} | Generado por Guorino`
          : 'Pedido generado por Guorino Asesor',
        zona_envio_id: zonaEnvioId,
        moneda: 'PEN',
        saldo_pendiente: new Prisma.Decimal(preview.totales.total),
        pedido_items: {
          create: preview.items.map((item) => ({
            producto_id: BigInt(item.producto_id),
            variante_id: BigInt(item.variante_id),
            cantidad: item.cantidad,
            especificaciones: { precio_unitario: item.precio_unitario },
          })),
        },
      },
    });

    // No creamos reservas_stock aquí: el pedido se confirma y el stock se descuenta
    // de inmediato. Un INSERT en reservas_stock dispara un trigger de BD que aún
    // referencia movimientos_inventario.referencia_id (columna eliminada del esquema).
    for (const item of preview.items) {
      await descontarStockLineaPedido(tx, {
        producto_id: item.producto_id,
        variante_id: item.variante_id,
        cantidad: item.cantidad,
      });
    }

    await tx.seguimiento_pedido.create({
      data: {
        pedido_id: pedido.id,
        status: 'pendiente',
        notas: 'Pedido creado y confirmado desde Guorino Asesor.',
      },
    });

    return pedido;
  });

  await eliminarPreview(params.clienteId, params.previewId);

  await notificarClienteSobrePedido({
    clienteId: params.clienteId,
    pedidoId: resultado.id,
    titulo: 'Pedido registrado por Guorino',
    mensaje: `Su pedido #${resultado.id} fue creado. Revise el detalle y continúe con el pago cuando lo desee.`,
  });

  return { pedidoId: resultado.id };
}

export async function rechazarPreviewPedidoGuorino(clienteId: bigint, previewId: string) {
  await eliminarPreview(clienteId, previewId);
}
