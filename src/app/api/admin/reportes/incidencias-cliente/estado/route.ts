import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Estados permitidos para una incidencia de cliente
const ESTADOS_VALIDOS = ['abierta', 'en_revision', 'resuelta', 'cerrada'];

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, estado } = body;

    // Validaciones
    if (!id) {
      return NextResponse.json(
        { error: 'Falta el id de la incidencia' },
        { status: 400 },
      );
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 },
      );
    }

    // Actualizar el estado en la base
    await prisma.incidencias_cliente.update({
      where: { id: BigInt(id) },
      data: { estado },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'No se pudo actualizar la incidencia' },
      { status: 500 },
    );
  }
}