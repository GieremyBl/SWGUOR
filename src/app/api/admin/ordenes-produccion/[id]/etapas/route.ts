export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { SeguimientoProduccionService } from '@/lib/services/seguimiento-produccion.service';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { registrarEtapaSchema } from '@/lib/schemas/seguimiento-produccion';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'representante_taller', 'disenador', 'cortador', 'ayudante'];

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    // Validamos los datos base obligatorios de la etapa con Zod
    const parsed = registrarEtapaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { orden_id, etapa, observaciones } = parsed.data;

    // Extraemos de manera flexible todas las variables técnicas enviadas por el Frontend
    const {
      piezas_cortadas,
      merma_tela,
      variantes_color,
      tipo_decorado,
      piezas_aprobadas,
      piezas_segunda,
      piezas_rechazadas,
      operario_remalladora // <- Campo específico solicitado para Remallado
    } = body;

    // Preparamos el payload dinámico JSONB según la etapa correspondiente
    const datosEtapaJson: Record<string, any> = {};

    if (etapa === 'diseno') {
      datosEtapaJson.variantes_color = variantes_color ? String(variantes_color) : null;
    }

    if (etapa === 'corte') {
      datosEtapaJson.piezas_cortadas = piezas_cortadas ? Number(piezas_cortadas) : null;
      datosEtapaJson.merma_tela = merma_tela ? Number(merma_tela) : null;
    }

    // 🧵 ESTRUCTURA JSONB PARA REMALLADO
    if (etapa === 'remallado') {
      datosEtapaJson.operario_remalladora = operario_remalladora ? String(operario_remalladora) : 'Asignado en Planta';
      datosEtapaJson.fecha_remallado = new Date().toISOString();
    }

    if (etapa === 'bordado_estampado') {
      datosEtapaJson.tipo_decorado = tipo_decorado ? String(tipo_decorado) : 'ninguno';
    }

    if (etapa === 'control_calidad') {
      datosEtapaJson.piezas_aprobadas = piezas_aprobadas ? Number(piezas_aprobadas) : 0;
      datosEtapaJson.piezas_segunda = piezas_segunda ? Number(piezas_segunda) : 0;
      datosEtapaJson.piezas_rechazadas = piezas_rechazadas ? Number(piezas_rechazadas) : 0;
      // Guardamos un total auditado de control automático
      datosEtapaJson.total_auditado = Number(datosEtapaJson.piezas_aprobadas) + Number(datosEtapaJson.piezas_segunda) + Number(datosEtapaJson.piezas_rechazadas);
    }

    // Delega la transacción e inserción al Service inyectando el JSONB estructurado
    const seg = await SeguimientoProduccionService.registrarEtapa({
      orden_id: String(orden_id),
      etapa: etapa,
      observaciones: observaciones,
      usuario_id: auth.user?.id ? String(auth.user.id) : undefined,
      datos_etapa: datosEtapaJson // Prisma guardará este objeto nativamente en tu columna jsonb
    });

    return NextResponse.json({ success: true, data: seg }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST /ordenes-produccion/etapas]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}