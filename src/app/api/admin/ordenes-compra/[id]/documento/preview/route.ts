export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { descargarPdfOrdenCompraDesdeStorage } from '@/lib/services/orden-compra-documento.service';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const buffer = await descargarPdfOrdenCompraDesdeStorage(id);
    if (!buffer) {
      return NextResponse.json(
        { error: 'Documento PDF no encontrado. Genere el documento primero.' },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(req.url);
    const asDownload = searchParams.get('download') === '1';
    const fileName = `orden-compra-${id}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${asDownload ? 'attachment' : 'inline'}; filename="${fileName}"`,
        'Cache-Control': 'private, no-cache, must-revalidate',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[GET ordenes-compra/:id/documento/preview]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
