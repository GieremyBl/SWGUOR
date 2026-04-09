"use client";

import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import type { Database } from '@/types/database';

type Insumo = Database['public']['Tables']['insumo']['Row'];
import router from 'next/router';

interface StockAlertCardProps {
  items: Insumo[];
}

export default function StockAlertCard({ items }: StockAlertCardProps) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-orange-100 h-full flex flex-col">
      {/* HEADER DEL WIDGET */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl shadow-sm border border-orange-100">
            <AlertTriangle size={22} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tight text-slate-800 text-lg leading-none">Stock Crítico</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Insumos GUOR</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
          </span>
          <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">
            {items.length} Alerta{items.length !== 1 ? 's' : ''} Activa{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* CUERPO - LISTADO CON SCROLL */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-orange-200 hover:bg-white transition-all group">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-orange-50 transition-colors flex-shrink-0 border border-slate-200">
                  <Package size={20} className="text-slate-400 group-hover:text-orange-600 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-700 uppercase leading-tight truncate">{item.nombre}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">
                      {item.stock_actual} {item.unidad_medida}
                    </p>
                  </div>
                </div>
              </div>
              
              <button className="p-2.5 bg-white text-orange-600 rounded-lg shadow-sm hover:bg-orange-600 hover:text-white transition-all flex-shrink-0 ml-2">
                <ArrowRight size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 opacity-50">
            <Package size={48} className="mb-3 text-slate-300" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-tighter">Inventario completo</p>
          </div>
        )}
      </div>

      {/* FOOTER - ACCIÓN GLOBAL */}
      <button 
        onClick={() => router.push('/admin/inventario')}
        className="w-full mt-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:from-slate-800 hover:to-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-800"
      >
        Reponer Inventario
        <ArrowRight size={14} />
      </button>
    </div>
  );
}