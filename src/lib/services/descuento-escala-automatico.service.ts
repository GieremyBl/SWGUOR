import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ESTADO_DESCUENTO_APLICACION } from '@/lib/constants/promociones';
import { REGLAS_NEGOCIO } from '@/lib/constants/estados';
import { reglaAplicaEnCompra } from '@/lib/helpers/promociones-catalogo.helper';
import { multiplyMoney, roundMoney } from '@/lib/helpers/money.helper';

export interface ItemCompraDescuento {
  producto_id: bigint | number | string;
  cantidad: number;
  precio_unitario: number;
}

export interface DescuentoProductoDetalle {
  producto_id: string;
  cantidad: number;
  subtotal_bruto: number;
  regla_id: string | null;
  porcentaje_descuento: number;
  monto_descuento: number;
}

export interface OpcionesCalculoDescuento {
  costoEnvio?: number;
  tasaIgv?: number;
  moq?: number;
}

export interface ResultadoDescuentoEscala {
  subtotalBruto: number;
  cantidadTotal: number;
  montoDescuento: number;
  subtotalConDescuento: number;
  igv: number;
  costoEnvio: number;
  total: number;
  cumpleMOQ: boolean;
  detallePorProducto: DescuentoProductoDetalle[];
}

type ReglaVigente = {
  id: bigint;
  cantidad_min: number;
  valor_descuento: Prisma.Decimal;
  oferta_reglas: Array<{
    ofertas: { activo: boolean; fecha_inicio: Date; fecha_fin: Date | null };
  }>;
  promocion_reglas: Array<{
    promociones: { activo: boolean; fecha_inicio: Date; fecha_fin: Date | null };
  }>;
  descuento_aplicaciones: Array<{
    aplicable_tipo: string;
    aplicable_id: bigint;
    estado: string;
    descripcion?: string | null;
  }>;
};

function isVigenteCampana(
  inicio: Date,
  fin: Date | null,
  now: Date,
): boolean {
  if (inicio > now) return false;
  if (fin && fin < now) return false;
  return true;
}

function reglaVigenteEnCampanas(regla: ReglaVigente, now: Date): boolean {
  const ofertasOk = regla.oferta_reglas.some(
    (or) =>
      or.ofertas.activo &&
      isVigenteCampana(or.ofertas.fecha_inicio, or.ofertas.fecha_fin, now),
  );
  const promosOk = regla.promocion_reglas.some(
    (pr) =>
      pr.promociones.activo &&
      isVigenteCampana(pr.promociones.fecha_inicio, pr.promociones.fecha_fin, now),
  );
  const tieneCampana =
    regla.oferta_reglas.length > 0 || regla.promocion_reglas.length > 0;
  if (tieneCampana) return ofertasOk || promosOk;
  return true;
}

async function cargarReglasVigentes(now: Date): Promise<ReglaVigente[]> {
  const reglas = await prisma.reglas_descuento.findMany({
    where: {
      activo: true,
      fecha_inicio: { lte: now },
      fecha_fin: { gte: now },
    },
    include: {
      descuento_aplicaciones: {
        where: { estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO } },
      },
      oferta_reglas: { include: { ofertas: true } },
      promocion_reglas: { include: { promociones: true } },
    },
  });

  return reglas.filter((r) => reglaVigenteEnCampanas(r as ReglaVigente, now)) as ReglaVigente[];
}

function seleccionarReglaPorCantidad(
  reglas: ReglaVigente[],
  productoId: bigint,
  categoriaId: bigint | null,
  cantidad: number,
): ReglaVigente | null {
  const candidatas = reglas.filter(
    (regla) =>
      regla.cantidad_min <= cantidad &&
      reglaAplicaEnCompra(
        {
          id: regla.id,
          descuento_aplicaciones: regla.descuento_aplicaciones,
        },
        productoId,
        categoriaId,
      ),
  );

  if (candidatas.length === 0) return null;

  candidatas.sort((a, b) => b.cantidad_min - a.cantidad_min);
  return candidatas[0];
}

