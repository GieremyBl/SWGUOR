'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrdenProduccionItemRow } from '@/lib/schemas/ordenes-produccion-items';
import type { OrdenProduccionItemPayload } from '@/lib/schemas/ordenes-produccion-items';
import {
  fetchPedidoItemsParaOrden,
  type PedidoItemOption,
} from '@/lib/helpers/ordenes-produccion-items-helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: OrdenProduccionItemPayload) => Promise<{ success?: boolean; error?: string }>;
  editing?: OrdenProduccionItemRow | null;
  pedidoId?: string | number | null;
  isSaving?: boolean;
  existingPedidoItemIds?: string[];
}

const fieldClass = 'h-11 bg-slate-50 border-slate-200';
const labelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide';

export default function OrdenProduccionItemDialog({
  isOpen,
  onClose,
  onSave,
  editing,
  pedidoId,
  isSaving,
  existingPedidoItemIds = [],
}: Props) {
  const isEdit = !!editing;
  const [pedidoItems, setPedidoItems] = useState<PedidoItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [form, setForm] = useState({
    pedido_item_id: '',
    cantidad: '',
  });

  useEffect(() => {
    if (!isOpen || !pedidoId) return;
    setLoadingItems(true);
    fetchPedidoItemsParaOrden(String(pedidoId))
      .then(setPedidoItems)
      .catch(() => toast.error('Error al cargar ítems del pedido'))
      .finally(() => setLoadingItems(false));
  }, [isOpen, pedidoId]);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setForm({
        pedido_item_id: String(editing.pedido_item_id),
        cantidad: String(editing.cantidad),
      });
    } else {
      setForm({ pedido_item_id: '', cantidad: '' });
    }
  }, [isOpen, editing]);

  const selectedItem = pedidoItems.find((p) => p.id === form.pedido_item_id);
  const availableItems = isEdit
    ? pedidoItems
    : pedidoItems.filter((p) => !existingPedidoItemIds.includes(p.id));

  const handleSubmit = async () => {
    const cantidad = parseInt(form.cantidad, 10);
    if (!form.pedido_item_id) {
      toast.error('Seleccione un ítem del pedido');
      return;
    }
    if (!cantidad || cantidad < 1) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    const item = selectedItem ?? (editing ? {
      producto_id: String(editing.producto_id),
      variante_id: editing.variante_id ? String(editing.variante_id) : null,
    } : null);

    if (!item || !('producto_id' in item)) {
      toast.error('No se pudo resolver el producto del ítem');
      return;
    }

    const payload: OrdenProduccionItemPayload = {
      pedido_item_id: Number(form.pedido_item_id),
      producto_id: Number(item.producto_id),
      variante_id: item.variante_id ? Number(item.variante_id) : null,
      cantidad,
    };

    const res = await onSave(payload);
    if (res.success) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar ítem' : 'Agregar ítem de pedido'}</DialogTitle>
          <DialogDescription>
            Vincule un ítem del pedido asociado a esta orden de producción.
          </DialogDescription>
        </DialogHeader>

        {!pedidoId && !isEdit ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
            Esta orden no tiene un pedido vinculado. Asocie un pedido antes de agregar ítems.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className={labelClass}>Ítem del pedido</Label>
              <Select
                value={form.pedido_item_id}
                onValueChange={(v) => setForm((f) => ({ ...f, pedido_item_id: v }))}
                disabled={isEdit || loadingItems}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder={loadingItems ? 'Cargando...' : 'Seleccionar ítem'} />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.producto_nombre}
                      {p.variante_label ? ` — ${p.variante_label}` : ''}
                      {' '}({p.cantidad} uds pedido)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 space-y-1">
                <p><span className="font-semibold">Producto:</span> {selectedItem.producto_nombre}</p>
                {selectedItem.variante_label && (
                  <p><span className="font-semibold">Variante:</span> {selectedItem.variante_label}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className={labelClass}>Cantidad a producir</Label>
              <Input
                type="number"
                min={1}
                className={fieldClass}
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || (!pedidoId && !isEdit)}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
