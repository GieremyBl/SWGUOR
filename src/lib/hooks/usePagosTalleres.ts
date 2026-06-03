'use client';

import { useState, useCallback } from 'react';
import { CrearPagoTaller, PagoTaller } from '@/lib/schemas/pagos-talleres';

// Interfaz para definir de forma estricta los filtros aceptados por la URL
export type FiltrosPagoTaller = Record<string, string | number | boolean>;

// Interfaz estricta para el payload del registro de transacciones monetarias
export interface RegistrarPagoInput {
  monto:              number;
  fecha:              Date | string;
  metodoPago:         string;
  numeroComprobante?: string;
}

export function usePagosTalleres() {
  const [pagos, setPagos]     = useState<PagoTaller[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

  // FIX: Reemplazado 'any' por la interfaz FiltrosPagoTaller estructurada
  const obtenerPagos = useCallback(async (filtros?: FiltrosPagoTaller) => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Convertimos todos los valores a string de forma segura para satisfacer a URLSearchParams
      const queryObj: Record<string, string> = {};
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryObj[key] = String(value);
          }
        });
      }

      const params = new URLSearchParams(queryObj);
      const response = await fetch(`/api/pagos-talleres?${params}`);
      if (!response.ok) throw new Error('Error al obtener pagos');

      const data: PagoTaller[] = await response.json();
      setPagos(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearPago = useCallback(async (datos: CrearPagoTaller) => {
    setError(null);
    try {
      const response = await fetch('/api/pagos-talleres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al crear pago');

      const nuevoPago: PagoTaller = await response.json();
      setPagos(prev => [...prev, nuevoPago]);
      return nuevoPago;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // FIX: Se tiparon los argumentos en un contrato estricto e independiente, y se acepta string o number en el ID
  const registrarPago = useCallback(async (
    pagoId: string | number, 
    datosRegistro: RegistrarPagoInput
  ) => {
    setError(null);
    try {
      const response = await fetch(`/api/pagos-talleres/${pagoId}/registrar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosRegistro),
      });
      if (!response.ok) throw new Error('Error al registrar pago');

      const pagoActualizado: PagoTaller = await response.json();
      
      // FIX: Comparación segura e inmune a si tu BD usa IDs numéricos o UUID strings
      setPagos(prev => 
        prev.map(p => String(p.id) === String(pagoId) ? pagoActualizado : p)
      );
      return pagoActualizado;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  return {
    pagos,
    loading,
    error,
    obtenerPagos,
    crearPago,
    registrarPago,
  };
}