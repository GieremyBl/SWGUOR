"use client";

import { Edit2, Trash2, Layers, Loader2 } from "lucide-react";
import { Inventario } from "@/types/supabase.types";
import { Button } from "@/components/ui/button";

interface InventarioTableProps {
  data: Inventario[];
  loading?: boolean;
  onEdit: (item: Inventario) => void;
  onDelete: (item: Inventario) => void;
}

export default function InventarioTable({ data, loading, onEdit, onDelete }: InventarioTableProps) {
  
  const getStockStatus = (actual: number, minimo: number) => {
    if (actual <= 0) return { label: 'Agotado', style: 'bg-red-50 text-red-700 border-red-100' };
    if (actual <= minimo) return { label: 'Bajo Stock', style: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { label: 'Óptimo', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-600 animate-spin mb-2" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Almacén...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left">
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Insumo / Material</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Tipo</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Stock</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const status = getStockStatus(item.stock_actual, item.stock_minimo);
            return (
              <tr key={item.id} className="group transition-all duration-200">
                <td className="bg-white border-y border-l border-slate-100 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-600 transition-colors border border-slate-100">
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight uppercase">{item.nombre}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unidad_medida}</p>
                    </div>
                  </div>
                </td>
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                   <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-[9px] font-black uppercase border border-slate-100">
                    {item.tipo}
                  </span>
                </td>
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-black ${item.stock_actual <= item.stock_minimo ? 'text-rose-600' : 'text-slate-800'}`}>
                      {item.stock_actual}
                    </span>
                  </div>
                </td>
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase ${status.style}`}>
                    {status.label}
                  </span>
                </td>
                <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onEdit(item)}
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <Edit2 size={16}/>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => onDelete(item)}
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all"
                    >
                      <Trash2 size={16}/>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}