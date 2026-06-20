import type { TarifaTallerRow } from '@/lib/schemas/tarifa-talleres';
import {
  estaVigente,
  estaActivaYVigente,
} from '@/lib/helpers/tarifas-taller-helpers';

export const tarifaTalleresHelpers = {
  estaVigente,
  estaActivaYVigente,

  calcularCostoTotal: (tarifa: TarifaTallerRow, cantidad: number): number =>
    Number(tarifa.precio_unitario) * cantidad,

  agruparPorEspecialidad: (tarifas: TarifaTallerRow[]) =>
    tarifas.reduce((acc, curr) => {
      const key = curr.especialidad;
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {} as Record<string, TarifaTallerRow[]>),

  agruparPorTaller: (tarifas: TarifaTallerRow[]) =>
    tarifas.reduce((acc, curr) => {
      const key = String(curr.taller_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {} as Record<string, TarifaTallerRow[]>),

  obtenerMasBarata: (tarifas: TarifaTallerRow[]): TarifaTallerRow | undefined =>
    tarifas.reduce((prev, curr) =>
      (Number(curr.precio_unitario) < Number(prev.precio_unitario) ? curr : prev)),

  obtenerTarifasPorEspecialidad: (tarifas: TarifaTallerRow[], especialidad: string) =>
    tarifas.filter((t) => t.especialidad === especialidad && estaActivaYVigente(t)),
};
