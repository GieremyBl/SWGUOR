import { Almacen } from '@/lib/schemas/almacenes';

export const almacenesHelpers = {
  obtenerDisponible: (almacen: Almacen): number =>
    almacen.capacidad_total ? almacen.capacidad_total : 0,

  estaActivo: (almacen: Almacen): boolean =>
    almacen.estado === 'activo',

  agruparPorEstado: (almacenes: Almacen[]) =>
    almacenes.reduce((acc, curr) => {
      if (!acc[curr.estado]) acc[curr.estado] = [];
      acc[curr.estado].push(curr);
      return acc;
    }, {} as Record<string, Almacen[]>),

  obtenerAlmacenConMayorCapacidad: (almacenes: Almacen[]): Almacen | undefined =>
    almacenes.reduce((prev, curr) => {
      const currCapacidad = curr.capacidad_total ?? 0;
      const prevCapacidad = prev.capacidad_total ?? 0;
      return currCapacidad > prevCapacidad ? curr : prev;
    }),
};
