'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  LayoutList,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ESTADOS_ORDEN_COMPRA,
  ESTADOS_PAGO_ORDEN_COMPRA,
} from '@/lib/constants/estados';
import { formatNumeroOc } from '@/lib/helpers/ordenes-compra-helpers';
import { useOrdenesCompra } from '@/lib/hooks/useOrdenesCompra';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import type { OrdenCompraRow } from '../types';
import { OrdenCompraResumenTab } from './OrdenCompraResumenTab';
import { OrdenCompraDocumentoTab } from './OrdenCompraDocumentoTab';

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: LayoutList },
  { id: 'documento', label: 'Documento PDF', icon: FileText },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Props {
  orden: OrdenCompraRow;
}

export function OrdenCompraDetalle({ orden: initialOrden }: Props) {
  const { can } = usePermissions();
  const [orden, setOrden] = useState(initialOrden);
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const { confirmar, cancelar, isConfirming, isCancelling } = useOrdenesCompra({
    enabled: false,
  });

  const canEdit = can('edit', 'ordenes_compra');
  const canCancel = can('cancel', 'ordenes_compra');
  const est = ESTADOS_ORDEN_COMPRA[orden.estado];
  const pago = ESTADOS_PAGO_ORDEN_COMPRA[orden.estado_pago];

  const handleConfirmar = async () => {
    try {
      const res = await confirmar(orden.id);
      if (res.success && res.data) {
        setOrden(res.data as OrdenCompraRow);
        toast.success('Orden confirmada');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleCancelar = async () => {
    if (!confirm('¿Cancelar esta orden de compra?')) return;
    try {
      const res = await cancelar(orden.id);
      if (res.success && res.data) {
        setOrden(res.data as OrdenCompraRow);
        toast.success('Orden cancelada');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const refreshOrden = async () => {
    const res = await fetch(`/api/admin/ordenes-compra/${orden.id}`);
    const json = await res.json();
    if (json.data) setOrden(json.data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <Link
          href="/admin/Panel-Administrativo/ordenes-compra"
          className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-900 text-xs font-bold uppercase tracking-widest mb-4"
        >
          <ArrowLeft size={13} />
          Volver a órdenes de compra
        </Link>

        <header className="rounded-3xl border border-amber-100/80 bg-white shadow-lg shadow-amber-900/5 p-6 md:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-900/20">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/70 mb-1">
                  Orden de compra
                </p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatNumeroOc(orden.id)}
                </h1>
                <p className="text-slate-600 font-medium mt-1">
                  {orden.proveedores?.razon_social}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${est?.bgColor} ${est?.color}`}
                  >
                    {est?.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${pago?.bgColor} ${pago?.color}`}
                  >
                    {pago?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canEdit && orden.estado === 'pendiente' && (
                <Button
                  onClick={handleConfirmar}
                  disabled={isConfirming}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  {isConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  Confirmar
                </Button>
              )}
              {canCancel &&
                orden.estado !== 'cancelada' &&
                orden.estado !== 'completada' && (
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={handleCancelar}
                    disabled={isCancelling}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                )}
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-52 shrink-0">
            <div className="flex lg:flex-col gap-1 bg-white border border-amber-100 rounded-2xl p-2 shadow-sm">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left ${
                    activeTab === id
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-amber-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            {activeTab === 'resumen' && <OrdenCompraResumenTab orden={orden} />}
            {activeTab === 'documento' && (
              <OrdenCompraDocumentoTab
                ordenId={orden.id}
                pdfUrl={orden.pdf_url}
                onRegenerated={refreshOrden}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
