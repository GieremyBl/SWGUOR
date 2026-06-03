export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { STORAGE_BUCKET_FICHAS_TECNICAS } from '@/lib/constants/storage';
import {
  contentTypeFromStoragePath,
  extractFichaStoragePath,
} from '@/lib/helpers/ficha-tecnica-storage.helper';

const ROLES: RolUsuario[] = ['disenador', 'administrador', 'gerente', 'cortador', 'representante_taller'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref');

  if (!ref) {
    return NextResponse.json({ error: 'ref es requerido' }, { status: 400 });
  }

  const path = extractFichaStoragePath(ref);
  if (!path) {
    return NextResponse.json({ error: 'Referencia de archivo inválida' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET_FICHAS_TECNICAS)
    .download(path);

  if (error || !data) {
    const msg =
      error?.message?.includes('Bucket not found') || error?.message?.includes('not found')
        ? `Bucket "${STORAGE_BUCKET_FICHAS_TECNICAS}" no encontrado. Verifique que exista en Supabase Storage.`
        : error?.message ?? 'No se pudo abrir el archivo';
    console.error('[GET fichas-tecnicas/archivo]', error);
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  const contentType = contentTypeFromStoragePath(path);
  const fileName = path.split('/').pop() ?? 'archivo';
  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, max-age=300',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
