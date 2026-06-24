export const runtime = 'nodejs';
import { PedidosService } from '@/lib/services/pedidos.service';
import { requireServerRole } from '@/lib/auth/server';
import { AccionAuditoria } from '@prisma/client';
import type { RolUsuario } from '@/lib/constants/roles';
import { NextResponse } from 'next/server';
import { auditoriaService } from '@/lib/services/auditoria.service';

const PEDIDOS_ROLES: RolUsuario[] = [
  'administrador', 'gerente', 'recepcionista',
  'disenador', 'cortador', 'representante_taller',
];

export async function GET(_req: Request) {
  const auth = await requireServerRole(PEDIDOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const data = await PedidosService.listar();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /pedidos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Solo permite editar metadatos del pedido — el estado lo mueven los triggers
export async function PUT(req: Request) {
  const auth = await requireServerRole(['administrador', 'gerente', 'recepcionista']);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { id, prioridad, notas_pedido, notas_cliente } = body;

    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    // 'estado' está explícitamente excluido — lo manejan los triggers de BD
    const data = {
      ...(prioridad    !== undefined && { prioridad }),
      ...(notas_pedido !== undefined && { notas_pedido }),
      ...(notas_cliente !== undefined && { notas_cliente }),
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos uno de: prioridad, notas_pedido, notas_cliente' },
        { status: 400 }
      );
    }

    const pedido = await PedidosService.actualizar(id, data);
    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: AccionAuditoria.actualizar,
      tabla: 'pedidos',
      registro_id: BigInt(id),
      datos_despues: pedido,
    });

    return NextResponse.json({ success: true, data: pedido });
  } catch (error: any) {
    console.error('[PUT /pedidos]', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}