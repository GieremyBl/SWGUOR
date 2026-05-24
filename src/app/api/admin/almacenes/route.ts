import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crearAlmacenSchema as almacenSchema } from '@/lib/schemas/almacenes';
import { ZodError } from 'zod';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { RolUsuario } from '@/lib/constants/roles';

const ALMACEN_ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero', 'representante_taller'];

export async function GET(request: NextRequest) {
  const auth = await requireServerRole(ALMACEN_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const almacenes = await prisma.almacenes.findMany({
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(almacenes, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      )
    );
  } catch (error) {
    console.error('Error fetching almacenes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireServerRole(ALMACEN_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const validated = almacenSchema.parse(body);
    const almacen = await prisma.almacenes.create({
      data: {
        nombre: validated.nombre,
        direccion: validated.direccion,
        telefono: validated.telefono,
        email: validated.email,
        descripcion: validated.descripcion,
        unidad_capacidad: validated.unidad_capacidad || 'unidades',
        capacidad_total: validated.capacidad_total,
        estado: String(validated.estado).toLowerCase() === 'true',
        responsable_id: validated.responsable_id ? BigInt(validated.responsable_id) : null,
      },
    });

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'almacenes',
      registro_id: BigInt(almacen.id),
      datos_despues: almacen,
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(almacen, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      ),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Error creating almacen:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}