export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireServerAuth } from '@/lib/auth/server';
import {
  resolveCartMoq,
  ORIGEN_COTIZACION_SOLICITUD,
} from '@/lib/constants/portal-b2b';

// ─────────────────────────────────────────────────────────────
// Helper: generar número de cotización YYMMDD-HHMMSS-{ID}
// ─────────────────────────────────────────────────────────────
function generarNumeroCotizacion(id: number): string {
  const now = new Date();

  const YY = String(now.getFullYear()).slice(2);               // "26"
  const MM = String(now.getMonth() + 1).padStart(2, '0');     // "05"
  const DD = String(now.getDate()).padStart(2, '0');           // "07"
  const HH = String(now.getHours()).padStart(2, '0');          // "14"
  const Min = String(now.getMinutes()).padStart(2, '0');        // "58"
  const SS = String(now.getSeconds()).padStart(2, '0');        // "32"

  return `COT-${YY}${MM}${DD}-${HH}${Min}${SS}-${id}`;
  // Ejemplo: COT-260507-145832-42
}

// ─────────────────────────────────────────────────────────────
// Helper: obtener el cliente_id del usuario autenticado
// ─────────────────────────────────────────────────────────────
async function obtenerClienteSesion() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status };
  }

  const clienteDb = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true, razon_social: true, ruc: true, estado: true },
  });

  if (!clienteDb) {
    return { error: 'cliente_no_encontrado' as const, status: 404 };
  }

  return {
    auth_user_id: auth.user.authId,
    usuario_id: auth.user.id,
    cliente_id: clienteDb.id,
    cliente: clienteDb,
  };
}

// ─────────────────────────────────────────────────────────────
// GET: Historial de cotizaciones
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const sesion = await obtenerClienteSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status },
      );
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');

    const where: any = { cliente_id: sesion.cliente_id };
    if (estado && estado !== 'todos') where.estado = estado;

    const cotizaciones = await prisma.cotizaciones.findMany({
      where,
      include: {
        cotizacion_items: {
          include: {
            productos: { select: { id: true, nombre: true, sku: true } },
            variantes_producto: { select: { id: true, nombre: true, color: true, talla: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = cotizaciones.map(c => ({
      ...serializeBigInt(c),
      esta_expirada: c.expira_at ? new Date(c.expira_at) < new Date() : false,
      items_count: c.cotizacion_items.length,
    }));

    return NextResponse.json({
      success: true,
      data,
      cliente: serializeBigInt(sesion.cliente),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST: Crear cotización
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const sesion = await obtenerClienteSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status },
      );
    }

    const body = await req.json();
    const {
      items, notas_internas, direccion_despacho,
      moneda, estado, costo_envio, tipo_solicitud, origen,
    } = body;

    const esSolicitudConsulta =
      tipo_solicitud === 'consulta' || origen === ORIGEN_COTIZACION_SOLICITUD;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items requeridos' },
        { status: 400 },
      );
    }

    // ── Cálculo de totales ──────────────────────────────────
    const costoEnvio = Number(costo_envio ?? 0);
    const totales = calcularTotalesCotizacion(
      items.map((i: any) => ({
        precioBase: Number(i.precio_unitario),
        cantidad: Number(i.cantidad),
      })),
      costoEnvio,
    );

    if (!esSolicitudConsulta && !totales.cumpleMOQ) {
      return NextResponse.json({
        success: false,
        error: 'error_negocio',
        mensaje: `No se cumple el MOQ de ${resolveCartMoq(items)} unidades.`,
        detalle: totales,
      }, { status: 400 });
    }

    const validaHasta = new Date();
    validaHasta.setDate(validaHasta.getDate() + 7);

    // ── Crear registro — el número se genera DESPUÉS de obtener el ID ──
    const cotizacion = await prisma.$transaction(async tx => {
      // 1. Insertar con número temporal para obtener el ID autoincremental
      const nueva = await tx.cotizaciones.create({
        data: {
          numero: 'PENDIENTE',           // se sobreescribe abajo
          cliente_id: sesion.cliente_id,
          estado: estado ?? (esSolicitudConsulta ? 'enviada' : 'borrador'),
          origen: esSolicitudConsulta ? ORIGEN_COTIZACION_SOLICITUD : (origen ?? 'manual'),
          subtotal: new Prisma.Decimal(totales.subtotalBruto),
          igv: new Prisma.Decimal(totales.igv),
          total: new Prisma.Decimal(totales.total),
          valida_hasta: validaHasta,
          expira_at: validaHasta,
          direccion_despacho: direccion_despacho ?? null,
          monto_descuento: new Prisma.Decimal(totales.montoDescuento),
          costo_envio: new Prisma.Decimal(costoEnvio),
          costo_total_estimado: new Prisma.Decimal(totales.total),
          moneda: moneda ?? 'PEN',
          notas_internas: notas_internas ?? null,
          cotizacion_items: {
            create: items.map((item: any) => ({
              producto_id: BigInt(item.producto_id),
              variante_id: item.variante_id ? BigInt(item.variante_id) : null,
              cantidad: Number(item.cantidad),
              precio_unitario_snapshot: new Prisma.Decimal(item.precio_unitario),
              subtotal: new Prisma.Decimal(item.cantidad * item.precio_unitario),
              color_snapshot: item.color_snapshot || 'N/A',
              talla_snapshot: item.talla_snapshot || 'N/A',
              modelo_snapshot: item.modelo_snapshot || null,
              prenda_tipo_snapshot: item.prenda_tipo_snapshot || null,
            })) as Prisma.cotizacion_itemsUncheckedCreateWithoutCotizacionesInput[],
          },
        },
        include: {
          cotizacion_items: {
            include: {
              productos: { select: { id: true, nombre: true } },
              variantes_producto: { select: { id: true, nombre: true, color: true, talla: true } },
            },
          },
        },
      });

      // 2. Actualizar el número usando el ID real recién generado
      const numero = generarNumeroCotizacion(Number(nueva.id));
      const actualizada = await tx.cotizaciones.update({
        where: { id: nueva.id },
        data: { numero },
        include: {
          cotizacion_items: {
            include: {
              productos: { select: { id: true, nombre: true } },
              variantes_producto: { select: { id: true, nombre: true, color: true, talla: true } },
            },
          },
        },
      });

      return actualizada;
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(cotizacion),
      calculo: totales,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Portal] Error al crear cotización:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// Lógica de negocio — Calculadora B2B
// ─────────────────────────────────────────────────────────────
const ESCALAS_DESCUENTO = [
  { min: 400, dcto: 0.00 },
  { min: 1000, dcto: 0.05 },
  { min: 5000, dcto: 0.12 },
  { min: 10000, dcto: 0.18 },
];
const MOQ_GENERAL = resolveCartMoq;

function calcularTotalesCotizacion(
  items: { precioBase: number; cantidad: number }[],
  costoEnvio: number,
) {
  const subtotalBruto = items.reduce((acc, i) => acc + i.precioBase * i.cantidad, 0);
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);
  const escala = [...ESCALAS_DESCUENTO].reverse().find(r => cantidadTotal >= r.min);
  const montoDescuento = subtotalBruto * (escala?.dcto ?? 0);
  const subtotalNeto = subtotalBruto - montoDescuento;
  const igv = subtotalNeto * 0.18;

  return {
    subtotalBruto,
    cantidadTotal,
    montoDescuento,
    costoEnvio,
    total: subtotalNeto + igv + costoEnvio,
    igv,
    cumpleMOQ: cantidadTotal >= resolveCartMoq(items),
  };
}