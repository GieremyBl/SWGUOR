"use client";

import React from 'react';
import { Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Database } from '@/types/database';

type Orden = Database['public']['Tables']['ordenes']['Row'];
type EstadoOrden = Database['public']['Enums']['EstadoOrden'];

interface RecentOrdersTableProps {
  orders: (Orden & { clientes: { razon_social: string } | null })[];
}

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ReactNode }> = {
  solicitado: { cls: 'bg-blue-50 text-blue-600 border-blue-100',     icon: <Clock size={11} /> },
  cotizado:   { cls: 'bg-purple-50 text-purple-600 border-purple-100', icon: <Clock size={11} /> },
  aprobado:   { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={11} /> },
  pagado:     { cls: 'bg-cyan-50 text-cyan-600 border-cyan-100',      icon: <CheckCircle2 size={11} /> },
  en_proceso: { cls: 'bg-orange-50 text-orange-600 border-orange-100', icon: <AlertCircle size={11} /> },
  finalizado: { cls: 'bg-slate-100 text-slate-600 border-slate-200',  icon: <CheckCircle2 size={11} /> },
  cancelado:  { cls: 'bg-rose-50 text-rose-600 border-rose-100',      icon: <AlertCircle size={11} /> },
};

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const pendientes = orders.filter((o) => o.estado === 'solicitado').length;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 w-full overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-black uppercase tracking-tight text-slate-800 text-base leading-none">
            Órdenes Recientes
          </h3>
          <p className="text-slate-400 text-xs font-medium mt-1.5">
            Monitor en tiempo real del flujo operativo
          </p>
        </div>
        <button className="text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-all shadow-sm shrink-0">
          Ver todas
        </button>
      </div>

      {/* Table — sin overflow-x, columnas fijas */}
      {orders.length === 0 ? (
        <div className="py-10 text-center text-slate-300 text-sm">
          Sin órdenes recientes
        </div>
      ) : (
        <table className="w-full text-left border-separate border-spacing-y-2 table-fixed">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[35%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="pb-3 pl-3">ID</th>
              <th className="pb-3">Cliente</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Estado</th>
              <th className="pb-3 text-right pr-3">Ver</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.estado || 'solicitado'] ?? {
                cls: 'bg-gray-50 text-gray-600 border-gray-100',
                icon: null,
              };
              return (
                <tr key={order.id} className="group">
                  <td className="py-3 pl-3 bg-slate-50 group-hover:bg-white rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-200 transition-all">
                    <span className="font-black text-slate-900 text-[11px] italic">
                      #{order.id.toString().padStart(5, '0')}
                    </span>
                  </td>
                  <td className="py-3 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-200 transition-all">
                    <p className="font-bold text-slate-700 text-xs uppercase truncate pr-2">
                      {order.clientes?.razon_social || 'Consumidor General'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('es-PE', {
                        day: 'numeric', month: 'short',
                      }) : 'Sin fecha'}
                    </p>
                  </td>
                  <td className="py-3 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-200 transition-all">
                    <span className="font-black text-slate-900 text-xs">
                      S/ {Number(order.total_pagado ?? 0).toLocaleString('es-PE')}
                    </span>
                  </td>
                  <td className="py-3 bg-slate-50 group-hover:bg-white border-y border-transparent group-hover:border-slate-200 transition-all">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${cfg.cls}`}>
                      {cfg.icon}
                      <span className="truncate max-w-[60px]">
                        {(order.estado || 'solicitado').replace('_', ' ')}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 pr-3 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-200 bg-slate-50 group-hover:bg-white transition-all text-right">
                    <button className="p-2 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl transition-all inline-flex">
                      <Eye size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Footer */}
      {pendientes > 0 && (
        <div className="mt-5 p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
          <AlertCircle size={14} className="text-blue-600 shrink-0" />
          <div>
            <p className="text-[9px] font-black text-blue-900 uppercase tracking-wider">
              {pendientes} Orden{pendientes !== 1 ? 'es' : ''} pendiente{pendientes !== 1 ? 's' : ''}
            </p>
            <p className="text-[8px] text-blue-600 font-bold uppercase">Requieren cotización o aprobación</p>
          </div>
        </div>
      )}
    </div>
  );
}