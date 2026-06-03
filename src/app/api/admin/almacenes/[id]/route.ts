import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, almacenes } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

type AlmacenWithZonas = Prisma.almacenesGetPayload<{
  include: {
    almacen_zonas: {
      include: { _count: { select: { almacen_stock: true } } };
    };
    _count: {
      select: { almacen_stock: true; almacen_zonas: true };
    };
  };
}>;

function serializeAlmacenWithZonas(a: AlmacenWithZonas) {
  return {
    id: Number(a.id),
    nombre: a.nombre,
    descripcion: a.descripcion,
    direccion: a.direccion,
    telefono: a.telefono,
    email: a.email,
    capacidad_total: a.capacidad_total ? Number(a.capacidad_total) : null,
    unidad_capacidad: a.unidad_capacidad,
    estado: a.estado ? 'activo' : 'inactivo',
    created_at: a.created_at.toISOString(),
    zonas: a.almacen_zonas.map((z) => ({
      id: Number(z.id),
      almacen_id: Number(z.almacen_id),
      nombre: z.nombre,
      descripcion: z.descripcion,
      activo: z.activo,
      created_at: z.created_at.toISOString(),
      _count: {
        stock: z._count.almacen_stock
      }
    })),
    _count: {
      zonas: a._count.almacen_zonas,
      stock: a._count.almacen_stock
    }
  };
}

function serializeAlmacen(a: almacenes) {
  return {
    ...a,
    id: Number(a.id), // Cambiado BigInt stringificado a Number
    responsable_id: a.responsable_id ? Number(a.responsable_id) : null,
    capacidad_total: a.capacidad_total ? Number(a.capacidad_total) : null,
    estado: a.estado ? 'activo' : 'inactivo',
  };
}

// ─── Métodos HTTP ─────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id: rawId } = await params;
  let id: bigint;
  try { id = BigInt(rawId); } catch {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const almacen = await prisma.almacenes.findUnique({
      where: { id },
      include: {
        almacen_zonas: {
          orderBy: { id: 'asc' }, // 💡 Modificado a 'id' para mantener un orden físico consistente al refrescar
          include: { _count: { select: { almacen_stock: true } } },
        },
        _count: {
          select: { almacen_stock: true, almacen_zonas: true },
        },
      },
    });

    if (!almacen) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    return NextResponse.json(serializeAlmacenWithZonas(almacen));
  } catch (error) {
    console.error('[GET /almacenes/[id]]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id: rawId } = await params;
  let id: bigint;
  try { id = BigInt(rawId); } catch {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const body: Prisma.almacenesUpdateInput = await req.json();

    const data: Prisma.almacenesUpdateInput = { ...body };
    if ('estado' in data) {
      data.estado = (data.estado as string) === 'activo' || data.estado === true;
    }

    const almacen = await prisma.almacenes.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeAlmacen(almacen));
  } catch (error) {
    console.error('[PUT /almacenes/[id]]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id: rawId } = await params;
  let id: bigint;
  try { id = BigInt(rawId); } catch {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await prisma.almacenes.update({
      where: { id },
      data: { estado: false },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}