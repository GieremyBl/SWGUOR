"use client";

import Image from "next/image";
import { Edit2, Trash2, Package, BarChart3 } from "lucide-react";
import type { Producto, Categoria } from "@/types/supabase.types";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface ProductosTableProps {
  data: Producto[];
  categorias: Categoria[];
  onEdit: (p: Producto) => void;
  onDelete: (p: Producto) => void;
  onStock: (p: Producto) => void;
}

export default function ProductosTable({ 
  data, 
  categorias, 
  onEdit, 
  onDelete, 
  onStock 
}: ProductosTableProps) {

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      activo: 'bg-green-100 text-green-800 border-green-200',
      inactivo: 'bg-gray-100 text-gray-800 border-gray-200',
      agotado: 'bg-red-100 text-red-800 border-red-200'
    };
    return badges[estado] || badges.inactivo;
  };

  const getCategoriaNombre = (id: number) => {
    return categorias.find(c => c.id === id)?.nombre || 'Sin categoría';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                  No se encontraron productos disponibles.
                </td>
              </tr>
            ) : (
              data.map((p: Producto) => {
                const { data: urlData } = getSupabaseBrowserClient()
                  .storage
                  .from('productos')
                  .getPublicUrl(p.imagen || '');
                
                const publicUrl = urlData.publicUrl; 
                const hasImage = p.imagen && p.imagen.trim() !== '';

                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 relative bg-gray-100 rounded-md border border-gray-200 shrink-0 overflow-hidden">
                        {hasImage ? (
                          <Image 
                            src={publicUrl} 
                            alt={p.nombre || "Producto"} 
                            fill 
                            sizes="48px"
                            className="object-cover"
                            unoptimized 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/100x100?text=Error+404";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 leading-tight">{p.sku}</div>
                        <div className="text-gray-500 text-xs truncate">{p.nombre}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 italic">
                      {getCategoriaNombre(p.categoria_id)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      S/ {p.precio?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.stock <= p.stock_minimo 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {p.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getEstadoBadge(p.estado)}`}>
                        {p.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <button onClick={() => onStock(p)} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg"><BarChart3 className="w-4 h-4" /></button>
                        <button onClick={() => onEdit(p)} className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(p)} className="p-2 text-slate-500 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}