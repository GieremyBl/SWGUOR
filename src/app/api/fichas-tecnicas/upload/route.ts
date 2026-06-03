export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  STORAGE_BUCKET_FICHAS_TECNICAS,
  fichaTecnicaStoragePath,
} from '@/lib/constants/storage';

const ROLES: RolUsuario[] = ['disenador', 'administrador', 'gerente', 'cortador'];

const MAX_PDF = 15 * 1024 * 1024;
const MAX_IMAGE = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const productoId = formData.get('productoId') as string;
    const tipo = formData.get('tipo');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (!productoId || !tipo) {
      return NextResponse.json({ error: 'productoId y tipo son requeridos' }, { status: 400 });
    }

    const tipoStr = String(tipo);
    if (!['pdf', 'geometral', 'evidencia'].includes(tipoStr)) {
      return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });
    }

    if (tipoStr === 'pdf') {
      if (!file.type.includes('pdf')) {
        return NextResponse.json({ error: 'Solo PDF' }, { status: 400 });
      }
      if (file.size > MAX_PDF) {
        return NextResponse.json({ error: 'PDF demasiado grande (máx. 15 MB)' }, { status: 400 });
      }
    } else if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo imágenes' }, { status: 400 });
    } else if (file.size > MAX_IMAGE) {
      return NextResponse.json({ error: 'Imagen demasiado grande (máx. 8 MB)' }, { status: 400 });
    }

    const path = fichaTecnicaStoragePath(productoId as string, tipoStr as 'pdf' | 'geometral' | 'evidencia', file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET_FICHAS_TECNICAS)
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      const msg =
        error.message?.includes('Bucket not found') || error.message?.includes('not found')
          ? `Bucket "${STORAGE_BUCKET_FICHAS_TECNICAS}" no existe en Supabase Storage. Créalo en el panel de Supabase.`
          : error.message;
      console.error('[POST fichas-tecnicas/upload]', error);
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      path,
      bucket: STORAGE_BUCKET_FICHAS_TECNICAS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST fichas-tecnicas/upload]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
