import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

export interface FichaMedidaInput {
  punto_medida: string;
  talla: string;
  valor_cm?: number | null;
  tolerancia?: number | null;
}

function validarMedida(item: FichaMedidaInput) {
  if (!item.punto_medida?.trim()) {
    throw new Error('El punto de medida es obligatorio');
  }
  if (!item.talla?.trim()) {
    throw new Error('La talla es obligatoria');
  }
  if (item.valor_cm != null && item.valor_cm < 0) {
    throw new Error('El valor en cm no puede ser negativo');
  }
  if (item.tolerancia != null && item.tolerancia < 0) {
    throw new Error('La tolerancia no puede ser negativa');
  }
}

async function asegurarFichaExiste(ficha_id: string) {
  const ficha = await prisma.fichas_tecnicas.findUnique({
    where: { id: BigInt(ficha_id) },
    select: { id: true },
  });
  if (!ficha) throw new Error('Ficha técnica no encontrada');
}

export const FichaMedidasService = {

  async obtenerPorFicha(ficha_id: string) {
    const medidas = await prisma.ficha_medidas.findMany({
      where: { id_ficha: BigInt(ficha_id) },
      orderBy: [{ talla: 'asc' }, { punto_medida: 'asc' }],
    });
    return serializeBigInt(medidas);
  },

  async agregarMedida(ficha_id: string, item: FichaMedidaInput) {
    validarMedida(item);
    await asegurarFichaExiste(ficha_id);

    const created = await prisma.ficha_medidas.create({
      data: {
        id_ficha: BigInt(ficha_id),
        punto_medida: item.punto_medida.trim(),
        talla: item.talla.trim(),
        valor_cm: item.valor_cm ?? null,
        tolerancia: item.tolerancia ?? null,
      },
    });
    return serializeBigInt(created);
  },

  async actualizarMedida(id: string, data: Partial<FichaMedidaInput>) {
    const existente = await prisma.ficha_medidas.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existente) throw new Error('Medida no encontrada');

    const merged: FichaMedidaInput = {
      punto_medida: data.punto_medida?.trim() ?? existente.punto_medida ?? '',
      talla: data.talla?.trim() ?? existente.talla ?? '',
      valor_cm: data.valor_cm !== undefined ? data.valor_cm : existente.valor_cm,
      tolerancia: data.tolerancia !== undefined ? data.tolerancia : existente.tolerancia,
    };

    validarMedida(merged);

    const updated = await prisma.ficha_medidas.update({
      where: { id: BigInt(id) },
      data: {
        punto_medida: merged.punto_medida,
        talla: merged.talla,
        valor_cm: merged.valor_cm ?? null,
        tolerancia: merged.tolerancia ?? null,
      },
    });
    return serializeBigInt(updated);
  },

  async guardar(ficha_id: string, medidas: FichaMedidaInput[]) {
    medidas.forEach(validarMedida);
    await asegurarFichaExiste(ficha_id);

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.ficha_medidas.deleteMany({ where: { id_ficha: BigInt(ficha_id) } });

      if (medidas.length > 0) {
        await tx.ficha_medidas.createMany({
          data: medidas.map((m) => ({
            id_ficha: BigInt(ficha_id),
            punto_medida: m.punto_medida.trim(),
            talla: m.talla.trim(),
            valor_cm: m.valor_cm ?? null,
            tolerancia: m.tolerancia ?? null,
          })),
        });
      }

      return tx.ficha_medidas.findMany({
        where: { id_ficha: BigInt(ficha_id) },
        orderBy: [{ talla: 'asc' }, { punto_medida: 'asc' }],
      });
    });

    return serializeBigInt(resultado);
  },

  async eliminarMedida(id: string) {
    const existente = await prisma.ficha_medidas.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!existente) throw new Error('Medida no encontrada');

    await prisma.ficha_medidas.delete({ where: { id: BigInt(id) } });
    return { success: true };
  },
};
