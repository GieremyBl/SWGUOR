export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { MovimientosInventarioService } from '@/lib/services/movimientos-inventario.service';
import type { TipoMovimiento, ReferenciaMovimiento } from '@prisma/client';

/**
 * GET /api/admin/movimientos-inventario
 * 
 * Listar movimientos con filtros avanzados
 * 
 * Query Parameters:
 * - busqueda: string - Buscar en nombre de recurso o motivo
 * - tipo_movimiento: TipoMovimiento - Filtrar por tipo de movimiento
 * - referencia_tipo: ReferenciaMovimiento - Filtrar por tipo de referencia
 * - producto_id: bigint | 'any' - Filtrar por producto o listar cualquier movimiento de productos
 * - material_id: bigint | 'any' - Filtrar por material o listar cualquier movimiento de materiales
 * - insumo_id: bigint | 'any' - Filtrar por insumo o listar cualquier movimiento de insumos
 * - usuario_id: bigint - Filtrar por usuario que registró el movimiento
 * - almacen_id: bigint - Filtrar por almacén
 * - desde: ISO Date string - Fecha inicio (ej: 2026-06-01T00:00:00Z)
 * - hasta: ISO Date string - Fecha fin (ej: 2026-06-30T23:59:59Z)
 * - limite: number - Máximo registros (default: 50 sin filtros, 100 con filtros)
 */
export async function GET(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);

    // Parsear parámetros con conversión de tipos apropiada
    const params = {
      busqueda: searchParams.get('busqueda') ?? undefined,
      tipo_movimiento: searchParams.get('tipo_movimiento') as TipoMovimiento | undefined,
      referencia_tipo: searchParams.get('referencia_tipo') as ReferenciaMovimiento | undefined,

      // Soporta 'any' o ID específico como string (el servicio convierte a BigInt internamente)
      producto_id: searchParams.get('producto_id') ?? undefined,
      material_id: searchParams.get('material_id') ?? undefined,
      insumo_id: searchParams.get('insumo_id') ?? undefined,

      usuario_id: searchParams.get('usuario_id') ?? undefined,
      almacen_id: searchParams.get('almacen_id') ?? undefined,

      // Fechas
      desde: searchParams.get('desde')
        ? new Date(searchParams.get('desde')!)
        : undefined,
      hasta: searchParams.get('hasta')
        ? new Date(searchParams.get('hasta')!)
        : undefined,

      // Límite
      limite: searchParams.get('limite')
        ? parseInt(searchParams.get('limite')!, 10)
        : undefined,
    };

    const data = await MovimientosInventarioService.listar(params);

    return NextResponse.json({
      success: true,
      data,
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/movimientos-inventario]', error);
    return NextResponse.json(
      { error: error.message || 'Error al listar movimientos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/movimientos-inventario
 * 
 * Registrar un nuevo movimiento de inventario
 * 
 * Body:
 * {
 *   // Uno y solo uno de estos:
 *   producto_id?: number | string,
 *   material_id?: number | string,
 *   insumo_id?: number | string,
 *   
 *   // Requeridos:
 *   cantidad: number (> 0),
 *   tipo_movimiento: TipoMovimiento,
 *   referencia_tipo: ReferenciaMovimiento,
 *   motivo: string (no vacío),
 *   
 *   // Opcionales:
 *   referencia_id?: number,
 *   usuario_id?: number | string (auto-asignado del auth si no se proporciona),
 *   almacen_id?: number | string
 * }
 */
export async function POST(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    // Validar que se proporcionó exactamente un recurso
    const recursosEspecificados = [
      body.producto_id,
      body.material_id,
      body.insumo_id,
    ].filter(r => r !== null && r !== undefined && r !== '').length;

    if (recursosEspecificados === 0) {
      return NextResponse.json(
        { error: 'Debe especificar exactamente uno: producto_id, material_id o insumo_id' },
        { status: 400 }
      );
    }

    if (recursosEspecificados > 1) {
      return NextResponse.json(
        { error: 'Solo puede especificar un recurso: producto_id, material_id o insumo_id' },
        { status: 400 }
      );
    }

    // Validar campos requeridos
    if (!body.cantidad || body.cantidad <= 0) {
      return NextResponse.json(
        { error: 'Cantidad requerida y debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!body.tipo_movimiento) {
      return NextResponse.json(
        { error: 'Tipo de movimiento requerido' },
        { status: 400 }
      );
    }

    if (!body.referencia_tipo) {
      return NextResponse.json(
        { error: 'Tipo de referencia requerido' },
        { status: 400 }
      );
    }

    if (!body.motivo || (typeof body.motivo === 'string' && body.motivo.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Motivo requerido y no puede estar vacío' },
        { status: 400 }
      );
    }

    // Registrar movimiento
    const resultado = await MovimientosInventarioService.registrar({
      producto_id: body.producto_id,
      material_id: body.material_id,
      insumo_id: body.insumo_id,
      cantidad: body.cantidad,
      tipo_movimiento: body.tipo_movimiento,
      referencia_tipo: body.referencia_tipo,
      motivo: typeof body.motivo === 'string' ? body.motivo.trim() : body.motivo,
      usuario_id: body.usuario_id ?? auth.user.id, // Usa el del auth si no se proporciona
      almacen_id: body.almacen_id,
    });

    return NextResponse.json(
      { success: true, data: resultado },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/admin/movimientos-inventario]', error);

    const statusCode = error.status || 500;
    const errorMsg = error.message || 'Error al registrar movimiento';

    return NextResponse.json(
      { error: errorMsg },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/admin/movimientos-inventario/resumen
 * 
 * Obtener resumen de movimientos (conteo por tipo)
 * 
 * Query Parameters:
 * - tipo_movimiento?: TipoMovimiento - Filtrar resumen por tipo específico
 * - desde?: ISO Date string - Fecha inicio
 * - hasta?: ISO Date string - Fecha fin
 */
export async function GET_RESUMEN(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);

    const params = {
      tipo_movimiento: searchParams.get('tipo_movimiento') as TipoMovimiento | undefined,
      desde: searchParams.get('desde')
        ? new Date(searchParams.get('desde')!)
        : undefined,
      hasta: searchParams.get('hasta')
        ? new Date(searchParams.get('hasta')!)
        : undefined,
    };

    const resumen = await MovimientosInventarioService.obtenerResumen(params);

    return NextResponse.json({ success: true, data: resumen });
  } catch (error: any) {
    console.error('[GET /api/admin/movimientos-inventario/resumen]', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener resumen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/movimientos-inventario/listar-desde-filtros
 * 
 * Listar usando filtros del UI (más flexible que query params)
 * 
 * Body: FiltrosMovimientosInput
 */
export async function POST_FILTROS(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const filtros = await req.json();

    const data = await MovimientosInventarioService.listarDesdeFiltros(filtros);

    return NextResponse.json({
      success: true,
      data,
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (error: any) {
    console.error('[POST /api/admin/movimientos-inventario/listar-desde-filtros]', error);
    return NextResponse.json(
      { error: error.message || 'Error al listar movimientos' },
      { status: 500 }
    );
  }
}