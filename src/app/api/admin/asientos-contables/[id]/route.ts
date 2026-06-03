export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { asientoContableBaseSchema as asientosContablesUpdateSchema } from '@/lib/schemas/asientos-contables';
import { asientosContablesService } from '@/lib/services';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { ZodError } from 'zod';
import { auditoriaService } from '@/lib/services/auditoria.service';

const ASIENTOS_CONTABLES_ROLES: RolUsuario[] = ['administrador', 'gerente'];

// Función utilitaria para transformar tipos complejos (bigint, Decimal) a tipos JSON nativos válidos
const serializarPrisma = (objeto: any) => {
  return JSON.parse(
    JSON.stringify(objeto, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireServerRole(ASIENTOS_CONTABLES_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const data = await asientosContablesService.obtenerPorId(Number(id));
    if (!data) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: serializarPrisma(data) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireServerRole(ASIENTOS_CONTABLES_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = asientosContablesUpdateSchema.parse(body);
    const data = await asientosContablesService.actualizar(Number(id), {
      ...validated,
      pago_id: validated.pago_id != null ? String(validated.pago_id) : null,
    });

    // CORRECCIÓN DEL ERROR TS 2322: Sanitizamos el objeto plano eliminando bigints incompatibles con InputJsonValue
    const dataSerializada = serializarPrisma(data);

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'ACTUALIZAR',
      tabla: 'asientos_contables',
      registro_id: BigInt(id),
      datos_despues: dataSerializada,
    });

    return NextResponse.json({ success: true, data: dataSerializada });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireServerRole(ASIENTOS_CONTABLES_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const result = await asientosContablesService.eliminar(Number(id));

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'ELIMINAR',
      tabla: 'asientos_contables',
      registro_id: BigInt(id),
    });

    return NextResponse.json(serializarPrisma(result));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}