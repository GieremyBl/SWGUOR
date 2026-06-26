export const runtime = 'nodejs';
import { PedidosService } from '@/lib/services/pedidos.service';
import { requireServerRole } from '@/lib/auth/server';
import { AccionAuditoria } from '@prisma/client';
import { ROLES_PEDIDOS_CONSULTA } from '@/lib/constants/pedidos-logistica';
import { NextResponse } from 'next/server';
import { auditoriaService } from '@/lib/services/auditoria.service';

// GET /api/admin/pedidos
export async function GET(_req: Request) {
  const auth = await requireServerRole(ROLES_PEDIDOS_CONSULTA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const data = await PedidosService.listar();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /pedidos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/pedidos
export async function PUT(req: Request) {
  const auth = await requireServerRole(ROLES_PEDIDOS_CONSULTA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, estado, prioridad, notas_pedido, notas_cliente } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const data = {
      ...(estado !== undefined && { estado }),
      ...(prioridad !== undefined && { prioridad }),
      ...(notas_pedido !== undefined && { notas_pedido }),
      ...(notas_cliente !== undefined && { notas_cliente }),
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
      accion: AccionAuditoria.actualizar, // ← corregido
      tabla: 'pedidos',
      registro_id: BigInt(id),
      datos_despues: pedido,
    });

    return NextResponse.json({ success: true, data: pedido });
  } catch (error: any) {
    console.error('[PUT /pedidos]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}