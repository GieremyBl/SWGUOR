'use client';

import { useState, useCallback } from 'react';
import type { CrearGuiaRemision, GuiaRemision } from '@/lib/schemas/guias-remision';

// Interfaz para controlar estrictamente los parámetros de filtrado en listados logísticos
export type FiltrosGuiaRemision = Record<string, string | number | boolean>;

// Interfaz para la mutación que asienta la recepción física del despacho en destino
export interface EntregarGuiaInput {
  firmaDestino:          string;
  observacionesEntrega?: string;
}

export function useGuiasRemision() {
  const [guias, setGuias]     = useState<GuiaRemision[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

  // FETCH: Obtener listado de guías aplicando filtros construidos de forma segura
  const obtenerGuias = useCallback(async (filtros?: FiltrosGuiaRemision) => {
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
      const response = await fetch(`/api/guias-remision?${params}`);
      if (!response.ok) throw new Error('Error al obtener guías');

      const data: GuiaRemision[] = await response.json();
      setGuias(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // POST: Registrar una nueva guía de remisión para transporte o traslado de stock
  const crearGuia = useCallback(async (datos: CrearGuiaRemision) => {
    setError(null);
    try {
      const response = await fetch('/api/guias-remision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al crear guía');

      const nuevaGuia: GuiaRemision = await response.json();
      setGuias(prev => [...prev, nuevaGuia]);
      return nuevaGuia;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // PUT: Finalizar traslado cambiando el estado a entregado adjuntando la firma
  const entregarGuia = useCallback(async (guiaId: string | number, datos: EntregarGuiaInput) => {
    setError(null);
    try {
      const response = await fetch(`/api/guias-remision/${guiaId}/entregar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al entregar guía');

      const guiaActualizada: GuiaRemision = await response.json();
      
      // FIX: Comparación agnóstica de identificadores (string/number) para evitar fallas lógicas de renderizado
      setGuias(prev => prev.map(g => String(g.id) === String(guiaId) ? guiaActualizada : g));
      return guiaActualizada;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  return {
    guias,
    loading,
    error,
    obtenerGuias,
    crearGuia,
    entregarGuia,
  };
}