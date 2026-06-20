export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { pagoConfirmacionQuerySchema } from '@/lib/schemas/pago-confirmacion';
import {
  isPagoConfirmacionError,
  obtenerResumenConfirmacionPago,
} from '@/lib/services/pago-confirmacion.service';

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

/** GET /api/portal/pagos/confirmacion?pedido_id=&comprobante_id= */
export async function GET(req: Request) {
  try {
    const sesion = await resolverClienteAutenticado();
    if ('error' in sesion) {
      const errorSesion = sesion as { error: string; status: number };
      return NextResponse.json(
        { success: false, error: errorSesion.error, code: errorSesion.error.toUpperCase() },
        { status: errorSesion.status },
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = pagoConfirmacionQuerySchema.safeParse({
      pedido_id: searchParams.get('pedido_id'),
      comprobante_id: searchParams.get('comprobante_id'),
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Parámetros inválidos';
      return NextResponse.json(
        { success: false, error: message, code: 'PARAMETROS_INVALIDOS' },
        { status: 400 },
      );
    }

    const pedidoId = BigInt(parsed.data.pedido_id);
    if (pedidoId <= BigInt(0)) {
      return NextResponse.json(
        { success: false, error: 'ID de pedido inválido', code: 'PEDIDO_INVALIDO' },
        { status: 400 },
      );
    }

    const data = await obtenerResumenConfirmacionPago({
      pedidoId,
      comprobanteId: parsed.data.comprobante_id,
      clienteId: sesion.cliente_id,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (isPagoConfirmacionError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }

    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: message, code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
