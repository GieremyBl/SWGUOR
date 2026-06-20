'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import {
  ESTADO_RESOLUCION_LABELS,
  SEVERIDAD_INCIDENCIA_LABELS,
  TIPO_INCIDENCIA_TALLER_LABELS,
} from '@/lib/constants/incidencias-taller';
import type { IncidenciaTallerFila } from '@/lib/schemas/incidencias-taller';
import type { SeveridadIncidencia, TipoIncidencia } from '@prisma/client';

interface UsuarioOption {
  id: string | number;
  email?: string | null;
}

interface Props {
  open: boolean;
  incidenciaId: string | number | null;
  canGestionar: boolean;
  isResolving: boolean;
  isAssigning: boolean;
  onClose: () => void;
  onLoad: (id: string | number) => Promise<IncidenciaTallerFila>;
  onResolver: (id: string | number, data: { solucion: string; impacto_horas?: number }) => Promise<void>;
  onAsignar: (id: string | number, data: { asignado_a: string }) => Promise<void>;
}

function formatFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE');
}

export function IncidenciaTallerDetailModal({
  open,
  incidenciaId,
  canGestionar,
  isResolving,
  isAssigning,
  onClose,
  onLoad,
  onResolver,
  onAsignar,
}: Props) {
  const [detalle, setDetalle] = useState<IncidenciaTallerFila | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [solucion, setSolucion] = useState('');
  const [impactoHoras, setImpactoHoras] = useState('');
  const [asignadoA, setAsignadoA] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !incidenciaId) {
      setDetalle(null);
      setSolucion('');
      setImpactoHoras('');
      setAsignadoA('');
      setError('');
      return;
    }

    let mounted = true;
    setLoading(true);

    Promise.all([
      onLoad(incidenciaId),
      fetch('/api/admin/usuarios', { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => (Array.isArray(json) ? json : json?.data ?? []))
        .catch(() => []),
    ])
      .then(([data, users]) => {
        if (!mounted) return;
        setDetalle(data);
        setUsuarios(users);
        setAsignadoA(data.asignado_a ? String(data.asignado_a) : '');
        setImpactoHoras(data.impacto_horas != null ? String(data.impacto_horas) : '');
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

  const pendiente = detalle && !detalle.resuelto;

  const handleResolver = async () => {
    if (!incidenciaId || !solucion.trim()) {
      setError('Escribe la solución aplicada.');
      return;
    }
    setError('');
    try {
      await onResolver(incidenciaId, {
        solucion: solucion.trim(),
        impacto_horas: impactoHoras ? Number(impactoHoras) : undefined,
      });
      const actualizado = await onLoad(incidenciaId);
      setDetalle(actualizado);
      setSolucion('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo resolver la incidencia');
    }
  };

  const handleAsignar = async () => {
    if (!incidenciaId || !asignadoA) {
      setError('Selecciona un responsable.');
      return;
    }
    setError('');
    try {
      await onAsignar(incidenciaId, { asignado_a: asignadoA });
      const actualizado = await onLoad(incidenciaId);
      setDetalle(actualizado);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar la incidencia');
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
              <p className="text-xs text-slate-500">Detalle y gestión operativa</p>
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
                  <p className="text-xs font-bold text-slate-400 uppercase">Taller</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.confecciones?.talleres?.nombre ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Confección</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.confecciones?.prenda ?? `#${detalle.confeccion_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Tipo</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {TIPO_INCIDENCIA_TALLER_LABELS[detalle.tipo as TipoIncidencia]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Severidad</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {SEVERIDAD_INCIDENCIA_LABELS[detalle.severidad as SeveridadIncidencia]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Estado</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.resuelto ? ESTADO_RESOLUCION_LABELS.resuelto : ESTADO_RESOLUCION_LABELS.pendiente}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Pedido</p>
                  <p className="font-medium text-slate-800 mt-1">#{detalle.pedido_id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Reportado por</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.usuario_reportador?.email ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Asignado a</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {detalle.usuario_asignado?.email ?? 'Sin asignar'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Fecha reporte</p>
                  <p className="font-medium text-slate-800 mt-1">{formatFecha(detalle.fecha_reporte)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Impacto (hrs)</p>
                  <p className="font-medium text-slate-800 mt-1">{detalle.impacto_horas ?? '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Descripción</p>
                <div className="bg-slate-50 border rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {detalle.descripcion}
                </div>
              </div>

              {detalle.solucion && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Solución</p>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">
                    {detalle.solucion}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Resuelta: {formatFecha(detalle.fecha_resolucion)}
                  </p>
                </div>
              )}

              {detalle.foto_url && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Evidencia</p>
                  <a
                    href={detalle.foto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {detalle.foto_url}
                  </a>
                </div>
              )}

              {canGestionar && pendiente && (
                <div className="border-t pt-5 space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">Asignar responsable</h3>
                    <select
                      value={asignadoA}
                      onChange={(e) => setAsignadoA(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    >
                      <option value="">Seleccionar usuario...</option>
                      {usuarios.map((u) => (
                        <option key={String(u.id)} value={String(u.id)}>
                          {u.email ?? `Usuario #${u.id}`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAsignar}
                      disabled={isAssigning}
                      className="w-full py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 disabled:opacity-50"
                    >
                      {isAssigning ? 'Asignando...' : 'Guardar asignación'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">Resolver incidencia</h3>
                    <textarea
                      value={solucion}
                      onChange={(e) => setSolucion(e.target.value)}
                      rows={4}
                      placeholder="Describe la solución aplicada..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={impactoHoras}
                      onChange={(e) => setImpactoHoras(e.target.value)}
                      placeholder="Impacto final (horas)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleResolver}
                      disabled={isResolving}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-50"
                    >
                      {isResolving ? 'Guardando...' : 'Marcar como resuelta'}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-rose-600">{error}</p>}
            </>
          ) : (
            <p className="text-sm text-rose-600">{error || 'No se pudo cargar la incidencia'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