export async function calcularDescuentosEscalaAutomaticos(
  items: ItemCompraDescuento[],
  options: OpcionesCalculoDescuento = {},
): Promise<ResultadoDescuentoEscala> {
  const now = new Date();
  const reglas = await cargarReglasVigentes(now);

  const productoIds = [...new Set(items.map((i) => BigInt(i.producto_id)))];
  const productos = await prisma.productos.findMany({
    where: { id: { in: productoIds } },
    select: { id: true, categoria_id: true },
  });
  const categoriaMap = new Map(productos.map((p) => [p.id, p.categoria_id]));

  const grupos = new Map<string, { cantidad: number; subtotal: number }>();
  for (const item of items) {
    const pid = String(item.producto_id);
    const lineSubtotal = multiplyMoney(item.precio_unitario, item.cantidad);
    const grupo = grupos.get(pid) ?? { cantidad: 0, subtotal: 0 };
    grupo.cantidad += item.cantidad;
    grupo.subtotal = roundMoney(grupo.subtotal + lineSubtotal);
    grupos.set(pid, grupo);
  }

  let montoDescuentoTotal = 0;
  const detallePorProducto: DescuentoProductoDetalle[] = [];

  for (const [pid, grupo] of grupos) {
    const productoId = BigInt(pid);
    const categoriaId = categoriaMap.get(productoId) ?? null;
    const regla = seleccionarReglaPorCantidad(
      reglas,
      productoId,
      categoriaId,
      grupo.cantidad,
    );
    const porcentaje = regla ? Number(regla.valor_descuento) : 0;
    const montoDescuento = multiplyMoney(grupo.subtotal, porcentaje / 100);
    montoDescuentoTotal = roundMoney(montoDescuentoTotal + montoDescuento);

    detallePorProducto.push({
      producto_id: pid,
      cantidad: grupo.cantidad,
      subtotal_bruto: grupo.subtotal,
      regla_id: regla ? String(regla.id) : null,
      porcentaje_descuento: porcentaje,
      monto_descuento: montoDescuento,
    });
  }

  const subtotalBruto = roundMoney(
    items.reduce(
      (sum, i) => sum + multiplyMoney(i.precio_unitario, i.cantidad),
      0,
    ),
  );
  const cantidadTotal = items.reduce((sum, i) => sum + i.cantidad, 0);
  const montoDescuento = roundMoney(montoDescuentoTotal);
  const subtotalConDescuento = roundMoney(subtotalBruto - montoDescuento);
  const tasaIgv = options.tasaIgv ?? 0.18;
  const igv = multiplyMoney(subtotalConDescuento, tasaIgv);
  const costoEnvio = roundMoney(options.costoEnvio ?? 0);
  const total = roundMoney(subtotalConDescuento + igv + costoEnvio);
  const moq = options.moq ?? REGLAS_NEGOCIO.MOQ_GENERAL;

  return {
    subtotalBruto,
    cantidadTotal,
    montoDescuento,
    subtotalConDescuento,
    igv,
    costoEnvio,
    total,
    cumpleMOQ: cantidadTotal >= moq,
    detallePorProducto,
  };
}

export async function recalcularDescuentoCotizacionEnDb(
  cotizacionId: bigint,
): Promise<ResultadoDescuentoEscala> {
  const cotizacion = await prisma.cotizaciones.findUnique({
    where: { id: cotizacionId },
    include: { cotizacion_items: true },
  });

  if (!cotizacion) {
    throw new Error('Cotización no encontrada');
  }

  const items: ItemCompraDescuento[] = cotizacion.cotizacion_items.map((item) => ({
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: Number(item.precio_unitario_snapshot),
  }));

  const costoEnvio = Number(cotizacion.costo_envio ?? 0);
  const totales = await calcularDescuentosEscalaAutomaticos(items, { costoEnvio });

  await prisma.cotizaciones.update({
    where: { id: cotizacionId },
    data: {
      subtotal: new Prisma.Decimal(totales.subtotalBruto),
      monto_descuento: new Prisma.Decimal(totales.montoDescuento),
      igv: new Prisma.Decimal(totales.igv),
      total: new Prisma.Decimal(totales.total),
      costo_total_estimado: new Prisma.Decimal(totales.total),
    },
  });

  return totales;
}
