export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';

// ─────────────────────────────────────────────────────────────
// Helper: obtener cliente autenticado (igual que en route principal)
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
    usuario_id: auth.user.id,
    cliente_id: clienteDb.id,
    cliente: clienteDb,
  };
}

// ─────────────────────────────────────────────────────────────
// GET /api/portal/cotizaciones/[id]
// Devuelve el detalle completo con items y datos del cliente
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const sesion = await obtenerClienteSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status },
      );
    }

    const cotizacion = await prisma.cotizaciones.findFirst({
      where: {
        id: BigInt(id),
        cliente_id: sesion.cliente_id,   // ← seguridad: solo ve sus propias cotizaciones
      },
      include: {
        cliente: {
          select: {
            razon_social: true,
            ruc: true,
            telefono: true,
            email: true,
            direccion_fiscal: true,
          },
        },
        cotizacion_items: {
          include: {
            productos: {
              select: { id: true, nombre: true, sku: true, imagen: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!cotizacion) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 },
      );
    }

    // Mapear items para que buildCotizacionPDFData tenga el campo "descripcion"
    const cotizacionMapeada = {
      ...serializeBigInt(cotizacion),
      cotizacion_items: cotizacion.cotizacion_items.map(item => ({
        ...serializeBigInt(item),
        descripcion: item.productos?.nombre ?? item.modelo_snapshot ?? '—',
      })),
    };

    return NextResponse.json({ success: true, data: cotizacionMapeada });

  } catch (error: any) {
    console.error('[Portal] Error GET cotización por ID:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}