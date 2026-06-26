export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { CONFECCIONES_ROLES_ESCRITURA } from '@/lib/constants/confecciones';
import { registrarAvanceTaller } from '@/components/admin/confecciones/actions';
import { ZodError } from 'zod';
import { z } from 'zod';
import type { EtapaConfeccion } from '@prisma/client';

const cambiarEtapaSchema = z.object({
  etapaAnterior: z.enum(['recepcion_cortes', 'confeccion_y_remalle', 'acabado_y_limpieza', 'planchado_y_empaque', 'entregado_a_guor']),
  etapaNueva: z.enum(['recepcion_cortes', 'confeccion_y_remalle', 'acabado_y_limpieza', 'planchado_y_empaque', 'entregado_a_guor']),
  notas: z.string().nullable().optional(),
  materialesRecibidos: z.object({
    cortes: z.boolean(),
    diseno: z.boolean(),
    patronaje: z.boolean(),
  }).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(CONFECCIONES_ROLES_ESCRITURA);
  
  // Discriminamos la unión: Si no es success, TypeScript sabe que existen 'error' y 'status'
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id: confeccionId } = await params;
    const body = await req.json();
    const validated = cambiarEtapaSchema.parse(body);

    const resultado = await registrarAvanceTaller({
      confeccionId: confeccionId,
      etapaAnterior: validated.etapaAnterior as EtapaConfeccion,
      etapaNueva: validated.etapaNueva as EtapaConfeccion,
      notas: validated.notas ?? '',
      materialesRecibidos: validated.materialesRecibidos,
      // Aquí auth ya está tipado como exitoso por descarte
      responsableId: auth.user.id.toString(),
    });

    // Discriminamos el resultado del Server Action de forma clara
    if (!resultado.success) {
      return NextResponse.json(
        { error: 'error' in resultado ? resultado.error : 'Error en la transacción' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      nuevoEstadoSincronizado: 'nuevoEstado' in resultado ? resultado.nuevoEstado : undefined,
    });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Estructura de payload inválida', details: error.issues },
        { status: 400 },
      );
    }

    console.error('[POST /api/admin/confecciones/[id]/estado]', error);
    const message = error instanceof Error ? error.message : 'Error interno crítico';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}