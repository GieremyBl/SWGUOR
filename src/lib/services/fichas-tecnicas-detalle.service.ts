import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

const ITEM_INCLUDE = {
  materiales: {
    select: {
      id: true,
      nombre: true,
      tipo: true,
      composicion: true,
      color: true,
      unidad_medida: true,
      precio_unitario: true,
    },
  },
  insumo: {
    select: {
      id: true,
      nombre: true,
      tipo: true,
      unidad_medida: true,
      precio_unitario: true,
    },
  },
} as const;

export interface FichaDetalleItemInput {
  material_id?: string | number | null;
  insumo_id?: string | number | null;
  cantidad_consumo: number;
  porcentaje_desperdicio?: number;
  observaciones?: string | null;
}

function validarItemInput(item: FichaDetalleItemInput) {
  const tieneMaterial = item.material_id != null && item.material_id !== '';
  const tieneInsumo = item.insumo_id != null && item.insumo_id !== '';

  if (tieneMaterial === tieneInsumo) {
    throw new Error('Debe indicar un material o un insumo, pero no ambos ni ninguno');
  }
  if (item.cantidad_consumo <= 0) {
    throw new Error('La cantidad de consumo debe ser mayor a 0');
  }
  const desp = item.porcentaje_desperdicio ?? 0;
  if (desp < 0 || desp > 100) {
    throw new Error('El porcentaje de desperdicio debe estar entre 0 y 100');
  }
}

async function asegurarFichaExiste(ficha_id: string) {
  const ficha = await prisma.fichas_tecnicas.findUnique({
    where: { id: BigInt(ficha_id) },
    select: { id: true },
  });
  if (!ficha) throw new Error('Ficha técnica no encontrada');
}

async function sincronizarCostoEstimado(ficha_id: string) {
  const costo = await FichasTecnicasDetalleService.calcularCosto(ficha_id);
  await prisma.fichas_tecnicas.update({
    where: { id: BigInt(ficha_id) },
    data: { costo_estimado: costo },
  });
  return costo;
}

export const FichasTecnicasDetalleService = {

  async obtenerPorFicha(ficha_id: string) {
    const detalles = await prisma.fichas_tecnicas_detalle.findMany({
      where: { ficha_id: BigInt(ficha_id) },
      include: ITEM_INCLUDE,
      orderBy: { id: 'asc' },
    });
    return serializeBigInt(detalles);
  },

  async agregarItem(ficha_id: string, item: FichaDetalleItemInput) {
    validarItemInput(item);
    await asegurarFichaExiste(ficha_id);

    const created = await prisma.fichas_tecnicas_detalle.create({
      data: {
        ficha_id: BigInt(ficha_id),
        material_id: item.material_id ? BigInt(item.material_id) : null,
        insumo_id: item.insumo_id ? BigInt(item.insumo_id) : null,
        cantidad_consumo: item.cantidad_consumo,
        porcentaje_desperdicio: item.porcentaje_desperdicio ?? 0,
        observaciones: item.observaciones ?? null,
      },
      include: ITEM_INCLUDE,
    });

    await sincronizarCostoEstimado(ficha_id);
    return serializeBigInt(created);
  },

  async actualizarItem(id: string, data: Partial<FichaDetalleItemInput>) {
    const existente = await prisma.fichas_tecnicas_detalle.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existente) throw new Error('Ítem de detalle no encontrado');

    const merged: FichaDetalleItemInput = {
      material_id: data.material_id !== undefined
        ? data.material_id
        : existente.material_id?.toString() ?? null,
      insumo_id: data.insumo_id !== undefined
        ? data.insumo_id
        : existente.insumo_id?.toString() ?? null,
      cantidad_consumo: data.cantidad_consumo ?? Number(existente.cantidad_consumo),
      porcentaje_desperdicio: data.porcentaje_desperdicio ?? Number(existente.porcentaje_desperdicio ?? 0),
      observaciones: data.observaciones !== undefined ? data.observaciones : existente.observaciones,
    };

    validarItemInput(merged);

    const updated = await prisma.fichas_tecnicas_detalle.update({
      where: { id: BigInt(id) },
      data: {
        material_id: merged.material_id ? BigInt(merged.material_id) : null,
        insumo_id: merged.insumo_id ? BigInt(merged.insumo_id) : null,
        cantidad_consumo: merged.cantidad_consumo,
        porcentaje_desperdicio: merged.porcentaje_desperdicio ?? 0,
        observaciones: merged.observaciones ?? null,
      },
      include: ITEM_INCLUDE,
    });

    await sincronizarCostoEstimado(existente.ficha_id.toString());
    return serializeBigInt(updated);
  },

  async guardar(ficha_id: string, items: FichaDetalleItemInput[]) {
    items.forEach(validarItemInput);
    await asegurarFichaExiste(ficha_id);

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.fichas_tecnicas_detalle.deleteMany({
        where: { ficha_id: BigInt(ficha_id) },
      });

      if (items.length > 0) {
        await tx.fichas_tecnicas_detalle.createMany({
          data: items.map((item) => ({
            ficha_id: BigInt(ficha_id),
            material_id: item.material_id ? BigInt(item.material_id) : null,
            insumo_id: item.insumo_id ? BigInt(item.insumo_id) : null,
            cantidad_consumo: item.cantidad_consumo,
            porcentaje_desperdicio: item.porcentaje_desperdicio ?? 0,
            observaciones: item.observaciones ?? null,
          })),
        });
      }

      return tx.fichas_tecnicas_detalle.findMany({
        where: { ficha_id: BigInt(ficha_id) },
        include: ITEM_INCLUDE,
        orderBy: { id: 'asc' },
      });
    });

    await sincronizarCostoEstimado(ficha_id);
    return serializeBigInt(resultado);
  },

  async eliminarItem(id: string) {
    const existente = await prisma.fichas_tecnicas_detalle.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, ficha_id: true },
    });
    if (!existente) throw new Error('Ítem de detalle no encontrado');

    await prisma.fichas_tecnicas_detalle.delete({ where: { id: BigInt(id) } });
    await sincronizarCostoEstimado(existente.ficha_id.toString());
    return { success: true };
  },

  async calcularCosto(ficha_id: string) {
    const detalles = await prisma.fichas_tecnicas_detalle.findMany({
      where: { ficha_id: BigInt(ficha_id) },
      include: {
        materiales: { select: { precio_unitario: true } },
        insumo: { select: { precio_unitario: true } },
      },
    });

    const costo = detalles.reduce((total, d) => {
      const precio = Number(d.materiales?.precio_unitario ?? d.insumo?.precio_unitario ?? 0);
      const cantidad = Number(d.cantidad_consumo);
      const desperdicio = Number(d.porcentaje_desperdicio ?? 0) / 100;
      return total + precio * cantidad * (1 + desperdicio);
    }, 0);

    return Math.round(costo * 100) / 100;
  },
};
