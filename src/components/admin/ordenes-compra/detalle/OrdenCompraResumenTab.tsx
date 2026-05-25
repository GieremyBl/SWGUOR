'use client';

import {
  ESTADOS_ORDEN_COMPRA,
  ESTADOS_PAGO_ORDEN_COMPRA,
} from '@/lib/constants/estados';
import type { OrdenCompraRow } from '../types';

interface Props {
  orden: OrdenCompraRow;
}

export function OrdenCompraResumenTab({ orden }: Props) {
  const est = ESTADOS_ORDEN_COMPRA[orden.estado];
  const pago = ESTADOS_PAGO_ORDEN_COMPRA[orden.estado_pago];
  const saldo =
    orden.saldo_pendiente ??
    Number(orden.total_orden) - Number(orden.total_pagado);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Estado" value={est?.label ?? orden.estado} accent={est?.color} />
        <MetricCard label="Pago" value={pago?.label ?? orden.estado_pago} accent={pago?.color} />
        <MetricCard
          label="Total orden"
          value={`S/ ${Number(orden.total_orden).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
        />
        <MetricCard
          label="Saldo pendiente"
          value={`S/ ${Number(saldo).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-amber-100/80 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-800/70 mb-4">
            Proveedor
          </h3>
          <dl className="space-y-3 text-sm">
            <Row label="Razón social" value={orden.proveedores?.razon_social} />
            <Row label="RUC" value={orden.proveedores?.ruc} />
            <Row label="Contacto" value={orden.proveedores?.contacto} />
            <Row label="Teléfono" value={orden.proveedores?.telefono} />
            <Row label="Email" value={orden.proveedores?.email} />
          </dl>
        </section>

        <section className="rounded-2xl border border-amber-100/80 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-800/70 mb-4">
            Condiciones
          </h3>
          <dl className="space-y-3 text-sm">
            <Row
              label="F. prometida"
              value={
                orden.fecha_prometida
                  ? new Date(orden.fecha_prometida).toLocaleDateString('es-PE')
                  : '—'
              }
            />
            <Row
              label="Cotización ref."
              value={
                orden.cotizaciones_proveedor?.numero_externo
                  ? `#${orden.cotizaciones_proveedor.numero_externo}`
                  : orden.cotizacion_proveedor_id
                    ? `COT-${orden.cotizacion_proveedor_id}`
                    : 'Manual'
              }
            />
            <Row
              label="Creada"
              value={
                orden.created_at
                  ? new Date(orden.created_at).toLocaleString('es-PE')
                  : '—'
              }
            />
            {orden.notas && <Row label="Notas" value={orden.notas} />}
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50/80 to-white">
          <h3 className="font-bold text-slate-900">Ítems de la orden</h3>
          <span className="text-lg font-black text-slate-900">
            S/ {Number(orden.total_orden).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="text-left py-3 px-5">Descripción</th>
                <th className="text-left py-3 px-5">Tipo</th>
                <th className="text-right py-3 px-5">Cantidad</th>
                <th className="text-right py-3 px-5">P. unit.</th>
                <th className="text-right py-3 px-5">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(orden.ordenes_compra_items ?? []).map((item) => {
                const sub = Number(
                  item.subtotal ?? item.cantidad_pedida * item.precio_unitario,
                );
                return (
                  <tr key={item.id} className="border-t border-slate-50 hover:bg-amber-50/30">
                    <td className="py-3 px-5 font-medium text-slate-800">
                      {item.materiales?.nombre ?? item.insumo?.nombre ?? '—'}
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                        {item.material_id ? 'Material' : 'Insumo'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right tabular-nums">
                      {Number(item.cantidad_pedida)}
                    </td>
                    <td className="py-3 px-5 text-right tabular-nums">
                      S/ {Number(item.precio_unitario).toFixed(2)}
                    </td>
                    <td className="py-3 px-5 text-right font-semibold tabular-nums">
                      S/ {sub.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-100/60 bg-gradient-to-br from-white to-amber-50/40 p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-black ${accent ?? 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 pb-2 last:border-0">
      <dt className="text-slate-400 shrink-0">{label}</dt>
      <dd className="font-medium text-slate-800 text-right">{value || '—'}</dd>
    </div>
  );
}

