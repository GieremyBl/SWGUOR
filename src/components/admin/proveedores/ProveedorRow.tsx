'use client';

import { memo } from 'react';
import { Eye, Pencil, Trash2, Tag, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { Proveedor } from '@/lib/schemas/proveedor';

interface ProveedorRowProps {
  p:            Proveedor;
  onEdit:       (p: Proveedor) => void;
  onDelete:     (p: Proveedor) => void;
  onViewDetail: (p: Proveedor) => void;
}

const ProveedorRow = memo(({ p, onEdit, onDelete, onViewDetail }: ProveedorRowProps) => {
  const { can } = usePermissions();
  const canEdit   = can('edit',   'proveedores');
  const canDelete = can('archive', 'proveedores');

  const iniciales = (p.razon_social ?? p.ruc ?? '??').substring(0, 2).toUpperCase();

  return (
    <tr className="group transition-all duration-200">

      {/* ── Razón Social ── */}
      <td className="bg-white border-y border-l border-slate-100 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md group-hover:bg-slate-50 transition-all">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm border border-rose-100 uppercase group-hover:scale-110 transition-transform shrink-0">
            {iniciales}
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onViewDetail(p)}
              className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none hover:text-rose-600 transition-colors text-left"
            >
              {p.razon_social}
            </button>
            <div className="text-slate-500 text-[13px] font-medium mt-1">
              RUC: <span className="font-mono">{p.ruc}</span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">{p.email}</div>
          </div>
        </div>
      </td>

      {/* ── Contacto ── */}
      <td className="bg-white border-y border-slate-100 py-4 px-6 shadow-sm group-hover:bg-slate-50 transition-all hidden md:table-cell">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">{p.contacto}</span>
          <span className="text-xs text-slate-400 mt-0.5">{p.telefono}</span>
        </div>
      </td>

      {/* ── Categoría ── */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all hidden lg:table-cell">
        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
          <Tag size={10} /> {p.categoria_suministro}
        </div>
      </td>

      {/* ── Insumos / Órdenes ── */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all hidden lg:table-cell">
        <div className="flex justify-center gap-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Package size={11} className="text-slate-400" />
              <span className="text-sm font-black text-slate-900">{p._count?.insumos ?? 0}</span>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Insumos</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <ShoppingCart size={11} className="text-slate-400" />
              <span className="text-sm font-black text-slate-900">{p._count?.ordenes_compra ?? 0}</span>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Órdenes</span>
          </div>
        </div>
      </td>

      {/* ── Estado ── */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
        <Badge
          className={`rounded-full px-3 py-1 text-[9px] font-black border-2 uppercase ${
            p.estado === 'activo'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}
          variant="outline"
        >
          {p.estado}
        </Badge>
      </td>

      {/* ── Acciones ── */}
      <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:bg-slate-50 transition-all">
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="outline" size="icon"
            onClick={() => onViewDetail(p)}
            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            title="Ver detalle"
          >
            <Eye size={16} />
          </Button>

          {canEdit && (
            <Button
              variant="outline" size="icon"
              onClick={() => onEdit(p)}
              className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
              title="Editar"
            >
              <Pencil size={16} />
            </Button>
          )}

          {canDelete && p.estado === 'activo' && (
            <Button
              variant="outline" size="icon"
              onClick={() => onDelete(p)}
              className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              title="Desactivar"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
});

ProveedorRow.displayName = 'ProveedorRow';
export default ProveedorRow;