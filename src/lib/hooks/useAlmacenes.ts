import { useState, useCallback } from 'react';
import { CrearAlmacen, Almacen, ActualizarAlmacen } from '@/lib/schemas/almacenes';

export function useAlmacenes() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerAlmacenes = useCallback(async (filtros?: any) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filtros || {});
      const response = await fetch(`/api/almacenes?${params}`);
      if (!response.ok) throw new Error('Error al obtener almacenes');

      const data: Almacen[] = await response.json();
      setAlmacenes(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearAlmacen = useCallback(async (datos: CrearAlmacen) => {
    try {
      const response = await fetch('/api/almacenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al crear almacén');

      const nuevoAlmacen: Almacen = await response.json();
      setAlmacenes(prev => [...prev, nuevoAlmacen]);
      return nuevoAlmacen;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  const actualizarAlmacen = useCallback(async (id: string, datos: ActualizarAlmacen) => {
    try {
      const response = await fetch(`/api/almacenes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al actualizar almacén');

      const almacenActualizado: Almacen = await response.json();
      setAlmacenes(prev => prev.map(a => BigInt(a.id) === BigInt(id) ? almacenActualizado : a));
      return almacenActualizado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  const consultarCapacidad = useCallback(async (almacenId: string) => {
    try {
      const response = await fetch(`/api/almacenes/${almacenId}/capacidad`);
      if (!response.ok) throw new Error('Error al consultar capacidad');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  return {
    almacenes,
    loading,
    error,
    obtenerAlmacenes,
    crearAlmacen,
    actualizarAlmacen,
    consultarCapacidad,
  };
}
