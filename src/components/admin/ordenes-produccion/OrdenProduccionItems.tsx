'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useOrdenProduccionItems } from '@/lib/hooks/useOrdenProduccionItems';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Pencil, Trash2, ShoppingBag } from 'lucide-react';
import type { OrdenProduccionItemRow } from '@/lib/schemas/ordenes-produccion-items';
import type { OrdenProduccionItemPayload } from '@/lib/schemas/ordenes-produccion-items';

const OrdenProduccionItemDialog = dynamic(
  () => import('@/components/admin/ordenes-produccion/OrdenProduccionItemDialog'),
);

interface Props {
  ordenId: string;
  pedidoId?: string | number | null;
  canEdit?: boolean;
}

function varianteLabel(row: OrdenProduccionItemRow): string {
  const v = row.variantes_producto;
  if (!v) return '—';
  return [v.talla, v.color].filter(Boolean).join(' / ') || '—';
}

export default function OrdenProduccionItems({
  ordenId,
  pedidoId,
  canEdit = true,
}: Props) {
  const {
    items,
    isLoading,
    add,
    update,
    remove,
    isAdding,
    isUpdating,
    isDeleting,
  } = useOrdenProduccionItems(ordenId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenProduccionItemRow | null>(null);

  const totalUnidades = items.reduce((sum, it) => sum + Number(it.cantidad), 0);
  const isSaving = isAdding || isUpdating;
  const existingPedidoItemIds = items.map((it) => String(it.pedido_item_id));

  const handleSave = async (payload: OrdenProduccionItemPayload) => {
    if (editing) {
      const res = await update(String(editing.id), { cantidad: payload.cantidad });
      return { success: res?.success === true, error: res?.error ?? undefined };
    }
    const res = await add(payload);
    return { success: res?.success === true, error: res?.error ?? undefined };
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: OrdenProduccionItemRow) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ítem de la orden?')) return;
    await remove(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
          <ShoppingBag className="w-4 h-4 text-slate-400" />
          <span>
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'} · {totalUnidades} uds totales
          </span>
        </div>
        {canEdit && pedidoId && (
          <Button
            onClick={openCreate}
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            Agregar ítem
          </Button>
        )}
      </div>

      {!pedidoId && items.length === 0 && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
          Sin pedido vinculado. Los ítems se generan automáticamente al crear la orden desde un pedido pagado.
        </p>
      )}

      {items.length === 0 && pedidoId && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
          No hay ítems registrados. Agregue líneas del pedido #{pedidoId}.
        </p>
      )}

      <div className="space-y-2">
        {items.map((row) => (
          <div
            key={String(row.id)}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-colors"
          >
            <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-rose-500 shrink-0">
              <Package className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Producto</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {row.productos?.nombre ?? `Producto #${row.producto_id}`}
                </p>
                {row.productos?.sku && (
                  <p className="text-[10px] font-mono text-slate-400">{row.productos.sku}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Variante</p>
                <p className="text-sm text-slate-700">{varianteLabel(row)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cantidad</p>
                <Badge variant="secondary" className="font-mono font-bold">
                  {row.cantidad} uds
                </Badge>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Pedido ítem #{row.pedido_item_id}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-rose-600"
                  onClick={() => openEdit(row)}
                  disabled={isSaving || isDeleting}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => handleDelete(String(row.id))}
                  disabled={isSaving || isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <OrdenProduccionItemDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        editing={editing}
        pedidoId={pedidoId}
        isSaving={isSaving}
        existingPedidoItemIds={existingPedidoItemIds}
      />
    </div>
  );
}
