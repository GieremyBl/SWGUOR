import type { Prisma } from '@prisma/client';
import {
  ESTADO_DESCUENTO_APLICACION,
  FUENTE_DESCUENTO,
  type AlcanceCampanaValue,
} from '@/lib/constants/promociones';
import {
  normalizarAplicableTipo,
  normalizarEstadoDescuento,
  resolverAlcanceAplicacion,
} from '@/lib/helpers/descuento-aplicaciones.helper';
import type { EscalaCampanaForm } from '@/lib/schemas/promociones-ofertas';

export type CampanaEscalasTipo = 'oferta' | 'promocion';

export interface SyncCampanaEscalasInput {
  campanaTipo: CampanaEscalasTipo;
  campanaId: bigint;
  campanaNombre: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  alcance: AlcanceCampanaValue;
  categoriaId?: bigint | null;
  productoId?: bigint | null;
  escalas: EscalaCampanaForm[];
}

function fuenteTipo(campanaTipo: CampanaEscalasTipo): string {
  return campanaTipo === 'oferta' ? FUENTE_DESCUENTO.OFERTA : FUENTE_DESCUENTO.PROMOCION;
}

function buildReglaNombre(campanaNombre: string, escala: EscalaCampanaForm): string {
  return `${campanaNombre.trim()} — ${escala.cantidad_min} uds (${escala.valor_descuento}%)`;
}

function fechaFinRegla(fechaFin: Date | null, fechaInicio: Date): Date {
  return fechaFin ?? new Date(fechaInicio.getTime() + 365 * 86400000);
}

async function desactivarReglasAnteriores(
  tx: Prisma.TransactionClient,
  reglaIds: bigint[],
  fuente: string,
  campanaId: bigint,
) {
  if (reglaIds.length === 0) return;

  await tx.reglas_descuento.updateMany({
    where: { id: { in: reglaIds } },
    data: { activo: false },
  });

  await tx.descuento_aplicaciones.updateMany({
    where: {
      regla_id: { in: reglaIds },
      fuente_tipo: fuente,
      fuente_id: campanaId,
    },
    data: { estado: ESTADO_DESCUENTO_APLICACION.REVERTIDO },
  });
}

export async function obtenerReglaIdsCampana(
  tx: Prisma.TransactionClient,
  campanaTipo: CampanaEscalasTipo,
  campanaId: bigint,
): Promise<bigint[]> {
  if (campanaTipo === 'oferta') {
    const rows = await tx.oferta_reglas.findMany({
      where: { oferta_id: campanaId },
      select: { regla_id: true },
    });
    return rows.map((r) => r.regla_id);
  }

  const rows = await tx.promocion_reglas.findMany({
    where: { promocion_id: campanaId },
    select: { regla_id: true },
  });
  return rows.map((r) => r.regla_id);
}

export async function limpiarVinculosCampana(
  tx: Prisma.TransactionClient,
  campanaTipo: CampanaEscalasTipo,
  campanaId: bigint,
) {
  if (campanaTipo === 'oferta') {
    await tx.oferta_reglas.deleteMany({ where: { oferta_id: campanaId } });
    return;
  }
  await tx.promocion_reglas.deleteMany({ where: { promocion_id: campanaId } });
}

export async function syncCampanaEscalas(
  tx: Prisma.TransactionClient,
  input: SyncCampanaEscalasInput,
  previousReglaIds: bigint[],
) {
  const fuente = fuenteTipo(input.campanaTipo);
  await desactivarReglasAnteriores(tx, previousReglaIds, fuente, input.campanaId);

  const sortedEscalas = [...input.escalas].sort((a, b) => a.cantidad_min - b.cantidad_min);
  const reglaFin = fechaFinRegla(input.fechaFin, input.fechaInicio);
  const alcanceAplicacion = resolverAlcanceAplicacion({
    alcance: input.alcance,
    categoriaId: input.categoriaId,
    productoId: input.productoId,
  });

  const aplicableTipo = normalizarAplicableTipo(
    alcanceAplicacion.aplicable_tipo,
    input.alcance,
  );
  const estadoAplicacion = normalizarEstadoDescuento(
    ESTADO_DESCUENTO_APLICACION.APLICADO,
  );

  console.info('[syncCampanaEscalas] descuento_aplicaciones payload', {
    campanaTipo: input.campanaTipo,
    campanaId: String(input.campanaId),
    alcanceFormulario: input.alcance,
    aplicable_tipo: aplicableTipo,
    aplicable_id: String(alcanceAplicacion.aplicable_id),
    estado: estadoAplicacion,
    fuente_tipo: fuente,
  });

  for (let idx = 0; idx < sortedEscalas.length; idx += 1) {
    const escala = sortedEscalas[idx];
    const nombreRegla = buildReglaNombre(input.campanaNombre, escala);

    const regla = await tx.reglas_descuento.create({
      data: {
        nombre: nombreRegla,
        cantidad_min: escala.cantidad_min,
        tipo_beneficio: 'porcentaje_subtotal',
        valor_descuento: escala.valor_descuento,
        fecha_inicio: input.fechaInicio,
        fecha_fin: reglaFin,
        tipo_conteo: 'modelos_distintos',
        activo: true,
      },
    });

    const vinculo = { regla_id: regla.id, prioridad: idx + 1 };

    if (input.campanaTipo === 'oferta') {
      await tx.oferta_reglas.create({
        data: { oferta_id: input.campanaId, ...vinculo },
      });
    } else {
      await tx.promocion_reglas.create({
        data: { promocion_id: input.campanaId, ...vinculo },
      });
    }

    await tx.descuento_aplicaciones.create({
      data: {
        aplicable_tipo: aplicableTipo,
        aplicable_id: alcanceAplicacion.aplicable_id,
        regla_id: regla.id,
        fuente_tipo: fuente,
        fuente_id: input.campanaId,
        nombre: nombreRegla,
        descripcion: alcanceAplicacion.descripcion,
        base_calculo: 'subtotal',
        porcentaje_aplicado: escala.valor_descuento,
        monto_descuento: 0,
        estado: estadoAplicacion,
      },
    });
  }
}
