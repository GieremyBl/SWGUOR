'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INCIDENCIAS_CLIENTE_PORTAL_API } from '@/lib/constants/incidencias-cliente';
import {
  getDespachoActivos,
  subscribeToGrupo,
  uploadEvidencia,
  type DespachoFlat,
  type SeguimientoDespacho,
  type SeveridadIncidencia,
} from '@/lib/services/despachos.service';
import type { TipoIncidenciaCliente } from '@prisma/client';
import { aplanarDespacho } from '@/lib/helpers/despachos-helpers';

// ─── useDespachos ────────────────────────────────────────────────────────────

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

  const idsActivos = useMemo(
    () =>
      despachos
        .filter(d => d.estado === 'en_ruta' || d.estado === 'preparando')
        .map(d => d.id),
    [despachos],
  );

  // Cadena estable para comparación en el efecto (evita objetos array como dep)
  const idsKey = idsActivos.join(',');

  useEffect(() => {
    if (!idsKey) return;

    // Limpiar suscripciones anteriores antes de crear las nuevas
    cleanupRefs.current.forEach(fn => fn());
    cleanupRefs.current = [];

    cleanupRefs.current = idsActivos.map(id =>
      subscribeToGrupo(id, (seg: SeguimientoDespacho) => {
        setDespachos(prev =>
          prev.map(item =>
            item.id === id
              ? { ...item, estado: seg.status, ultimo_estado: seg }
              : item,
          ),
        );
      }),
    );

    return () => {
      cleanupRefs.current.forEach(fn => fn());
      cleanupRefs.current = [];
    };
    // idsActivos se recrea cuando cambia idsKey, así que usar idsKey
    // como dep es suficiente y evita el array como dependencia inestable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    let mounted = true;
    cargar().catch(() => { if (!mounted) return; });
    return () => { mounted = false; };
  }, [cargar]);

  return { despachos, cargando, error, refetch: cargar };
}

// ─── useIncidencia ───────────────────────────────────────────────────────────

type IncidenciaStatus = 'idle' | 'loading' | 'success' | 'error';

interface SubmitPayload {
  tipo: TipoIncidenciaCliente;
  severidad: SeveridadIncidencia;
  descripcion: string;
  foto: File | null;
}

interface UseIncidenciaReturn {
  status: IncidenciaStatus;
  errorMsg: string;
  submit: (pedidoId: number, payload: SubmitPayload) => Promise<void>;
  reset: () => void;
}

export function useIncidencia(): UseIncidenciaReturn {
  const [status, setStatus] = useState<IncidenciaStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMsg('');
  }, []);

  const submit = useCallback(async (pedidoId: number, payload: SubmitPayload) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const evidencia_url: string[] = [];
      if (payload.foto) {
        const url = await uploadEvidencia(pedidoId, payload.foto);
        evidencia_url.push(url);
      }

      const descripcion = `[Severidad: ${payload.severidad}] ${payload.descripcion.trim()}`;

      const res = await fetch(INCIDENCIAS_CLIENTE_PORTAL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedidoId,
          tipo: payload.tipo,
          descripcion,
          evidencia_url,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      setStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
      setStatus('error');
    }
  }, []);

  return { status, errorMsg, submit, reset };
}