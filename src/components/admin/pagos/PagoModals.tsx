'use client';

import { useEffect, useState } from 'react';
import { X, DollarSign, CreditCard, FileText, Calendar, User, CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PagoDetalleComprobanteSection } from '@/components/admin/pagos/PagoDetalleComprobanteSection';
import { PagoDetallePedidoSection } from '@/components/admin/pagos/PagoDetallePedidoSection';
import type { AdminPagoDetalle } from '@/lib/schemas/admin-pago-detalle';
import type { Pago } from './PagosTable';

// ─────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────

const ESTADO_STYLES: Record<string, string> = {
  pendiente:   'bg-amber-50 text-amber-700 border-amber-200',
  pagado:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  pago_parcial:'bg-emerald-50 text-emerald-700 border-emerald-200',
  anulado:     'bg-red-50 text-red-700 border-red-200',
};

const METODO_LABELS: Record<string, string> = {
  efectivo:          'Efectivo',
  transferencia_bcp: 'Transferencia BCP',
  yape:              'Yape',
  plin:              'Plin',
  visa:              'Visa',
  mastercard:        'Mastercard',
};

const TIPO_LABELS: Record<string, string> = {
  adelanto:      'Adelanto',
  cuota:         'Cuota',
  saldo_final:   'Saldo Final',
  pago_completo: 'Pago Completo',
};

function formatMoney(value: number | string | null | undefined) {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

interface DetailProps {
  pago: Pago;
  onClose: () => void;
}

export function PagoDetailModal({ pago, onClose }: DetailProps) {
  const fields = [
    { label: 'Monto',          value: formatMoney(pago.monto),                    icon: <DollarSign className="w-3.5 h-3.5" /> },
    { label: 'Método de Pago', value: METODO_LABELS[pago.metodo_pago] ?? pago.metodo_pago, icon: <CreditCard className="w-3.5 h-3.5" /> },
    { label: 'Tipo',           value: TIPO_LABELS[pago.tipo] ?? pago.tipo,        icon: <FileText className="w-3.5 h-3.5" /> },
    { label: 'Fecha de Pago',  value: formatDate(pago.fecha_pago),                icon: <Calendar className="w-3.5 h-3.5" /> },
    { label: 'Registrado por', value: pago.usuario?.nombre_completo ?? '—',       icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient strip */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Pedido #{pago.pedido_id}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {pago.pedidos?.clientes?.razon_social ?? 'Cliente no especificado'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            {fields.map(f => (
              <div key={f.label} className="flex justify-between items-center py-2.5 px-3 border-b last:border-0 border-gray-100">
                <div className="flex items-center gap-2 text-gray-500">
                  {f.icon}
                  <span className="text-xs font-semibold uppercase tracking-wider">{f.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{f.value}</span>
              </div>
            ))}
          </div>

          {/* Estado */}
          <div className="flex justify-between items-center py-2.5 px-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Estado</span>
            </div>
            <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${ESTADO_STYLES[pago.estado] ?? ''}`}>
              {pago.estado}
            </Badge>
          </div>

          {/* Verificación info */}
          {pago.verificado_at && (
            <div className="flex justify-between items-center py-2.5 px-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Verificado</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-emerald-700">{formatDate(pago.verificado_at)}</p>
                {pago.verificado_por_usuario && (
                  <p className="text-[10px] text-emerald-500">por {pago.verificado_por_usuario.nombre_completo}</p>
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          {pago.notas && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Notas</p>
              <p className="text-sm text-slate-700">{pago.notas}</p>
            </div>
          )}

          {/* Resumen del pedido */}
          {pago.pedidos && (
            <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-2">Resumen del Pedido</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-black text-indigo-700">{formatMoney(pago.pedidos.total)}</p>
                  <p className="text-[10px] text-indigo-400 uppercase font-semibold">Total</p>
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-600">{formatMoney(pago.pedidos.monto_pagado)}</p>
                  <p className="text-[10px] text-emerald-400 uppercase font-semibold">Pagado</p>
                </div>
                <div>
                  <p className="text-lg font-black text-amber-600">{formatMoney(pago.pedidos.saldo_pendiente)}</p>
                  <p className="text-[10px] text-amber-400 uppercase font-semibold">Pendiente</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VERIFY MODAL
// ─────────────────────────────────────────────────────────────

interface VerifyProps {
  pago: Pago;
  onClose: () => void;
  onSuccess: () => void;
}

export function PagoVerifyModal({ pago, onClose, onSuccess }: VerifyProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'verificado' | 'rechazado') => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/pagos/${pago.id_uuid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: action }),
      });

      if (!res.ok) throw new Error('Error al actualizar');

      toast.success(
        action === 'verificado'
          ? `Pago de ${formatMoney(pago.monto)} verificado exitosamente`
          : `Pago de ${formatMoney(pago.monto)} rechazado`
      );
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Error al procesar la acción');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Verificar Pago</h3>
        <p className="text-sm text-gray-500 mt-2">
          Pago de <span className="font-bold text-gray-900">{formatMoney(pago.monto)}</span> para el
          Pedido <span className="font-bold text-gray-900">#{pago.pedido_id}</span>.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Método: {METODO_LABELS[pago.metodo_pago] ?? pago.metodo_pago}
        </p>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => handleAction('rechazado')}
            variant="outline"
            className="flex-1 h-11 border-red-200 text-red-600 hover:bg-red-50"
            disabled={isProcessing}
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            Rechazar
          </Button>
          <Button
            onClick={() => handleAction('verificado')}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Procesando…</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-1.5" />Verificar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
