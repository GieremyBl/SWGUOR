import { prisma } from '@/lib/prisma';
import type { ServerAuthUser } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_STAFF_TRACKER: RolUsuario[] = [
  'administrador',
  'recepcionista',
  'gerente',
  'disenador',
  'cortador',
  'representante_taller',
  'ayudante',
  'almacenero',
];

export type ModoAccesoPedido = 'cliente' | 'staff';

export async function verificarAccesoPedido(
  pedidoId: bigint,
  auth: ServerAuthUser,
): Promise<
  | {
      ok: true;
      modo: ModoAccesoPedido;
      esClienteDueño: boolean;
    }
  | { ok: false; status: 403 | 404 }
> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: pedidoId },
    select: { id: true, cliente_id: true },
  });

  if (!pedido) {
    return { ok: false, status: 404 };
  }

  if (ROLES_STAFF_TRACKER.includes(auth.rol)) {
    return { ok: true, modo: 'staff', esClienteDueño: false };
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: BigInt(auth.id) },
    select: { id: true },
  });

  if (cliente && cliente.id === pedido.cliente_id) {
    return { ok: true, modo: 'cliente', esClienteDueño: true };
  }

  return { ok: false, status: 403 };
}
