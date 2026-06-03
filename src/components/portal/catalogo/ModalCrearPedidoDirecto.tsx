'use client';

import { useState, useEffect } from 'react';
import { X, ClipboardList } from 'lucide-react';
import {
  DireccionDespachoPeruFields,
  esDireccionDespachoPeruValida,
} from '@/components/shared/DireccionDespachoPeruFields';

interface ModalCrearPedidoDirectoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { notas_cliente: string; direccion_despacho: string }) => Promise<void>;
  loading?: boolean;
  resumenFinanciero: {
    itemsCount: number;
    subtotal: number;
    igv: number;
    total: number;
  };
}

export function ModalCrearPedidoDirecto({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  resumenFinanciero,
}: ModalCrearPedidoDirectoProps) {
  const [direccionDespacho, setDireccionDespacho] = useState('');
  const [notasCliente, setNotasCliente] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDireccionDespacho('');
      setNotasCliente('');
      setErrorLocal(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!esDireccionDespachoPeruValida(direccionDespacho)) {
      setErrorLocal('Complete departamento, provincia, distrito y la ubicación exacta.');
      return;
    }

    try {
      await onSubmit({
        direccion_despacho: direccionDespacho.trim(),
        notas_cliente: notasCliente.trim(),
      });
    } catch {
      setErrorLocal('Hubo un error al procesar el envío a producción. Intente nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <form
        onSubmit={handleFormSubmit}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        style={{ borderColor: 'var(--guor-stone)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white" style={{ borderColor: 'var(--guor-stone)' }}>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--guor-dark)' }}>
              Confirmar Orden de Producción
            </h3>
            <p className="text-[11px] opacity-60 font-medium">Módulo de Despacho B2B</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--guor-stone)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
          {errorLocal && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-600">
              {errorLocal}
            </div>
          )}

          {/* Resumen de costos */}
          <div className="p-4 rounded-xl border bg-gray-50/50 space-y-2.5" style={{ borderColor: 'var(--guor-stone)' }}>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-50" style={{ color: 'var(--guor-dark)' }}>
              Balance Estimado de Manufactura
            </p>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="opacity-60">Lotes de Productos:</span>
              <span className="font-bold text-right">{resumenFinanciero.itemsCount} Unidades</span>

              <span className="opacity-60">Subtotal:</span>
              <span className="font-semibold text-right">PEN {resumenFinanciero.subtotal.toFixed(2)}</span>

              <span className="opacity-60">IGV (18%):</span>
              <span className="font-semibold text-right">PEN {resumenFinanciero.igv.toFixed(2)}</span>

              <div className="col-span-2 border-t my-1" style={{ borderColor: 'var(--guor-stone)' }} />

              <span className="font-black uppercase tracking-wide">Total Neto:</span>
              <span className="font-black text-sm text-right" style={{ color: 'var(--guor-gold)' }}>
                PEN {resumenFinanciero.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider block" style={{ color: 'var(--guor-dark)' }}>
                Dirección de Despacho / Entrega <span className="text-rose-500">*</span>
              </label>
              <DireccionDespachoPeruFields
                value={direccionDespacho}
                onChange={setDireccionDespacho}
                variant="portal"
                showPreview={false}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider block" style={{ color: 'var(--guor-dark)' }}>
                Notas Especiales del Pedido
              </label>
              <textarea
                rows={3}
                placeholder="Especificaciones de empaque, horarios de recepción, etc."
                value={notasCliente}
                onChange={(e) => setNotasCliente(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 transition-all placeholder:opacity-40 resize-none"
                style={{ borderColor: 'var(--guor-stone)' }}
              />
            </div>
          </div>

          <p className="text-[10px] font-medium opacity-40 leading-relaxed" style={{ color: 'var(--guor-dark)' }}>
            Al confirmar esta orden, su requerimiento pasará al módulo de validación de crédito y logística. El despacho definitivo está sujeto a la conformidad de los acuerdos de compra pre-establecidos.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end gap-3 bg-gray-50/50" style={{ borderColor: 'var(--guor-stone)' }}>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: 'var(--guor-gold)' }}
          >
            <ClipboardList size={14} />
            {loading ? 'Procesando Orden...' : 'Enviar a Producción'}
          </button>
        </div>
      </form>
    </div>
  );
}