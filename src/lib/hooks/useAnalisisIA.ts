import { useState } from 'react';
import { usePortal } from './usePortal';

export interface InsightIA {
  mensaje: string;
  sugerencia: string;
  tipo: 'ahorro' | 'stock' | 'estrategico';
  impacto: string;
}

export function useAnalisisIA() {
  const { itemsBorrador, resumenBorrador } = usePortal();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<InsightIA | null>(null);

  const analizarCotizacion = async () => {
    if (itemsBorrador.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/portal/analizar-cotizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsBorrador, resumen: resumenBorrador }),
      });

      if (!res.ok) throw new Error('Error en el análisis');

      const data = await res.json();
      if (data.success) {
        setInsight(data.insight);
      }
    } catch (error) {
      console.error("Error en IA:", error);
    } finally {
      setLoading(false);
    }
  };

  return { analizarCotizacion, insight, loading, setInsight };
}