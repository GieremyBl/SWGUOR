// lib/hooks/useTarifaTalleres.ts
import { useState, useCallback } from 'react';
import { CrearTarifaTaller, TarifaTaller, ActualizarTarifaTaller } from '@/lib/schemas/tarifa-talleres';

// Interfaz para estructurar estrictamente la respuesta del cálculo de costos
export interface ResultadoCostoTarifa {
  costo_unitario: number;
  cantidad:       number;
  costo_total:    number;
  moneda:         string;
}

export function useTarifaTalleres() {
  const [tarifas, setTarifas] = useState<TarifaTaller[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // FIX: Reemplazado 'filtros?: any' por un objeto indexado seguro para URLSearchParams
  const obtenerTarifas = useCallback(async (filtros?: Record<string, string | number | boolean>) => {
    setLoading(true);
    setError(null);
    try {
      // Mapeamos los filtros transformándolos limpiamente a strings para la URL
      const queryObj: Record<string, string> = {};
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryObj[key] = String(value);
          }
        });
      }

      const params = new URLSearchParams(queryObj);
      const response = await fetch(`/api/tarifas-talleres?${params}`);
      if (!response.ok) throw new Error('Error al obtener tarifas');

      const data: TarifaTaller[] = await response.json();
      setTarifas(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearTarifa = useCallback(async (datos: CrearTarifaTaller): Promise<TarifaTaller> => {
    try {
      const response = await fetch('/api/tarifas-talleres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al crear tarifa');

      const nuevaTarifa: TarifaTaller = await response.json();
      setTarifas(prev => [...prev, nuevaTarifa]);
      return nuevaTarifa;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  const actualizarTarifa = useCallback(async (id: string, datos: ActualizarTarifaTaller): Promise<TarifaTaller> => {
    try {
      const response = await fetch(`/api/tarifas-talleres/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al actualizar tarifa');

      const tarifaActualizada: TarifaTaller = await response.json();
      setTarifas(prev => prev.map(t => t.id === id ? tarifaActualizada : t));
      return tarifaActualizada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  // FIX: Tipamos el retorno explícito de la Promesa para evitar inferencias laxas en cascada
  const calcularCosto = useCallback(async (tarifaId: string, cantidad: number): Promise<ResultadoCostoTarifa> => {
    try {
      const response = await fetch(`/api/tarifas-talleres/${tarifaId}/calcular-costo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad }),
      });
      if (!response.ok) throw new Error('Error al calcular costo');
      
      return await response.json() as ResultadoCostoTarifa;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  return {
    tarifas,
    loading,
    error,
    obtenerTarifas,
    crearTarifa,
    actualizarTarifa,
    calcularCosto,
  };
}