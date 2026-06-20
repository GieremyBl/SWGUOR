export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { listarHistorialPagosPortal } from '@/lib/services/portal-historial-pagos.service';

async function resolverClienteAutenticado() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status } as const;
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: BigInt(auth.user.id) },
    select: { id: true, estado: true },
  });

  if (!cliente) {
    return { error: 'cliente_no_encontrado', status: 404 } as const;
  }

  if (cliente.estado !== 'activo') {
    return { error: 'cliente_inactivo', status: 403 } as const;
  }

  return { cliente_id: cliente.id } as const;
}

/** GET /api/portal/pagos/historial */
export async function GET() {
  try {
    const sesion = await resolverClienteAutenticado();
    if ('error' in sesion) {
      const errorSesion = sesion as { error: string; status: number };
      return NextResponse.json(
        { success: false, error: errorSesion.error, code: errorSesion.error.toUpperCase() },
        { status: errorSesion.status },
      );
    }

    const data = await listarHistorialPagosPortal(sesion.cliente_id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Portal] GET pagos/historial:', error);
    return NextResponse.json(
      { success: false, error: message, code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
