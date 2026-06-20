'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Truck, X } from 'lucide-react';
import {
  ZONAS_ENVIO_DISPONIBLES,
  etiquetaZonaEnvio,
} from '@/lib/constants/costo-envio';
import type {
  ActualizarCostoEnvioInput,
  CostoEnvioFila,
  CrearCostoEnvioInput,
} from '@/lib/schemas/costo-envio';

interface Props {
  open: boolean;
  editing: CostoEnvioFila | null;
  zonasExistentes: CostoEnvioFila[];
  isSaving: boolean;
  onClose: () => void;
  onCreate: (data: CrearCostoEnvioInput) => Promise<void>;
  onUpdate: (id: number, data: ActualizarCostoEnvioInput) => Promise<void>;
}

export function CostoEnvioFormModal({
  open,
  editing,
  zonasExistentes,
  isSaving,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [zona, setZona] = useState('');
  const [costo, setCosto] = useState('');
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState('');

  const zonasDisponibles = useMemo(() => {
    const usadas = new Set(zonasExistentes.map((z) => z.zona));
    return ZONAS_ENVIO_DISPONIBLES.filter(
      (z) => !usadas.has(z) && !usadas.has(etiquetaZonaEnvio(z)),
    );
  }, [zonasExistentes]);

  useEffect(() => {
    if (!open) {
      setZona('');
      setCosto('');
      setActivo(true);
      setError('');
      return;
    }
    if (editing) {
      setZona(editing.zona);
      setCosto(String(editing.costo));
      setActivo(editing.activo);
    } else {
      setZona(zonasDisponibles[0] ?? '');
      setCosto('');
      setActivo(true);
    }
  }, [open, editing, zonasDisponibles]);

  if (!open) return null;

  const handleSubmit = async () => {
    const monto = Number(costo);
    if (!editing && !zona) {
      setError('Selecciona una zona.');
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresa un costo válido mayor a cero.');
      return;
    }
    setError('');
    try {
      if (editing) {
        await onUpdate(editing.id, { costo: monto, activo });
      } else {
        await onCreate({ zona, costo: monto, activo });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                {editing ? `Editar zona #${editing.id}` : 'Nueva zona de envío'}
              </h2>
              <p className="text-xs text-slate-500">Tarifas aplicadas en cotizaciones y pedidos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {editing ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Zona</label>
              <p className="text-sm font-medium text-slate-800 py-2.5 px-4 bg-slate-50 rounded-xl border">
                {etiquetaZonaEnvio(editing.zona)}
              </p>
            </div>
          ) : zonasDisponibles.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-4">
              Todas las zonas del catálogo ya están registradas. Edita una existente para cambiar su costo.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Zona</label>
              <select
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                {zonasDisponibles.map((z) => (
                  <option key={z} value={z}>
                    {etiquetaZonaEnvio(z)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Costo (S/)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="rounded border-slate-300"
            />
            Zona activa en portal y cotizaciones
          </label>

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
            disabled={isSaving || (!editing && zonasDisponibles.length === 0)}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing ? 'Guardar cambios' : 'Registrar zona'}
          </button>
        </div>
      </div>
    </div>
  );
}
