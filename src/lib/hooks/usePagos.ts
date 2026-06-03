'use client';

import { useState, useCallback } from 'react';
import { CrearPago, Pago } from '@/lib/schemas/pagos';

// Interfaz para definir de forma estricta los filtros aceptados por la URL de pagos
export type FiltrosPago = Record<string, string | number | boolean>;

// Interfaz para procesar una transacción
export interface ProcesarPagoInput {
  numeroTransaccion?: string;
  referencia?:        string;
}

// Interfaz para reembolsar un pago
export interface ReembolsarPagoInput {
  motivo:         string;
  montoReembolso: number;
}

export function usePagos() {
  const [pagos, setPagos]     = useState<Pago[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

  // FETCH: Obtener lista de pagos aplicando filtros seguros
  const obtenerPagos = useCallback(async (filtros?: FiltrosPago) => {
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
      const response = await fetch(`/api/pagos?${params}`);
      if (!response.ok) throw new Error('Error al obtener pagos');

      const data: Pago[] = await response.json();
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

  // POST: Crear una nueva orden o registro de pago
  const crearPago = useCallback(async (datos: CrearPago) => {
    setError(null);
    try {
      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al crear pago');

      const nuevoPago: Pago = await response.json();
      setPagos(prev => [...prev, nuevoPago]);
      return nuevoPago;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // PUT: Procesar y asentar una transacción existente
  const procesarPago = useCallback(async (pagoId: string | number, datos: ProcesarPagoInput) => {
    setError(null);
    try {
      const response = await fetch(`/api/pagos/${pagoId}/procesar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al procesar pago');

      const pagoActualizado: Pago = await response.json();
      setPagos(prev => prev.map(p => String(p.id) === String(pagoId) ? pagoActualizado : p));
      return pagoActualizado;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // PUT: Cambiar el estado de un pago a rechazado especificando el motivo
  const rechazarPago = useCallback(async (pagoId: string | number, motivo: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/pagos/${pagoId}/rechazar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      if (!response.ok) throw new Error('Error al rechazar pago');

      const pagoActualizado: Pago = await response.json();
      setPagos(prev => prev.map(p => String(p.id) === String(pagoId) ? pagoActualizado : p));
      return pagoActualizado;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // PUT: Ejecutar una devolución o reembolso parcial/total
  const reembolsarPago = useCallback(async (pagoId: string | number, datos: ReembolsarPagoInput) => {
    setError(null);
    try {
      const response = await fetch(`/api/pagos/${pagoId}/reembolsar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      if (!response.ok) throw new Error('Error al reembolsar pago');

      const pagoActualizado: Pago = await response.json();
      setPagos(prev => prev.map(p => String(p.id) === String(pagoId) ? pagoActualizado : p));
      return pagoActualizado;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      throw err;
    }
  }, []);

  // GET: Consultar métricas financieras o registros históricos en un rango temporal
  const generarReporte = useCallback(async (desde: Date, hasta: Date, metodoPago?: string) => {
    setError(null);
    try {
      const params = new URLSearchParams({
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
        ...(metodoPago && { metodoPago }),
      });

      const response = await fetch(`/api/pagos/reporte?${params}`);
      if (!response.ok) throw new Error('Error al generar reporte');
      
      const data: Record<string, unknown> = await response.json();
      return data;
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
    procesarPago,
    rechazarPago,
    reembolsarPago,
    generarReporte,
  };
}