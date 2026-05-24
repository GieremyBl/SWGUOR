import { useState, useCallback } from 'react';
import { Auditoria } from '@/lib/schemas/auditoria';

export function useAuditoria() {
  const [registros, setRegistros] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const obtenerRegistros = useCallback(async (filtros?: any, pagina: number = 1, limite: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        limite: limite.toString(),
        ...(filtros || {}),
      });
      
      const response = await fetch(`/api/auditoria?${params}`);
      if (!response.ok) throw new Error('Error al obtener registros de auditoría');
      
      const data = await response.json();
      setRegistros(data.registros);
      setTotal(data.total);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generarReporte = useCallback(async (desde: Date, hasta: Date, usuario?: string, tabla?: string) => {
    try {
      const params = new URLSearchParams({
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
        ...(usuario && { usuario }),
        ...(tabla && { tabla }),
      });
      
      const response = await fetch(`/api/auditoria/reporte?${params}`);
      if (!response.ok) throw new Error('Error al generar reporte');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  const exportarRegistros = useCallback(async (filtros?: any, formato: 'csv' | 'xlsx' = 'csv') => {
    try {
      const params = new URLSearchParams({
        formato,
        ...(filtros || {}),
      });
      
      const response = await fetch(`/api/auditoria/exportar?${params}`);
      if (!response.ok) throw new Error('Error al exportar registros');
      return await response.blob();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  }, []);

  return {
    registros,
    loading,
    error,
    total,
    obtenerRegistros,
    generarReporte,
    exportarRegistros,
  };
}
