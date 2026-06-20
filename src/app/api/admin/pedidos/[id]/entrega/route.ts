export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_LOGISTICA_DESPACHO } from '@/lib/constants/pedidos-logistica';
import { confirmarEntregaPedido } from '@/lib/helpers/confirmar-entrega-pedido.helper';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { AccionAuditoria } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_LOGISTICA_DESPACHO);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const actaPdfUrl = typeof body.acta_pdf_url === 'string' ? body.acta_pdf_url : '';
    const fotos = Array.isArray(body.fotos)
      ? body.fotos.filter((u: unknown) => typeof u === 'string')
      : [];

    const resultado = await confirmarEntregaPedido({
      pedidoId: BigInt(id),
      actaPdfUrl,
      fotosEntrega: fotos,
      notasEntrega: typeof body.notas === 'string' ? body.notas : undefined,
      emitidoPor: BigInt(auth.user.id),
      creadoPorAuthId: auth.user.authId,
    });
        await auditoriaService.registrar({
        usuario_id: BigInt(auth.user.id),
        accion: AccionAuditoria.actualizar,
        tabla: 'pedidos',
        registro_id: BigInt(id),
        datos_despues: { entrega_confirmada: true, acta_pdf_url: actaPdfUrl },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        despacho_id: String(resultado.despachoId),
        guia_id: String(resultado.guiaId),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST pedido entrega]', error);

    // Pedido o despacho no encontrado
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
