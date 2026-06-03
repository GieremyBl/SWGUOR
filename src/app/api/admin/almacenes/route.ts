import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { almacenes } from '@prisma/client';
import { crearAlmacenSchema as almacenSchema } from '@/lib/schemas/almacenes';
import { ZodError } from 'zod';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { RolUsuario } from '@/lib/constants/roles';

const ALMACEN_ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero', 'representante_taller'];

function serializeAlmacen(a: almacenes) {
  return {
    id: Number(a.id),
    nombre: a.nombre,
    direccion: a.direccion ?? null,
    telefono: a.telefono ?? null,
    email: a.email ?? null,
    descripcion: a.descripcion ?? null,
    responsable_id: a.responsable_id ? Number(a.responsable_id) : null,
    capacidad_total: a.capacidad_total ? Number(a.capacidad_total) : null,
    unidad_capacidad: a.unidad_capacidad ?? 'unidades',
    estado: a.estado ? 'activo' : 'inactivo',
    created_at: a.created_at.toISOString(),
    updated_at: a.updated_at.toISOString(),
  };
}

// ── GET /api/admin/almacenes ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireServerRole(ALMACEN_ROLES);
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const almacenes = await prisma.almacenes.findMany({
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(almacenes.map(serializeAlmacen));
  } catch (error) {
    console.error('[GET /almacenes]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ── POST /api/admin/almacenes ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireServerRole(ALMACEN_ROLES);
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const validated = almacenSchema.parse(body);

    const almacen = await prisma.almacenes.create({
      data: {
        nombre: validated.nombre,
        direccion: validated.direccion ?? null,
        telefono: validated.telefono ?? null,
        email: validated.email ?? null,
        descripcion: validated.descripcion ?? null,
        unidad_capacidad: validated.unidad_capacidad ?? 'unidades',
        capacidad_total: validated.capacidad_total ?? null,
        estado: validated.estado === 'activo',
        responsable_id: validated.responsable_id
          ? BigInt(validated.responsable_id)
          : null,
      },
    });

    const serializado = serializeAlmacen(almacen);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'almacenes',
      registro_id: almacen.id,
      datos_despues: serializado,
    });

    return NextResponse.json(serializado, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError)
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    console.error('[POST /almacenes]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}