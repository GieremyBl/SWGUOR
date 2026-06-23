export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { MaterialesService } from '@/lib/services/material.service';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';

const MATERIALES_LECTURA_ROLES: RolUsuario[] = ['administrador', 'gerente', 'disenador', 'cortador', 'representante_taller', 'almacenero'];
const MATERIALES_ESCRITURA_ROLES: RolUsuario[] = ['administrador', 'gerente', 'disenador', 'cortador', 'almacenero'];
const LIMITE_MAXIMO = 200;

export async function GET(req: Request) {
  const auth = await requireServerRole(MATERIALES_LECTURA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);

    // NUEVO: tope de resultados, pensado para selectores tipo combobox.
    // Requiere que MaterialesService.listar aplique `take: limite` en su
    // query de Prisma — sin ese cambio en el service, este valor no tiene efecto.
    const rawLimite = searchParams.get('limite');
    let limite: number | undefined;
    if (rawLimite) {
      const n = Number(rawLimite);
      if (isNaN(n) || n <= 0) {
        return NextResponse.json({ error: 'limite debe ser un número positivo' }, { status: 400 });
      }
      limite = Math.min(n, LIMITE_MAXIMO);
    }

    const data = await MaterialesService.listar({
      tipo: searchParams.get('tipo') ?? undefined,
      busqueda: searchParams.get('busqueda') ?? undefined,
      bajo_stock: searchParams.get('stockBajo') === 'true',
      proveedor_id: searchParams.get('proveedor_id') ?? undefined,
      limite,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(MATERIALES_ESCRITURA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.nombre) {
      return NextResponse.json({ error: 'nombre requerido' }, { status: 400 });
    }

    const data = await MaterialesService.crear(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireServerRole(MATERIALES_ESCRITURA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const data = await MaterialesService.actualizar(id, updates);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireServerRole(MATERIALES_ESCRITURA_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    await MaterialesService.eliminar(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}