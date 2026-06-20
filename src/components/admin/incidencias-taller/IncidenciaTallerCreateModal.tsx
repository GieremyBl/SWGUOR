'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import {
  SEVERIDADES_INCIDENCIA_TALLER,
  SEVERIDAD_INCIDENCIA_LABELS,
  TIPOS_INCIDENCIA_TALLER,
  TIPO_INCIDENCIA_TALLER_LABELS,
} from '@/lib/constants/incidencias-taller';
import type { CrearIncidenciaTallerInput } from '@/lib/schemas/incidencias-taller';
import type { SeveridadIncidencia, TipoIncidencia } from '@prisma/client';

interface ConfeccionOption {
  id: string | number;
  prenda?: string | null;
  talleres?: { nombre?: string | null } | null;
}

interface Props {
  open: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (data: CrearIncidenciaTallerInput) => Promise<void>;
}

const INITIAL: CrearIncidenciaTallerInput = {
  confeccion_id: '',
  tipo: 'defecto_confeccion',
  severidad: 'media',
  descripcion: '',
};

export function IncidenciaTallerCreateModal({ open, isCreating, onClose, onCreate }: Props) {
  const [form, setForm] = useState<CrearIncidenciaTallerInput>(INITIAL);
  const [confecciones, setConfecciones] = useState<ConfeccionOption[]>([]);
  const [loadingConfecciones, setLoadingConfecciones] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setForm(INITIAL);
      setError('');
      return;
    }

    let mounted = true;
    setLoadingConfecciones(true);
    fetch('/api/admin/confecciones?limit=100&page=1', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setConfecciones(rows);
      })
      .catch(() => {
        if (mounted) setConfecciones([]);
      })
      .finally(() => {
        if (mounted) setLoadingConfecciones(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.confeccion_id) {
      setError('Selecciona una confección.');
      return;
    }
    if (!form.descripcion.trim()) {
      setError('Describe la incidencia.');
      return;
    }
    setError('');
    try {
      await onCreate(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la incidencia');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Nueva incidencia de taller</h2>
              <p className="text-xs text-slate-500">Reporte operativo vinculado a una confección</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Confección</label>
            {loadingConfecciones ? (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando confecciones...
              </p>
            ) : (
              <select
                value={String(form.confeccion_id)}
                onChange={(e) => setForm({ ...form, confeccion_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value="">Seleccionar confección...</option>
                {confecciones.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    #{c.id} — {c.prenda ?? 'Sin prenda'}
                    {c.talleres?.nombre ? ` (${c.talleres.nombre})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoIncidencia })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                {TIPOS_INCIDENCIA_TALLER.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {TIPO_INCIDENCIA_TALLER_LABELS[tipo]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Severidad</label>
              <select
                value={form.severidad}
                onChange={(e) =>
                  setForm({ ...form, severidad: e.target.value as SeveridadIncidencia })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                {SEVERIDADES_INCIDENCIA_TALLER.map((sev) => (
                  <option key={sev} value={sev}>
                    {SEVERIDAD_INCIDENCIA_LABELS[sev]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={4}
              placeholder="Detalla el problema detectado en taller..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              Impacto estimado (horas)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.impacto_horas ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  impacto_horas: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-50"
          >
            {isCreating ? 'Registrando...' : 'Registrar incidencia'}
          </button>
        </div>
      </div>
    </div>
  );
}
