export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { MovimientosInventarioService } from '@/lib/services/movimientos-inventario.service';
import type { TipoMovimiento, ReferenciaMovimiento } from '@prisma/client';

/**
 * FUNCIÓN AUXILIAR: Convierte recursivamente todos los campos BigInt a String
 * para evitar que NextResponse.json() falle con un Error 500.
 */
function ordenarYSerializarBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(ordenarYSerializarBigInt);
  }

  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, ordenarYSerializarBigInt(value)])
    );
  }

  return obj;
}

/**
 * GET /api/admin/movimientos-inventario
 */
export async function GET(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);

    const params = {
      busqueda: searchParams.get('busqueda') ?? undefined,
      tipo_movimiento: searchParams.get('tipo_movimiento') as TipoMovimiento | undefined,
      referencia_tipo: searchParams.get('referencia_tipo') as ReferenciaMovimiento | undefined,

      producto_id: searchParams.get('producto_id') ?? undefined,
      material_id: searchParams.get('material_id') ?? undefined,
      insumo_id: searchParams.get('insumo_id') ?? undefined,

      usuario_id: searchParams.get('usuario_id') ?? undefined,
      almacen_id: searchParams.get('almacen_id') ?? undefined,

      desde: searchParams.get('desde') ? new Date(searchParams.get('desde')!) : undefined,
      hasta: searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : undefined,

      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
    };

    const data = await MovimientosInventarioService.listar(params);

    // 🌟 APLICACIÓN DE SERIALIZACIÓN SEGURA
    const dataSerializada = ordenarYSerializarBigInt(data);

    return NextResponse.json({
      success: true,
      data: dataSerializada,
      count: Array.isArray(dataSerializada) ? dataSerializada.length : 0,
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
 */
export async function POST(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'almacenero']);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

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

    const resultado = await MovimientosInventarioService.registrar({
      producto_id: body.producto_id,
      material_id: body.material_id,
      insumo_id: body.insumo_id,
      cantidad: body.cantidad,
      tipo_movimiento: body.tipo_movimiento,
      referencia_tipo: body.referencia_tipo,
      motivo: typeof body.motivo === 'string' ? body.motivo.trim() : body.motivo,
      usuario_id: body.usuario_id ?? auth.user.id,
      almacen_id: body.almacen_id,
    });

    // 🌟 SERIALIZACIÓN SEGURA PARA EL REGISTRO RESULTANTE
    return NextResponse.json(
      { success: true, data: ordenarYSerializarBigInt(resultado) },
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