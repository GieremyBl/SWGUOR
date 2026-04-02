"use client";

import { memo } from "react";
import { Package } from "lucide-react";
import type { Categoria } from "@/types";
import ProductoRow from "@/components/admin/productos/ProductosRow"; // Asegúrate de que la ruta sea correcta

// Definimos la interfaz localmente para que coincida con Supabase
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  sku: string;
  precio: number;       
  stock: number;        
  imagen: string;      
  estado: string;
  categoria_id: number;
  ficha_url?: string;
}

interface ProductosTableProps {
  data: Producto[];
  categorias: Categoria[];
  onEdit: (p: Producto) => void;
  onDelete: (p: Producto) => void;
  onStock: (p: Producto) => void;
  onFicha: (p: Producto) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

function ProductosTable({ 
  data, 
  categorias, 
  onEdit, 
  onDelete, 
  onStock,
  onFicha,
  canEdit = false,
  canDelete = false
}: ProductosTableProps) {

  return (
    <div className="space-y-4">
      {/* Contenedor con scroll horizontal para móviles */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">
                Detalle Producto
              </th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">
                Categoría
              </th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">
                Stock
              </th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">
                Estado
              </th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">
                Acciones
              </th>
            </tr>
          </thead>
          
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      No hay productos en inventario
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((p) => (
                <ProductoRow 
                  key={p.id}
                  p={p}
                  categorias={categorias}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStock={onStock}
                  onFicha={onFicha}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Usamos memo para evitar re-renders innecesarios de toda la tabla
export default memo(ProductosTable);