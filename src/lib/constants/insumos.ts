import type { TipoInsumo } from '@prisma/client';

export const TIPOS_INSUMO: Record<TipoInsumo, { label: string }> = {
  materia_prima: { label: 'Materia prima' },
  avio: { label: 'Avío' },
  empaque: { label: 'Empaque' },
  suministro: { label: 'Suministro' },
  // valores extendidos — añadir tras correr ALTER TYPE + prisma generate
};


export const LISTA_TIPOS_INSUMO = Object.keys(TIPOS_INSUMO) as TipoInsumo[];