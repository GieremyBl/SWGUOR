export const runtime = 'nodejs';
import { OrdenesProduccionService } from '@/lib/services/ordenes-produccion.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA = ['administrador', 'gerente', 'representante_taller', 'recepcionista', 'disenador'] as RolUsuario[];
const ROLES_ESCRITURA = ['administrador', 'gerente'] as RolUsuario[];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const result = await OrdenesProduccionService.listar({
      producto_id: searchParams.get('producto_id') ?? '',
      taller_id: searchParams.get('taller_id') ?? '',
      estado: searchParams.get('estado') ?? '',
      etapa: searchParams.get('etapa') ?? '',
      search: searchParams.get('search') ?? '',
      page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 10,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[GET /ordenes-produccion]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { producto_id, taller_id, ficha_id, cantidad_solicitada, pedido_id, fecha_entrega, notas } = body;

    if (!producto_id || !taller_id || !ficha_id || !cantidad_solicitada || !pedido_id) {
      return NextResponse.json(
        { error: 'producto_id, taller_id, ficha_id, pedido_id y cantidad_solicitada son requeridos' },
        { status: 400 }
      );
    }

    const orden = await OrdenesProduccionService.crear({
      producto_id,
      taller_id,
      ficha_id,
      cantidad_solicitada,
      pedido_id,
      fecha_entrega: fecha_entrega ?? null,
      notas: notas ?? null,
      creado_por: auth.user.id,
    });

    return NextResponse.json({ success: true, data: orden }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /ordenes-produccion]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 });
    }

    const orden = await OrdenesProduccionService.actualizar(id.toString(), data);
    return NextResponse.json({ success: true, data: orden });
  } catch (error: any) {
    console.error('[PUT /ordenes-produccion]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}