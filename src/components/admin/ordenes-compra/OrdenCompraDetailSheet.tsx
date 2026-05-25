'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ESTADOS_ORDEN_COMPRA,
  ESTADOS_PAGO_ORDEN_COMPRA,
} from '@/lib/constants/estados';
import { formatNumeroOc } from '@/lib/helpers/ordenes-compra-helpers';
import type { OrdenCompraRow } from './types';

interface Props {
  orden: OrdenCompraRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrdenCompraDetailSheet({ orden, open, onOpenChange }: Props) {
  if (!orden) return null;

  const est = ESTADOS_ORDEN_COMPRA[orden.estado];
  const pago = ESTADOS_PAGO_ORDEN_COMPRA[orden.estado_pago];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-black">
            {formatNumeroOc(orden.id)}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Proveedor
            </h3>
            <p className="font-semibold text-slate-900">
              {orden.proveedores?.razon_social}
            </p>
            <p className="text-sm text-slate-500">RUC: {orden.proveedores?.ruc}</p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Info label="Estado">
              <span className={`text-sm font-bold ${est?.color ?? ''}`}>
                {est?.label ?? orden.estado}
              </span>
            </Info>
            <Info label="Pago">
              <span className={`text-sm font-bold ${pago?.color ?? ''}`}>
                {pago?.label ?? orden.estado_pago}
              </span>
            </Info>
            <Info label="Total">
              S/ {Number(orden.total_orden).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Info>
            <Info label="Saldo">
              S/ {Number(orden.saldo_pendiente ?? orden.total_orden - orden.total_pagado).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </Info>
            <Info label="F. prometida">
              {orden.fecha_prometida
                ? new Date(orden.fecha_prometida).toLocaleDateString('es-PE')
                : '—'}
            </Info>
            <Info label="Cotización">
              {orden.cotizaciones_proveedor?.numero_externo
                ? `#${orden.cotizaciones_proveedor.numero_externo}`
                : orden.cotizacion_proveedor_id
                  ? `ID ${orden.cotizacion_proveedor_id}`
                  : 'Manual'}
            </Info>
          </section>

          {orden.notas && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Notas
              </h3>
              <p className="text-sm text-slate-600">{orden.notas}</p>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Ítems ({orden.ordenes_compra_items?.length ?? 0})
            </h3>
            <div className="space-y-2">
              {(orden.ordenes_compra_items ?? []).map((item) => {
                const nombre =
                  item.materiales?.nombre ?? item.insumo?.nombre ?? 'Ítem';
                const tipo = item.material_id ? 'Material' : 'Insumo';
                const subtotal = Number(
                  item.subtotal ?? item.cantidad_pedida * item.precio_unitario,
                );
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 text-sm"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-slate-800">{nombre}</span>
                      <span className="text-[10px] uppercase text-slate-400">{tipo}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-slate-500 text-xs">
                      <span>
                        {Number(item.cantidad_pedida)} × S/{' '}
                        {Number(item.precio_unitario).toFixed(2)}
                      </span>
                      <span className="font-bold text-slate-700">
                        S/ {subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  );
}
