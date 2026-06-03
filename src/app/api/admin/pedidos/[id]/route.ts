export const runtime = 'nodejs';
import { PedidosService } from '@/lib/services/pedidos.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import type { RolUsuario } from '@/lib/constants/roles';

const PEDIDOS_ROLES: RolUsuario[] = ['administrador', 'gerente', 'recepcionista', 'disenador', 'cortador', 'representante_taller'];

// GET /api/admin/pedidos/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(PEDIDOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const pedido = await PedidosService.obtenerPorId(id);
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: pedido });
  } catch (error: any) {
    console.error('[GET /pedidos/:id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/pedidos/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(PEDIDOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    const body = await req.json();

    const { estado, prioridad, notas_pedido, notas_cliente } = body;
    const data = {
      ...(estado && { estado }),
      ...(prioridad  && { prioridad }),
      ...(notas_pedido  && { notas_pedido }),
      ...(notas_cliente  && { notas_cliente }),
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos uno de: estado, prioridad, notas_pedido, notas_cliente' },
        { status: 400 }
      );
    }

    const pedido = await PedidosService.actualizar(id, data);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'ACTUALIZAR',
      tabla: 'pedidos',
      registro_id: BigInt(id),
      datos_despues: pedido,
    });

    return NextResponse.json({ success: true, data: pedido });
  } catch (error: any) {
    console.error('[PUT /pedidos/:id]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}