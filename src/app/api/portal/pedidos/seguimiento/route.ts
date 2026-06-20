export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { serializeBigInt } from '@/lib/utils/serialize';
import { listarPedidosDetallePortal } from '@/lib/services/portal-pedidos-list.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const incluirFinalizados = searchParams.get('todos') === '1';

    const resultado = await listarPedidosDetallePortal({ incluirFinalizados });

    if (!('data' in resultado)) {
      return NextResponse.json(
        { success: false, error: 'error' in resultado ? resultado.error : 'Error desconocido' },
        { status: 'status' in resultado ? resultado.status : 500 },
      );
    }

    return NextResponse.json({ success: true, data: serializeBigInt(resultado.data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Portal] GET pedidos/seguimiento:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
