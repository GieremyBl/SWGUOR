'use client';

import { useState, useCallback } from 'react';
import { CrearIncidencia, Incidencia } from '@/lib/schemas/incidencias';

// Interfaz estricta para el mapeo seguro de filtros en la URL de incidencias
export type FiltrosIncidencia = Record<string, string | number | boolean>;

// Interfaz para el payload de resolución de incidencias en taller o almacén
export interface ResolverIncidenciaInput {
  resolucion:       string;
  montoResolucion?: number;
}

export function useIncidencias() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading]         = useState<boolean>(false);
  const [error, setError]             = useState<string | null>(null);

  // FETCH: Obtener lista de incidencias aplicando filtros seguros
  const obtenerIncidencias = useCallback(async (filtros?: FiltrosIncidencia) => {
    setLoading(true);
    setError(null);
    try {
      const queryObj: Record<string, string> = {};
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryObj[key] = String(value);
          }
        });
      }

      const params = new URLSearchParams(queryObj);
      const response = await fetch(`/api/incidencias?${params}`);
      if (!response.ok) throw new Error('Error al obtener incidencias');

      const data: Incidencia[] = await response.json();
      
      setIncidencias(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // POST: Registrar una nueva incidencia (mermas, daños de maquinaria, retrasos)
  const crearIncidencia = useCallback(async (datos: CrearIncidencia) => {
    setError(null);
    try {
      const response = await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al crear incidencia');

      const nuevaIncidencia: Incidencia = await response.json();
      setIncidencias(prev => [...prev, nuevaIncidencia]);
      return nuevaIncidencia;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // PUT: Asentar la solución o cierre del reporte de incidencia
  const resolverIncidencia = useCallback(async (incidenciaId: string | number, datos: ResolverIncidenciaInput) => {
    setError(null);
    try {
      const response = await fetch(`/api/incidencias/${incidenciaId}/resolver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al resolver incidencia');

      const incidenciaActualizada: Incidencia = await response.json();
      // FIX: Comparación agnóstica de IDs usando strings para soportar numéricos o UUIDs de base de datos
      setIncidencias(prev => prev.map(i => String(i.id) === String(incidenciaId) ? incidenciaActualizada : i));
      return incidenciaActualizada;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // PUT: Delegar la incidencia a un supervisor o rol encargado en particular
  const asignarIncidencia = useCallback(async (incidenciaId: string | number, asignadoA: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/incidencias/${incidenciaId}/asignar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asignadoA }),
      });
      if (!response.ok) throw new Error('Error al asignar incidencia');

      const incidenciaActualizada: Incidencia = await response.json();
      // FIX: Comparación agnóstica de IDs usando strings
      setIncidencias(prev => prev.map(i => String(i.id) === String(incidenciaId) ? incidenciaActualizada : i));
      return incidenciaActualizada;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  return {
    incidencias,
    loading,
    error,
    obtenerIncidencias,
    crearIncidencia,
    resolverIncidencia,
    asignarIncidencia,
  };
}