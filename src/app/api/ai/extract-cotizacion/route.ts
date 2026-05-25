export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { MAX_PDF_EXTRACCION_BYTES } from '@/lib/constants/gemini';
import { extraerCotizacionProveedorDesdeBuffer } from '@/lib/helpers/cotizacion-gemini-extraction';
import { resolveGeminiModelId } from '@/lib/helpers/gemini-models.helper';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];

/**
 * POST /api/ai/extract-cotizacion
 * Body: FormData { file: PDF }
 */
export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'El archivo debe ser un PDF' }, { status: 400 });
    }

    if (file.size > MAX_PDF_EXTRACCION_BYTES) {
      return NextResponse.json(
        { error: 'El PDF supera el tamaño máximo permitido (10 MB)' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const modelId = await resolveGeminiModelId({ purpose: 'extract-cotizacion-pdf' });
    const extracted = await extraerCotizacionProveedorDesdeBuffer(buffer);

    return NextResponse.json({
      success: true,
      data: extracted,
      ...(process.env.GEMINI_DEBUG === 'true' || process.env.NODE_ENV === 'development'
        ? { meta: { modelId } }
        : {}),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al procesar PDF';
    console.error('[POST /api/ai/extract-cotizacion]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
