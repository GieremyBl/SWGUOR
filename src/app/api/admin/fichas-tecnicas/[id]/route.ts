export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { FichasTecnicasService } from '@/lib/services/fichas-tecnicas.service';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';

const FICHAS_ROLES: RolUsuario[] = ['administrador', 'gerente', 'disenador', 'cortador', 'almacenero'];

// GET /api/admin/fichas-tecnicas/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(FICHAS_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const ficha = await FichasTecnicasService.obtenerPorId(id);

    if (!ficha) {
      return NextResponse.json({ error: 'Ficha técnica no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ficha });
  } catch (error: any) {
    console.error('[GET /fichas-tecnicas/[id]]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/fichas-tecnicas/[id]
// Actualización parcial — solo los campos enviados en el body
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(FICHAS_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const body = await req.json();

    // Campos permitidos para actualización parcial
    const CAMPOS_PERMITIDOS = [
      'version',
      'descripcion_detallada',
      'sam_total',
      'costo_estimado',
      'imagen_geometral',
      'ficha_url',
      'estado',
    ] as const;

    // Filtrar solo los campos permitidos que vengan en el body
    const data = Object.fromEntries(
      Object.entries(body).filter(([key]) =>
        CAMPOS_PERMITIDOS.includes(key as any)
      )
    );

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron campos válidos para actualizar' },
        { status: 400 }
      );
    }

    const ficha = await FichasTecnicasService.actualizar(id, data);
    return NextResponse.json({ success: true, data: ficha });
  } catch (error: any) {
    console.error('[PATCH /fichas-tecnicas/[id]]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ficha no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/fichas-tecnicas/[id]
// Actualización completa
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(FICHAS_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const body = await req.json();

    // Evitar actualización de id_producto
    const { id_producto, ...data } = body;

    const ficha = await FichasTecnicasService.actualizar(id, data);
    return NextResponse.json({ success: true, data: ficha });
  } catch (error: any) {
    console.error('[PUT /fichas-tecnicas/[id]]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ficha no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}