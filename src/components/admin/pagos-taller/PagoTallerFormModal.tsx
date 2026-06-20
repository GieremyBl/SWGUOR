'use client';

import { useEffect, useState } from 'react';
import { Coins, X } from 'lucide-react';
import {
  METODOS_PAGO_TALLER,
  METODO_PAGO_TALLER_LABELS,
} from '@/lib/constants/pagos-taller';
import type { CrearPagoTallerInput } from '@/lib/schemas/pagos-talleres';
import type { MetodoPago } from '@prisma/client';

interface Props {
  open: boolean;
  isCreating: boolean;
  talleres: Array<{ id: string | number; nombre: string }>;
  onClose: () => void;
  onCreate: (data: CrearPagoTallerInput) => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

export function PagoTallerFormModal({ open, isCreating, talleres, onClose, onCreate }: Props) {
  const [form, setForm] = useState<Omit<CrearPagoTallerInput, 'fecha_pago'> & { fecha_pago: string }>({
    taller_id: '',
    monto: 0,
    moneda: 'PEN',
    metodo_pago: 'transferencia_bcp',
    fecha_pago: today(),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setForm({
        taller_id: '',
        monto: 0,
        moneda: 'PEN',
        metodo_pago: 'transferencia_bcp',
        fecha_pago: today(),
      });
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.taller_id) {
      setError('Selecciona un taller.');
      return;
    }
    if (!form.monto || form.monto <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    setError('');
    try {
      await onCreate({
        ...form,
        fecha_pago: new Date(form.fecha_pago),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago');
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Nuevo pago a taller</h2>
              <p className="text-xs text-slate-500">Registro de obligación de pago</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Taller</label>
            <select
              value={String(form.taller_id)}
              onChange={(e) => setForm({ ...form, taller_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">Seleccionar taller...</option>
              {talleres.map((t) => (
                <option key={String(t.id)} value={String(t.id)}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Monto (PEN)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.monto || ''}
                onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Fecha programada</label>
              <input
                type="date"
                value={typeof form.fecha_pago === 'string' ? form.fecha_pago.slice(0, 10) : today()}
                onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Método de pago</label>
            <select
              value={form.metodo_pago}
              onChange={(e) => setForm({ ...form, metodo_pago: e.target.value as MetodoPago })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            >
              {METODOS_PAGO_TALLER.map((m) => (
                <option key={m} value={m}>
                  {METODO_PAGO_TALLER_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Confección (opc.)</label>
              <input
                type="text"
                placeholder="ID confección"
                value={form.confeccion_id ?? ''}
                onChange={(e) =>
                  setForm({ ...form, confeccion_id: e.target.value || undefined })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Orden prod. (opc.)</label>
              <input
                type="text"
                placeholder="ID orden"
                value={form.orden_produccion_id ?? ''}
                onChange={(e) =>
                  setForm({ ...form, orden_produccion_id: e.target.value || undefined })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Notas</label>
            <textarea
              value={form.notas ?? ''}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"
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
            {isCreating ? 'Guardando...' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
