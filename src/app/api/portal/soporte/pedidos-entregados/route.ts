export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { obtenerClientePortalSesion } from '@/lib/helpers/portal-cliente.helper';
import { SoportePortalService } from '@/lib/services/soporte-portal.service';

export async function GET() {
  const sesion = await obtenerClientePortalSesion();
  if ('error' in sesion) {
    return NextResponse.json({ success: false, error: sesion.error }, { status: sesion.status });
  }

  try {
    const data = await SoportePortalService.listarPedidosEntregados(sesion.cliente_id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
