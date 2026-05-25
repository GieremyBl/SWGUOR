export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { cotizacionesProveedorService } from '@/lib/services/cotizaciones-proveedor.service';
import {
  almacenarPdfReferenciaCotizacion,
  getCotizacionProveedorPdfPublicUrl,
} from '@/lib/services/cotizacion-proveedor-documento.service';
import { serializeBigInt } from '@/lib/utils/serialize';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];
const MAX_PDF_BYTES = 15 * 1024 * 1024;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const cot = await cotizacionesProveedorService.obtenerPorId(BigInt(id));
    if (!cot) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: { pdf_url: cot.pdf_url ?? getCotizacionProveedorPdfPublicUrl(id) },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const cot = await cotizacionesProveedorService.obtenerPorId(BigInt(id));
    if (!cot) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Se requiere un archivo PDF válido' },
        { status: 400 },
      );
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: 'El PDF no puede superar 15 MB' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await almacenarPdfReferenciaCotizacion(id, buffer);

    await cotizacionesProveedorService.actualizarPdfUrl(BigInt(id), doc.pdf_url);

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        pdf_url: doc.pdf_url,
        storage_path: doc.storage_path,
      }),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
