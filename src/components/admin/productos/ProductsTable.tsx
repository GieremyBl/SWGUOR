"use client";

import { memo } from "react";
import { Package } from "lucide-react";
import { ProductoConRelaciones, Categoria } from "@/app/admin/Panel-Administrativo/productos/types";
import ProductoRow from "@/components/admin/productos/ProductsRow";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductosTableProps {
  data: ProductoConRelaciones[];
  categorias: Categoria[];
  loading?: boolean;
  onArchive: (p: ProductoConRelaciones) => void;
  onEdit: (p: ProductoConRelaciones) => void;
  onStatusChange?: (p: ProductoConRelaciones) => void;
  // Se eliminan canEdit y canArchive de la interfaz ya que el Row maneja sus propios permisos internos
}

function ProductosTable({
  data,
  categorias,
  loading,
  onArchive,
  onEdit,
  onStatusChange,
}: ProductosTableProps) {

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-guor-gold/70 uppercase">Detalle Producto</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-guor-gold/70 uppercase text-center">Categoría</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-guor-gold/70 uppercase text-center">Stock</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-guor-gold/70 uppercase text-center">Estado</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-guor-gold/70 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // --- ESTADO DE CARGA (SKELETON) ---
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td className="bg-guor-cream border-y border-l border-guor-peach/50 py-5 px-6 rounded-l-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="bg-guor-cream border-y border-guor-peach/50 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-6 w-24 mx-auto rounded-full" />
                  </td>
                  <td className="bg-guor-cream border-y border-guor-peach/50 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-5 w-12 mx-auto rounded-md" />
                  </td>
                  <td className="bg-guor-cream border-y border-guor-peach/50 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </td>
                  <td className="bg-guor-cream border-y border-r border-guor-peach/50 py-5 px-6 rounded-r-2xl text-right shadow-sm">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              // --- SIN DATOS ---
              <tr>
                <td colSpan={5} className="bg-guor-cream rounded-2xl border border-guor-peach/50 py-16 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 text-slate-200" />
                    <p className="text-guor-gold/70 font-bold uppercase text-xs tracking-widest">No hay productos</p>
                  </div>
                </td>
              </tr>
            ) : (
              // --- LISTA DE PRODUCTOS ---
              data.map((p) => (
                <ProductoRow
                  key={p.id.toString()}
                  p={p}
                  categorias={categorias}
                  onArchive={onArchive}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  // Solución al Error TS2322: Se removieron canEdit y canArchive de aquí
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(ProductosTable);