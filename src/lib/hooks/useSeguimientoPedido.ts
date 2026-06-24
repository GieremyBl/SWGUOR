import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  getSeguimientoPorPedido,
  type SeguimientoPedidoRow,
} from '@/lib/services/seguimiento-pedido.service';

interface UseSeguimientoPedidoOptions {
  /**
   * Llamado cuando Realtime detecta un nuevo row.
   * Útil para que el padre recargue el pedido completo
   * y refleje el estado nuevo en el header/badge.
   */
  onNuevoEstado?: (row: SeguimientoPedidoRow) => void;
}

interface UseSeguimientoPedidoReturn {
  historial:  SeguimientoPedidoRow[];
  isLoading:  boolean;
  error:      string | null;
  refetch:    () => Promise<void>;
}

export function useSeguimientoPedido(
  pedidoId: number | string | undefined,
  options: UseSeguimientoPedidoOptions = {},
): UseSeguimientoPedidoReturn {
  const [historial, setHistorial] = useState<SeguimientoPedidoRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Ref para evitar stale closure en el callback de Realtime
  const onNuevoEstadoRef = useRef(options.onNuevoEstado);
  useEffect(() => {
    onNuevoEstadoRef.current = options.onNuevoEstado;
  }, [options.onNuevoEstado]);

  const refetch = useCallback(async () => {
    if (!pedidoId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSeguimientoPorPedido(pedidoId);
      setHistorial(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  }, [pedidoId]);

  // Carga inicial
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Suscripción Realtime — se activa cuando un trigger de BD
  // inserta en seguimiento_pedido (cambio de estado automático)
  // o cuando el endpoint de cancelación inserta manualmente
  useEffect(() => {
    if (!pedidoId) return;

    const supabase = getSupabaseBrowserClient();
    const channel  = supabase
      .channel(`seg-pedido-erp-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'seguimiento_pedido',
          filter: `pedido_id=eq.${pedidoId}`,
        },
        (payload) => {
          const row = payload.new as SeguimientoPedidoRow;

          setHistorial((prev) => {
            // Deduplicar: un refetch del padre podría haber añadido el row ya
            const yaExiste = prev.some((r) => String(r.id) === String(row.id));
            return yaExiste ? prev : [...prev, row];
          });

          onNuevoEstadoRef.current?.(row);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pedidoId]);

  return { historial, isLoading, error, refetch };
}