"use client";

import { useMemo, memo } from "react";
import Image from "next/image";
import { 
  Edit2, Trash2, Package, Tag, Lock, 
  CheckCircle2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProductoConRelaciones, Categoria } from "@/app/admin/Panel-Administrativo/productos/types";
import { usePermissions } from '@/lib/hooks/usePermissions';

interface ProductoRowProps {
  p: ProductoConRelaciones;
  categorias: Categoria[];
  onArchive: (p: ProductoConRelaciones) => void;
  onEdit: (p: ProductoConRelaciones) => void;
  onStatusChange?: (p: ProductoConRelaciones) => void;
}

// Solución al Error TS2345: Tipado ultra-seguro que acepta BigInt, null y undefined, convirtiendo todo primero a String nativo
const normalizeId = (id: string | number | bigint | null | undefined) => {
  if (id === null || id === undefined) return '';
  return String(id).replace(/[^0-9]/g, '');
};

const ProductoRow = memo(({
  p,
  categorias,
  onArchive,
  onEdit,
  onStatusChange,
}: ProductoRowProps) => {
  const { can } = usePermissions();
  const canEdit    = can('edit',    'productos');
  const canArchive = can('archive', 'productos');

  const rawImage  = String(p.imagen || "").trim();
  const fileName  = rawImage.split('/').pop();
  const publicUrl = fileName && fileName !== "null" && fileName !== ""
    ? `https://fkpvmgfsopjhvorckoat.supabase.co/storage/v1/object/public/productos/${fileName}`
    : null;

  const hasFicha = !!p.ficha_tecnica_rel;

  const categoriaNombre = useMemo(() => {
    const relacionDirecta = p.categorias || (p as unknown as { categoria: Categoria | null }).categoria;
    if (relacionDirecta?.nombre) return relacionDirecta.nombre;
    if (!p.categoria_id)         return 'Sin categoría';
    
    const encontrada = categorias.find(
      (c) => normalizeId(c.id) === normalizeId(p.categoria_id)
    );
    return encontrada ? encontrada.nombre : 'Sin categoría';
  }, [p, categorias]);

  return (
    <tr className="group transition-all duration-200">
      {/* ── Detalle ── */}
      <td className="bg-guor-cream border-y border-l border-guor-peach/50 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md group-hover:bg-guor-cream/60 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 relative bg-guor-cream/60 rounded-xl border border-guor-peach/50 shrink-0 overflow-hidden flex items-center justify-center">
            {publicUrl ? (
              <Image 
                src={publicUrl} 
                alt={p.nombre} 
                width={56}
                height={56}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-guor-gold/40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-guor-dark text-sm tracking-tight uppercase leading-none">
                {p.nombre}
              </span>
              {hasFicha && <CheckCircle2 size={14} className="text-emerald-500" />}
            </div>
            <div className="text-guor-gold text-[13px] font-medium mt-1 truncate max-w-[200px]">SKU: {p.sku}</div>
            <div className="text-guor-brown font-black text-sm mt-1">S/ {Number(p.precio).toFixed(2)}</div>
          </div>
        </div>
      </td>

      {/* ── Categoría ── */}
      <td className="bg-guor-cream border-y border-guor-peach/50 text-center shadow-sm group-hover:bg-guor-cream/60 transition-all">
        <div className="inline-flex items-center gap-1.5 bg-guor-cream/60 px-3 py-1 rounded-lg border border-guor-peach/50 text-guor-brown/70 text-[10px] font-black uppercase tracking-tight">
          <Tag size={10} /> {categoriaNombre}
        </div>
      </td>

      {/* ── Stock ── */}
      <td className="bg-guor-cream border-y border-guor-peach/50 text-center shadow-sm group-hover:bg-guor-cream/60 transition-all">
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-guor-dark">{p.stock}</span>
          <span className="text-[9px] font-black text-guor-gold/70 uppercase tracking-widest">Unidades</span>
        </div>
      </td>

      {/* ── Estado ── */}
      <td className="bg-guor-cream border-y border-guor-peach/50 text-center shadow-sm group-hover:bg-guor-cream/60 transition-all">
        <button type="button" onClick={() => onStatusChange?.(p)} className="group/status relative">
          <Badge
            className={`rounded-full px-3 py-1 text-[9px] font-black border-2 uppercase transition-all duration-300 ${
              p.estado === 'activo'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white'
            }`}
            variant="outline"
          >
            {p.estado}
          </Badge>
        </button>
      </td>

      {/* ── Acciones ── */}
      <td className="bg-guor-cream border-y border-r border-guor-peach/50 px-6 rounded-r-2xl text-right shadow-sm group-hover:bg-guor-cream/60 transition-all">
        <div className="flex justify-end items-center gap-2">
          <TooltipProvider>

            {/* Ver detalle */}
            <a
              href={`/admin/Panel-Administrativo/productos/${p.id}`}
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-guor-peach text-guor-gold/70 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200 transition-colors bg-white"
            >
              <Eye size={16} />
            </a>

            {canEdit ? (
              <Button
                variant="outline" size="icon"
                onClick={() => onEdit(p)}
                className="h-9 w-9 rounded-xl border-guor-peach text-guor-gold/70 hover:text-guor-brown hover:bg-guor-peach/50"
              >
                <Edit2 size={16} />
              </Button>
            ) : (
              <Button disabled variant="outline" size="icon" className="h-9 w-9 rounded-xl opacity-30">
                <Lock size={14} />
              </Button>
            )}

            {canArchive && (
              <Button
                variant="outline" size="icon"
                onClick={() => onArchive(p)}
                className="h-9 w-9 rounded-xl border-guor-peach text-guor-gold/70 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </TooltipProvider>
        </div>
      </td>
    </tr>
  );
});

ProductoRow.displayName = "ProductoRow";
export default ProductoRow;