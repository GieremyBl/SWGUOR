"use client";

import { Edit2, Trash2, Loader2, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventarioTableProps {
  data: {
    id: bigint | number | string;
    nombre: string;
    tipo: string;
    categoria_insumo?: string;
    unidad_medida: string;
    stock_actual: any; // Se deja en any o number/Decimal debido a las mutaciones de Prisma
    stock_minimo: any;
    stock_maximo?: any;
    precio_unitario?: any;
    created_at?: Date | string;
    updated_at?: Date | string | null;
    proveedor_id?: bigint | number | null;
    ubicacion_almacen?: string | null;
    alerta_bajo_stock?: boolean | null;
    almacen_id?: bigint | number | null;
  }[];
  loading?: boolean;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function InsumosTable({ data, loading, onEdit, onDelete, canEdit, canDelete }: InventarioTableProps) {
  
  const getStockStatus = (actual: number, minimo: number) => {
    if (actual <= 0) return { label: 'Agotado', style: 'bg-red-50 text-red-700 border-red-100' };
    if (actual <= minimo) return { label: 'Bajo Stock', style: 'bg-amber-50 text-amber-700 border-amber-100' };
    return { label: 'Óptimo', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-2" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Almacén...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left">
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Insumo / Material</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Tipo</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Precio Reposición</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Stock</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
            <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const status = getStockStatus(Number(item.stock_actual), Number(item.stock_minimo));
            const precio = item.precio_unitario ? Number(item.precio_unitario) : 0;

            // Aseguramos un ID compatible para la directiva 'key' de React
            const rowKey = item.id ? item.id.toString() : Math.random().toString();

            return (
              <tr key={rowKey} className="group transition-all duration-200">
                {/* Nombre */}
                <td className="bg-white border-y border-l border-slate-100 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight uppercase">{item.nombre}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unidad_medida}</p>
                    </div>
                  </div>
                </td>

                {/* Categoría */}
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                   <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-black uppercase border border-slate-100">
                    {item.tipo}
                  </span>
                </td>

                {/* Precio Reposición */}
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-50/50 rounded-lg border border-pink-100">
                      <CircleDollarSign size={12} className="text-pink-600" />
                      <span className="text-sm font-black text-pink-700">
                        S/ {precio.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Stock Numérico */}
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-black ${Number(item.stock_actual) <= Number(item.stock_minimo) ? 'text-rose-600' : 'text-slate-800'}`}>
                      {Number(item.stock_actual)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Cant. Disponible</span>
                  </div>
                </td>

                {/* Badge de Estado */}
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${status.style}`}>
                    {status.label}
                  </span>
                </td>

                {/* Acciones */}
                <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                  <div className="flex justify-end gap-2">
                    {canEdit && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onEdit(item)}
                        title="Gestionar Stock y Precios"
                        className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 cursor-pointer transition-all active:scale-90"
                      >
                        <Edit2 size={16}/>
                      </Button>
                    )}

                    {canDelete && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => onDelete(item)}
                        className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all active:scale-90"
                      >
                        <Trash2 size={16}/>
                      </Button>
                    )}

                    {!canEdit && !canDelete && (
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Lectura</span>
                    )}
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