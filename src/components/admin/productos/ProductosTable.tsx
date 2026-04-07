"use client";

import { Edit2, Trash2, Package, BarChart3, Tag, Lock, FileText, Paperclip, CheckCircle2 } from "lucide-react";
import type { Producto, Categoria } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { memo } from "react";


// --- COMPONENTE DE FILA (Optimizado) ---
const ProductoRow = memo(({ 
  p, 
  categorias, 
  onEdit, 
  onDelete, 
  onStock, 
  onFicha, 
  canEdit, 
  canDelete 
}: {
  p: Producto;
  categorias: Categoria[];
  onEdit: (p: Producto) => void;
  onDelete: (p: Producto) => void;
  onStock: (p: Producto) => void;
  onFicha: (p: Producto) => void;
  canEdit: boolean;
  canDelete: boolean;
}) => {
  // 1. Extraemos SOLO el nombre del archivo para evitar que la URL se duplique
  const rawImage = String(p.imagen || "").trim();
  const fileName = rawImage.split('/').pop(); 

  // 2. Construimos la URL limpia apuntando directamente al bucket de Supabase
  const publicUrl = fileName && fileName !== "null" && fileName !== ""
    ? `https://fkpvmgfsopjhvorckoat.supabase.co/storage/v1/object/public/productos/${fileName}` 
    : null;
  const hasFicha = (p as any).ficha_url; 

  const categoriaNombre = categorias.find(c => c.id === p.categoria_id)?.nombre || 'Sin categoría';

  return (
    <tr className="group transition-all duration-200">
      {/* Detalle Producto */}
      <td className="bg-white border-y border-l border-slate-100 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 relative bg-slate-50 rounded-xl border border-slate-100 shrink-0 overflow-hidden">
            {publicUrl ? (
              <img 
                src={publicUrl} 
                alt={p.nombre || "Producto"} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none">
                {p.sku}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {hasFicha ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <Paperclip size={14} className="text-slate-300" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 text-white text-[9px] font-bold uppercase">
                    {hasFicha ? "Patrón cargado" : "Sin documentación"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-slate-500 text-[13px] font-medium mt-1 truncate max-w-50">
              {p.nombre}
            </div>
            <div className="text-pink-600 font-black text-sm mt-1">
              S/ {p.precio?.toFixed(2)}
            </div>
          </div>
        </div>
      </td>

      {/* Categoría */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
          <Tag size={10} className="text-slate-400" />
          {categoriaNombre}
        </div>
      </td>

      {/* Stock */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm">
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-slate-900">
            {p.stock}
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unidades</span>
        </div>
      </td>

      {/* Estado */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm">
        <Badge className={`rounded-full px-3 py-0.5 text-[9px] font-black border-2 uppercase shadow-none ${
          p.estado === 'activo' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : p.estado === 'agotado'
            ? 'bg-rose-50 text-rose-600 border-rose-100'
            : 'bg-slate-50 text-slate-400 border-slate-100'
        }`} variant="outline">
          {p.estado}
        </Badge>
      </td>

      {/* Acciones */}
      <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm">
        <div className="flex justify-end items-center gap-2">
          <TooltipProvider>
            {/* Ficha Técnica */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" size="icon" 
                  onClick={() => onFicha(p)}
                  className={`h-9 w-9 rounded-xl border-slate-200 transition-all ${hasFicha ? 'text-pink-600 border-pink-100 bg-pink-50' : 'text-slate-400 hover:text-pink-600 hover:bg-pink-50'}`}
                >
                  <FileText size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-[10px] font-bold uppercase">Documentación Técnica</p>
              </TooltipContent>
            </Tooltip>

            {/* Movimientos Stock */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" size="icon" 
                  onClick={() => onStock(p)}
                  className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <BarChart3 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-[10px] font-bold uppercase">Gestionar Stock</p></TooltipContent>
            </Tooltip>

            {/* Editar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" size="icon" 
                  onClick={() => canEdit && onEdit(p)}
                  disabled={!canEdit}
                  className={`h-9 w-9 rounded-xl border-slate-200 transition-all ${!canEdit ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'}`}
                >
                  {canEdit ? <Edit2 size={16} /> : <Lock size={14} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-[10px] font-bold uppercase">{canEdit ? 'Editar Producto' : 'Solo lectura'}</p></TooltipContent>
            </Tooltip>

            {/* Eliminar */}
            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" size="icon" 
                    onClick={() => onDelete(p)}
                    className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px] font-bold uppercase">Eliminar</p></TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </td>
    </tr>
  );
});

ProductoRow.displayName = "ProductoRow";

// --- COMPONENTE PRINCIPAL ---
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
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Detalle Producto</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Categoría</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Stock</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay productos en inventario</p>
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

export default memo(ProductosTable);