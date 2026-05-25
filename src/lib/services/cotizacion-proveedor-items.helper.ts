import type { Prisma } from '@prisma/client';
import { CategoriaInsumo, TipoInsumo, UnidadMedida } from '@prisma/client';
import type { CotizacionProveedorItemInput } from '@/lib/schemas/cotizaciones-proveedor';

type Tx = Prisma.TransactionClient;

function toBigIntOrNull(value: string | number | null | undefined): bigint | null {
  if (value === null || value === undefined || value === '') return null;
  const n = BigInt(value);
  return n > 0 ? n : null;
}

function mapUnidadMedida(unidad?: string | null): UnidadMedida {
  const u = (unidad ?? 'unidades').toLowerCase();
  if (u.includes('metro') || u === 'm') return UnidadMedida.metros;
  if (u.includes('kg') || u.includes('kilo')) return UnidadMedida.kilogramos;
  if (u.includes('docena')) return UnidadMedida.docenas;
  if (u.includes('cono')) return UnidadMedida.conos;
  if (u.includes('millar')) return UnidadMedida.millares;
  if (u === 'set') return UnidadMedida.set;
  return UnidadMedida.unidades;
}

function mapTipoInsumo(tipoItem?: string | null): TipoInsumo {
  if (tipoItem === 'material') return TipoInsumo.tela;
  return TipoInsumo.otro;
}

/**
 * CHECK solo_uno: exactamente uno entre material_id e insumo_id debe estar definido.
 */
async function resolveItemIds(
  tx: Tx,
  item: CotizacionProveedorItemInput,
  proveedorId: bigint,
): Promise<{ material_id: bigint | null; insumo_id: bigint | null }> {
  let material_id = toBigIntOrNull(item.material_id);
  let insumo_id = toBigIntOrNull(item.insumo_id);

  if (material_id && insumo_id) {
    if (item.tipo_item === 'material') insumo_id = null;
    else material_id = null;
  }

  if (material_id || insumo_id) {
    return { material_id, insumo_id };
  }

  const descripcion = item.descripcion.trim();

  if (item.tipo_item === 'material') {
    const material = await tx.materiales.findFirst({
      where: { nombre: { contains: descripcion, mode: 'insensitive' } },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    if (material) return { material_id: material.id, insumo_id: null };
  }

  const insumoExacto = await tx.insumo.findFirst({
    where: {
      nombre: { equals: descripcion, mode: 'insensitive' },
      proveedor_id: proveedorId,
    },
    select: { id: true },
  });
  if (insumoExacto) return { material_id: null, insumo_id: insumoExacto.id };

  const insumoSimilar = await tx.insumo.findFirst({
    where: {
      nombre: { contains: descripcion.slice(0, 80), mode: 'insensitive' },
      proveedor_id: proveedorId,
    },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (insumoSimilar) return { material_id: null, insumo_id: insumoSimilar.id };

  const insumoNuevo = await tx.insumo.create({
    data: {
      nombre: descripcion.length > 200 ? descripcion.slice(0, 200) : descripcion,
      tipo: mapTipoInsumo(item.tipo_item),
      categoria_insumo: CategoriaInsumo.otro,
      unidad_medida: mapUnidadMedida(item.unidad),
      proveedor_id: proveedorId,
      precio_unitario: item.precio_unitario,
      stock_actual: 0,
      stock_minimo: 0,
    },
    select: { id: true },
  });

  return { material_id: null, insumo_id: insumoNuevo.id };
}

export async function buildCotizacionItemsCreateData(
  tx: Tx,
  cotizacionId: bigint,
  proveedorId: bigint,
  items: CotizacionProveedorItemInput[],
): Promise<Prisma.cotizaciones_proveedor_itemsCreateManyInput[]> {
  const data: Prisma.cotizaciones_proveedor_itemsCreateManyInput[] = [];

  for (const item of items) {
    const ids = await resolveItemIds(tx, item, proveedorId);
    data.push({
      cotizacion_id: cotizacionId,
      descripcion: item.descripcion.trim(),
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      unidad: item.unidad ?? 'unidades',
      tipo_item: item.tipo_item ?? 'insumo',
      material_id: ids.material_id,
      insumo_id: ids.insumo_id,
      notas: item.notas ?? null,
    });
  }

  return data;
}
