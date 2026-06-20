export const runtime = 'nodejs';
import { ConfeccionesService } from '@/lib/services/confecciones.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { CONFECCIONES_ROLES_ESCRITURA } from '@/lib/constants/confecciones';
import { cambiarEstadoConfeccionSchema } from '@/lib/schemas/confecciones';
import { ZodError } from 'zod';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = cambiarEstadoConfeccionSchema.parse(body);

    const data = await ConfeccionesService.actualizarEstado(id, {
      estado: validated.estado,
      notas: validated.notas ?? undefined,
      responsable_id: auth.user.id?.toString(),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 },
      );
    }
    console.error('[POST /api/admin/confecciones/[id]/estado]', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}