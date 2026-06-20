'use client';

import { useState } from 'react';
import { Factory, Loader2, Trash2, X, FileText, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ESTADO_TALLER_LABELS, ESPECIALIDAD_TALLER_LABELS } from '@/lib/constants/talleres';
import TarifasTallerSection from '@/components/admin/talleres/tarifas/TarifasTallerSection';
import type { Taller } from '@/lib/schemas/talleres';

interface SuspendProps {
  taller: Taller;
  onClose: () => void;
  onConfirm: (id: string) => Promise<{ success?: boolean; error?: string }>;
  isSuspending?: boolean;
}

export function TallerSuspendModal({ taller, onClose, onConfirm, isSuspending }: SuspendProps) {
  const handleSuspend = async () => {
    const res = await onConfirm(String(taller.id));
    if (res.success) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Suspender Taller</h3>
        <p className="text-sm text-gray-500 mt-2">
          ¿Estás seguro de suspender a{' '}
          <span className="font-semibold text-gray-900">{taller.nombre}</span>?
          Esta acción evitará que el taller reciba nuevas órdenes.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isSuspending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSuspend}
            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white"
            disabled={isSuspending}
          >
            {isSuspending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Suspendiendo...
              </span>
            ) : (
              'Suspender'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DetailProps {
  taller: Taller;
  onClose: () => void;
  canEditTarifas?: boolean;
}

type TabId = 'detalle' | 'tarifas';

export function TallerDetailModal({ taller, onClose, canEditTarifas = false }: DetailProps) {
  const [tab, setTab] = useState<TabId>('detalle');

  const estadoKey = (taller.estado ?? 'activo') as keyof typeof ESTADO_TALLER_LABELS;
  const espKey = taller.especialidad as keyof typeof ESPECIALIDAD_TALLER_LABELS | undefined;

  const fields = [
    { label: 'RUC', value: taller.ruc, mono: true },
    { label: 'Nombre', value: taller.nombre },
    { label: 'Contacto', value: taller.contacto },
    { label: 'Teléfono', value: taller.telefono, mono: true },
    { label: 'Email', value: taller.email, mono: true },
    { label: 'Dirección', value: taller.direccion },
    {
      label: 'Especialidad',
      value: espKey ? ESPECIALIDAD_TALLER_LABELS[espKey] : '—',
    },
    { label: 'Estado', value: ESTADO_TALLER_LABELS[estadoKey] ?? taller.estado },
    {
      label: 'Confecciones',
      value: taller._count?.confecciones != null ? String(taller._count.confecciones) : '—',
      mono: true,
    },
  ];

  const createdAt = taller.created_at
    ? new Date(taller.created_at).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-xl">
              <Factory className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{taller.nombre}</h3>
              <p className="text-xs text-gray-500 font-mono">RUC: {taller.ruc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4 border-b shrink-0">
          <button
            type="button"
            onClick={() => setTab('detalle')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg border-b-2 transition-colors ${
              tab === 'detalle'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Detalle
          </button>
          <button
            type="button"
            onClick={() => setTab('tarifas')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg border-b-2 transition-colors ${
              tab === 'tarifas'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Tarifas
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'detalle' ? (
            <div className="space-y-3">
              {fields.map((f) => (
                <div key={f.label} className="flex justify-between items-center py-2 border-b last:border-0 gap-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
                    {f.label}
                  </span>
                  <span
                    className={`text-sm font-medium text-gray-900 text-right break-words max-w-[70%] ${
                      f.mono ? 'font-mono normal-case' : 'capitalize'
                    }`}
                  >
                    {f.value || '—'}
                  </span>
                </div>
              ))}
              {createdAt && (
                <p className="text-[11px] text-gray-400 font-medium pt-2 text-left">
                  Registrado el {createdAt}
                </p>
              )}
            </div>
          ) : (
            <TarifasTallerSection
              tallerId={String(taller.id)}
              canEdit={canEditTarifas}
            />
          )}
        </div>
      </div>
    </div>
  );
}
