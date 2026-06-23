import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { EtapaConfeccion } from '@prisma/client';

const SEGUIMIENTO_INCLUDE = {
  usuarios: { select: { id: true, email: true, rol: true } },
} as const;

async function asegurarConfeccionExiste(confeccion_id: string) {
  const conf = await prisma.confecciones.findUnique({
    where: { id: BigInt(confeccion_id) },
    select: { id: true, estado: true }, // 'estado' contiene la etapa real
  });
  if (!conf) throw new Error('Confección no encontrada');
  return conf;
}

export const SeguimientoConfeccionService = {

  async obtenerPorConfeccion(confeccion_id: string) {
    await asegurarConfeccionExiste(confeccion_id);

    const seguimientos = await prisma.seguimiento_confeccion.findMany({
      where: { confeccion_id: BigInt(confeccion_id) },
      include: SEGUIMIENTO_INCLUDE,
      orderBy: { created_at: 'desc' }, // O 'creado_en' dependiendo de tu esquema
    });

    return serializeBigInt(seguimientos);
  },

  async obtenerPorId(id: string) {
    const seg = await prisma.seguimiento_confeccion.findUnique({
      where: { id: BigInt(id) },
      include: SEGUIMIENTO_INCLUDE,
    });
    return seg ? serializeBigInt(seg) : null;
  },

  async registrarCambioEstado(data: {
    confeccion_id: string;
    etapa_nueva: EtapaConfeccion;            // 1. Tipado estricto en lugar de string suelto
    etapa_anterior?: EtapaConfeccion | null; // Tipado estricto
    notas?: string | null;
    responsable_id?: string;
  }) {
    const conf = await asegurarConfeccionExiste(data.confeccion_id);

    // 2. CORREGIDO: conf.etapa no existía. Prisma extrajo 'estado' en la función de arriba
    const etapaAnterior = data.etapa_anterior ?? (conf.estado as EtapaConfeccion);
    const etapaNueva = data.etapa_nueva;

    return prisma.$transaction(async (tx) => {
      // 3. ACTUALIZADO AL FLUJO FÍSICO: Validamos las fechas con el enum real del taller
      const fechaInicio = etapaNueva === 'recepcion_cortes' ? new Date() : undefined;
      const fechaFin = etapaNueva === 'entregado_a_guor' ? new Date() : undefined;

      await tx.confecciones.update({
        where: { id: BigInt(data.confeccion_id) },
        data: {
          estado: etapaNueva, // 4. CORREGIDO: 'estadoNuevo' no existía, usamos 'etapaNueva'
          ...(fechaInicio && { fecha_inicio: fechaInicio }),
          ...(fechaFin && { fecha_fin: fechaFin }), // NOTA: Verifica si tu columna se llama fecha_fin o fecha_entrega
          // updated_at: new Date(), // Descomentar solo si tu DB no tiene un trigger o @updatedAt automático en Prisma
        },
      });

      const seg = await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: BigInt(data.confeccion_id),
          etapa_anterior: etapaAnterior,
          etapa_nuevo: etapaNueva, // 5. CORREGIDO: La columna en Prisma suele ser etapa_nuevo (en masculino)
          notas: data.notas ?? null,
          responsable_id: data.responsable_id ? BigInt(data.responsable_id) : null,
        },
        include: SEGUIMIENTO_INCLUDE,
      });

      return serializeBigInt(seg);
    });
  },

  async actualizarNotas(id: string, notas: string | null) {
    const existente = await prisma.seguimiento_confeccion.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existente) throw new Error('Registro de seguimiento no encontrado');

    const updated = await prisma.seguimiento_confeccion.update({
      where: { id: BigInt(id) },
      data: { notas },
      include: SEGUIMIENTO_INCLUDE,
    });

    return serializeBigInt(updated);
  },
};