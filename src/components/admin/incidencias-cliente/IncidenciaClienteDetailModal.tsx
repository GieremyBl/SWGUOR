'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import {
  ESTADOS_INCIDENCIA_CLIENTE,
  ESTADO_INCIDENCIA_LABELS,
  TIPO_INCIDENCIA_CLIENTE_LABELS,
} from '@/lib/constants/incidencias-cliente';
import type { IncidenciaClienteFila } from '@/lib/schemas/incidencias-cliente';
import type { TipoIncidenciaCliente } from '@prisma/client';

interface Props {
  open: boolean;
  incidenciaId: string | number | null;
  canResponder: boolean;
  isResponding: boolean;
  onClose: () => void;
  onLoad: (id: string | number) => Promise<IncidenciaClienteFila>;
  onResponder: (
    id: string | number,
    data: { estado: 'en_revision' | 'resuelta' | 'cerrada'; respuesta_soporte: string },
  ) => Promise<void>;
}

export function IncidenciaClienteDetailModal({
  open,
  incidenciaId,
  canResponder,
  isResponding,
  onClose,
  onLoad,
  onResponder,
}: Props) {
  const [detalle, setDetalle] = useState<IncidenciaClienteFila | null>(null);
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState<'en_revision' | 'resuelta' | 'cerrada'>('en_revision');
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !incidenciaId) {
      setDetalle(null);
      setRespuesta('');
      setError('');
      return;
    }

    let mounted = true;
    setLoading(true);
    onLoad(incidenciaId)
      .then((data) => {
        if (!mounted) return;
        setDetalle(data);
        if (data.estado === 'resuelta') setEstado('cerrada');
        else if (data.estado === 'en_revision') setEstado('resuelta');
        else setEstado('en_revision');
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, incidenciaId, onLoad]);

  if (!open) return null;

  const cerrada = detalle?.estado === 'cerrada';

  const handleResponder = async () => {
    if (!incidenciaId || !respuesta.trim()) {
      setError('Escribe una respuesta para el cliente.');
      return;
    }
    setError('');
    try {
      await onResponder(incidenciaId, { estado, respuesta_soporte: respuesta.trim() });
      const actualizado = await onLoad(incidenciaId);
      setDetalle(actualizado);
      setRespuesta('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la respuesta');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Incidencia #{incidenciaId}</h2>
              <p className="text-xs text-slate-500">Detalle y respuesta de soporte</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando...
            </div>
          ) : detalle ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cliente</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.cliente?.razon_social ?? detalle.cliente?.nombre_comercial ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Pedido</p>
                  <p className="font-medium text-slate-800 mt-1">#{detalle.pedido_id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Tipo</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.tipo
                      ? TIPO_INCIDENCIA_CLIENTE_LABELS[detalle.tipo as TipoIncidenciaCliente]
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Estado</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {ESTADO_INCIDENCIA_LABELS[
                      (detalle.estado ?? 'abierta') as keyof typeof ESTADO_INCIDENCIA_LABELS
                    ] ?? detalle.estado}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Descripción / historial</p>
                <div className="bg-slate-50 border rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {detalle.descripcion ?? 'Sin descripción'}
                </div>
              </div>

              {detalle.evidencia_url?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Evidencia</p>
                  <ul className="space-y-1">
                    {detalle.evidencia_url.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {canResponder && !cerrada && (
                <div className="border-t pt-5 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Responder al cliente</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Nuevo estado</label>
                    <select
                      value={estado}
                      onChange={(e) =>
                        setEstado(e.target.value as 'en_revision' | 'resuelta' | 'cerrada')
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    >
                      {ESTADOS_INCIDENCIA_CLIENTE.filter((e) => e !== 'abierta').map((e) => (
                        <option key={e} value={e}>
                          {ESTADO_INCIDENCIA_LABELS[e]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      Mensaje de soporte
                    </label>
                    <textarea
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      rows={4}
                      placeholder="Escribe la respuesta que verá el cliente en el historial..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"
                    />
                  </div>
                  {error && <p className="text-sm text-rose-600">{error}</p>}
                  <button
                    type="button"
                    onClick={handleResponder}
                    disabled={isResponding}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-50"
                  >
                    {isResponding ? 'Enviando...' : 'Enviar respuesta'}
                  </button>
                </div>
              )}

              {cerrada && (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
                  Esta incidencia está cerrada y no admite más respuestas.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-rose-600">{error || 'No se pudo cargar la incidencia'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
