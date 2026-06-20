import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function obtenerClientePortalSesion() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status } as const;
  }

  if (auth.user.rol !== 'cliente') {
    return { error: 'sin_permisos', status: 403 } as const;
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true, estado: true, razon_social: true, nombre_comercial: true },
  });

  if (!cliente) {
    return { error: 'cliente_no_encontrado', status: 404 } as const;
  }

  if (cliente.estado !== 'activo') {
    return { error: 'cliente_inactivo', status: 403 } as const;
  }

  return {
    cliente_id: cliente.id,
    usuario_id: auth.user.id,
    cliente,
  } as const;
}
