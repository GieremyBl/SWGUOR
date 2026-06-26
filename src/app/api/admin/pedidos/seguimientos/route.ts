export const runtime = 'nodejs';
import { PedidosService } from '@/lib/services/pedidos.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_PEDIDOS_CONSULTA } from '@/lib/constants/pedidos-logistica';

// GET /api/admin/pedidos/seguimiento?pedido_id=xxx
export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES_PEDIDOS_CONSULTA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const pedido_id = searchParams.get('pedido_id');

    if (!pedido_id) {
      return NextResponse.json({ error: 'pedido_id requerido' }, { status: 400 });
    }

    const pedido = await PedidosService.obtenerPorId(pedido_id);
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: pedido.seguimiento_pedido });
  } catch (error: any) {
    console.error('[GET /pedidos/seguimiento]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/pedidos/seguimiento
export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES_PEDIDOS_CONSULTA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { pedido_id, status, notas, creado_por } = body;

    if (!pedido_id) {
      return NextResponse.json({ error: 'pedido_id requerido' }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ error: 'status requerido' }, { status: 400 });
    }

    const seg = await PedidosService.registrarSeguimiento({
      pedido_id,
      status,
      notas,
      creado_por,
    });

    return NextResponse.json({ success: true, data: seg }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /pedidos/seguimiento]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}