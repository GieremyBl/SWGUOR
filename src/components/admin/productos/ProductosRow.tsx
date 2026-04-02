"use client";

import { memo } from "react";
import Image from "next/image";
import { 
  Edit2, Trash2, Package, BarChart3, Tag, Lock, 
  FileText, Paperclip, CheckCircle2 
} from "lucide-react";
import type { Categoria } from "@/types"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  ficha_tecnica?: {
    tela?: string;
    consumo?: string;
    instrucciones?: string;
  };
}

// URL base para imágenes de Supabase
const STORAGE_URL = "https://fkpvmgfsopjhvorckoat.supabase.co/storage/v1/object/public/productos/";

interface ProductoRowProps {
  p: Producto;
  categorias: Categoria[];
  onEdit: (p: Producto) => void;
  onDelete: (p: Producto) => void;
  onStock: (p: Producto) => void;
  onFicha: (p: Producto) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const ProductoRow = memo(({ 
  p, 
  categorias, 
  onEdit, 
  onDelete, 
  onStock, 
  onFicha, 
  canEdit, 
  canDelete 
}: ProductoRowProps) => {
  
  // Lógica de Imagen corregida
  const hasImage = p.imagen && p.imagen.trim() !== '';
  const publicUrl = hasImage 
    ? (p.imagen.startsWith('http') ? p.imagen : `${STORAGE_URL}${p.imagen}`) 
    : null;

  // Lógica de Ficha Técnica corregida
  const hasFicha = p.ficha_url || p.ficha_tecnica; 
  
  const categoriaNombre = categorias.find(c => c.id === p.categoria_id)?.nombre || 'Sin categoría';

  return (
    <tr className="group transition-all duration-200">
      <td className="bg-white border-y border-l border-slate-100 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 relative bg-slate-50 rounded-xl border border-slate-100 shrink-0 overflow-hidden">
            {publicUrl ? (
              <Image 
                src={publicUrl} 
                alt={p.nombre || "Producto"} 
                fill 
                sizes="56px"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                unoptimized 
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
              {hasFicha ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <Paperclip size={14} className="text-slate-300" />
              )}
            </div>
            
            <div className="text-slate-700 text-[13px] font-bold mt-1 truncate max-w-[250px]">
              {p.nombre}
            </div>

            {p.descripcion && (
              <div className="text-slate-400 text-[11px] font-medium leading-tight line-clamp-1 max-w-[200px]">
                {p.descripcion}
              </div>
            )}

            <div className="text-pink-600 font-black text-sm mt-1">
              S/ {p.precio?.toFixed(2)}
            </div>
          </div>
        </div>
      </td>

      <td className="bg-white border-y border-slate-100 text-center shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
          <Tag size={10} className="text-slate-400" />
          {categoriaNombre}
        </div>
      </td>

      <td className="bg-white border-y border-slate-100 text-center shadow-sm">
        <div className="flex flex-col items-center">
          <span className={`text-lg font-black ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>
            {p.stock}
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unidades</span>
        </div>
      </td>

      <td className="bg-white border-y border-slate-100 text-center shadow-sm">
        <Badge className={`rounded-full px-3 py-0.5 text-[9px] font-black border-2 uppercase shadow-none ${
          p.estado === 'activo' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-rose-50 text-rose-600 border-rose-100'
        }`} variant="outline">
          {p.estado}
        </Badge>
      </td>

      <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm">
        <div className="flex justify-end items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => onFicha(p)} className={`h-9 w-9 rounded-xl border-slate-200 transition-all ${hasFicha ? 'text-pink-600 border-pink-100 bg-pink-50' : 'text-slate-400 hover:text-pink-600 hover:bg-pink-50'}`}>
                  <FileText size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px] font-bold uppercase">Patrón / Ficha</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => onStock(p)} className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <BarChart3 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px] font-bold uppercase">Inventario</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => canEdit && onEdit(p)} 
                  disabled={!canEdit} 
                  className={`h-9 w-9 rounded-xl border-slate-200 transition-all ${!canEdit ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'}`}
                >
                  {canEdit ? <Edit2 size={16} /> : <Lock size={14} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px] font-bold uppercase">{canEdit ? 'Editar' : 'Bloqueado'}</TooltipContent>
            </Tooltip>

            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => onDelete(p)} className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all">
                    <Trash2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[10px] font-bold uppercase">Eliminar</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </td>
    </tr>
  );
});

ProductoRow.displayName = "ProductoRow";

export default ProductoRow;