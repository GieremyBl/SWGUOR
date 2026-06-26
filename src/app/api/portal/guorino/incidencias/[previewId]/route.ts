export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { obtenerPreviewIncidenciaGuorino } from '@/lib/services/guorino-incidencia.service';
import { serializeBigInt } from '@/lib/utils/serialize';

type Params = { params: Promise<{ previewId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true, razon_social: true, ruc: true },
  });

  if (!cliente) {
    return NextResponse.json({ error: 'solo_clientes' }, { status: 403 });
  }

  const { previewId } = await params;
  const preview = await obtenerPreviewIncidenciaGuorino(cliente.id, previewId);

  if (!preview) {
    return NextResponse.json({ error: 'preview_no_encontrado' }, { status: 404 });
  }

  return NextResponse.json(
    serializeBigInt({ success: true, data: preview, cliente }),
  );
}
