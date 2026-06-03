export const runtime = 'nodejs';
import { MovimientosInventarioService } from '@/lib/services/movimientos-inventario.service';
import { requireServerRole } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/movimientos-inventario
 * Listar movimientos con filtros
 * 
 * Query params:
 * - tipo_movimiento: entrada|salida|ajuste
 * - referencia_tipo: ORDEN|COMPRA|VENTA|AJUSTE
 * - producto_id: ID del producto
 * - material_id: ID del material
 * - insumo_id: ID del insumo
 * - usuario_id: ID del usuario
 * - almacen_id: ID del almacén
 * - busqueda: Buscar en motivo
 * - desde: Fecha inicio (ISO string)
 * - hasta: Fecha fin (ISO string)
 * - limite: Máximo registros (default 100)
 */
export async function GET(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tipoItem = searchParams.get('tipoItem');

    const data = await MovimientosInventarioService.listarDesdeFiltros({
      search: searchParams.get('search') ?? searchParams.get('busqueda') ?? undefined,
      busqueda: searchParams.get('busqueda') ?? undefined,
      tipo_movimiento: searchParams.get('tipo_movimiento') ?? undefined,
      referencia_tipo: searchParams.get('referencia_tipo') ?? undefined,
      tipoItem:
        tipoItem === 'producto' || tipoItem === 'insumo' || tipoItem === 'material'
          ? tipoItem
          : undefined,
      desde: searchParams.get('desde') ?? undefined,
      hasta: searchParams.get('hasta') ?? undefined,
      fecha_inicio: searchParams.get('fecha_inicio') ?? undefined,
      fecha_fin: searchParams.get('fecha_fin') ?? undefined,
      limite: searchParams.has('limite')
        ? parseInt(searchParams.get('limite') || '50', 10)
        : undefined,
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /movimientos-inventario]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/movimientos-inventario
 * Registrar un nuevo movimiento
 */
export async function POST(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    // Validar datos mínimos
    if (!body.cantidad) {
      return NextResponse.json(
        { error: 'Cantidad requerida' },
        { status: 400 }
      );
    }

    if (!body.tipo_movimiento) {
      return NextResponse.json(
        { error: 'Tipo de movimiento requerido' },
        { status: 400 }
      );
    }

    if (!body.motivo) {
      return NextResponse.json(
        { error: 'Motivo requerido' },
        { status: 400 }
      );
    }

    if (!body.producto_id && !body.material_id && !body.insumo_id) {
      return NextResponse.json(
        { error: 'Debe especificar producto, material o insumo' },
        { status: 400 }
      );
    }

    // Sobrescribimos el usuario_id con el del usuario autenticado para seguridad y auditoría
    const movimiento = await MovimientosInventarioService.registrar({
      ...body,
      usuario_id: auth.user.id
    });

    return NextResponse.json(
      { success: true, data: movimiento },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /movimientos-inventario]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
