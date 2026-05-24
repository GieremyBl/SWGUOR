import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { actualizarAlmacenSchema as almacenUpdateSchema } from '@/lib/schemas/almacenes';
import { ZodError } from 'zod';

// Función helper para serializar de forma segura registros con BigInt
function formatearRespuesta(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const almacen = await prisma.almacenes.findUnique({
      where: { id: BigInt(id) },
    });

    if (!almacen) {
      return NextResponse.json({ error: 'Almacén no encontrado' }, { status: 404 });
    }

    return NextResponse.json(formatearRespuesta(almacen));
  } catch (error) {
    console.error('Error fetching almacen:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = almacenUpdateSchema.parse(body);

    const almacen = await prisma.almacenes.update({
      where: { id: BigInt(id) },
      data: {
        nombre: validated.nombre,
        direccion: validated.direccion,
        telefono: validated.telefono,
        email: validated.email,
        descripcion: validated.descripcion,
        unidad_capacidad: validated.unidad_capacidad,
        capacidad_total: validated.capacidad_total,
        estado: String(validated.estado).toLowerCase() === 'true',
        responsable_id: validated.responsable_id ? BigInt(validated.responsable_id) : null,
      },
    });

    return NextResponse.json(formatearRespuesta(almacen));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error updating almacen:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.almacenes.update({
      where: { id: BigInt(id) },
      data: {
        estado: false
      },
    });

    return NextResponse.json({ message: 'Almacén desactivado correctamente' });
  } catch (error) {
    console.error('Error deactivating almacen:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}