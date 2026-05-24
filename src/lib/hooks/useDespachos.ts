'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getDespachoActivos,
  subscribeToGrupo,
  uploadEvidencia,
  createIncidenciaCliente,
  type DespachoFlat,
  type SeguimientoDespacho,
  type TipoIncidenciaCliente,
  type SeveridadIncidencia,
} from '@/lib/services/despachos.service';
import { aplanarDespacho } from '@/lib/helpers/despachos-helpers';

// ── useDespachos ──────────────────────────────────────────────────────────────

interface UseDespachoState {
  despachos: DespachoFlat[];
  cargando: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDespachos(): UseDespachoState {
  const [despachos, setDespachos] = useState<DespachoFlat[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanupRefs = useRef<(() => void)[]>([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const raw = await getDespachoActivos();
      const plano = raw.map(aplanarDespacho);
      setDespachos(plano);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }, []);

  // Realtime: escucha nuevos seguimientos en cada grupo activo
  useEffect(() => {
    if (!despachos.length) return;

    cleanupRefs.current.forEach(fn => fn());
    cleanupRefs.current = [];

    const subs = despachos
      .filter(d => d.estado === 'en_ruta' || d.estado === 'preparando')
      .map(d =>
        subscribeToGrupo(d.id, (seguimiento: SeguimientoDespacho) => {
          setDespachos(prev =>
            prev.map(item =>
              item.id === d.id
                ? { ...item, estado: seguimiento.status, ultimo_estado: seguimiento }
                : item,
            ),
          );
        }),
      );

    cleanupRefs.current = subs;

    return () => {
      cleanupRefs.current.forEach(fn => fn());
      cleanupRefs.current = [];
    };
  }, [despachos.map(d => d.id).join(',')]);

  useEffect(() => { cargar(); }, [cargar]);

  return { despachos, cargando, error, refetch: cargar };
}

// ── useIncidencia ─────────────────────────────────────────────────────────────

type Status = 'idle' | 'loading' | 'success' | 'error';

interface SubmitPayload {
  tipo: TipoIncidenciaCliente;
  severidad: SeveridadIncidencia;
  descripcion: string;
  foto: File | null;
}

export function useIncidencia() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setError] = useState('');

  async function submit(pedidoId: number | undefined, payload: SubmitPayload) {
    if (!pedidoId) {
      setError('No se encontró el pedido asociado.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const evidencia_url: string[] = [];
      if (payload.foto) {
        const url = await uploadEvidencia(pedidoId, payload.foto);
        evidencia_url.push(url);
      }

      await createIncidenciaCliente({
        pedido_id: pedidoId,
        tipo: payload.tipo,
        severidad: payload.severidad,
        descripcion: payload.descripcion,
        evidencia_url,
      });

      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Error al enviar la incidencia.');
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setError('');
  }

  return { status, errorMsg, submit, reset };
}