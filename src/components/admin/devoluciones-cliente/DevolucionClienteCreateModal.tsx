'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  CONDICION_PRODUCTO_LABELS,
  MOTIVO_DEVOLUCION_LABELS,
} from '@/lib/constants/devoluciones-cliente';
import type { CrearDevolucionClienteInput } from '@/lib/schemas/devoluciones-cliente';
import type { MotivoDevolucion } from '@prisma/client';
import { Loader2, Search } from 'lucide-react';

interface PedidoItemOption {
  id: number | string;
  cantidad: number;
  producto_id: number | string;
  variante_id: number | string;
  productos?: { nombre?: string | null; sku?: string | null };
  variantes_producto?: { color?: string | null; talla?: string | null };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CrearDevolucionClienteInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function DevolucionClienteCreateModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const [pedidoId, setPedidoId] = useState('');
  const [items, setItems] = useState<PedidoItemOption[]>([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [pedidoItemId, setPedidoItemId] = useState('');
  const [motivo, setMotivo] = useState<MotivoDevolucion>('defecto_fabrica');
  const [cantidad, setCantidad] = useState('1');
  const [notasCliente, setNotasCliente] = useState('');
  const [condicion, setCondicion] = useState<string>('');

  const itemSeleccionado = items.find((i) => String(i.id) === pedidoItemId);
  const maxCantidad = itemSeleccionado?.cantidad ?? 1;

  useEffect(() => {
    if (!open) {
      setPedidoId('');
      setItems([]);
      setClienteNombre('');
      setPedidoItemId('');
      setMotivo('defecto_fabrica');
      setCantidad('1');
      setNotasCliente('');
      setCondicion('');
    }
  }, [open]);

  const buscarPedido = async () => {
    if (!pedidoId.trim()) {
      toast.error('Ingresa un ID de pedido');
      return;
    }
    setLoadingPedido(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId.trim()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Pedido no encontrado');

      const pedido = json.data;
      setItems(pedido.pedido_items ?? []);
      setClienteNombre(
        pedido.clientes?.razon_social ??
          pedido.clientes?.nombre_comercial ??
          'Cliente del pedido',
      );
      if ((pedido.pedido_items ?? []).length === 0) {
        toast.warning('El pedido no tiene ítems');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al buscar pedido');
      setItems([]);
      setClienteNombre('');
    } finally {
      setLoadingPedido(false);
    }
  };

  const handleSubmit = async () => {
    if (!pedidoId || !pedidoItemId) {
      toast.error('Selecciona un pedido y un ítem');
      return;
    }
    const qty = Number(cantidad);
    if (!Number.isFinite(qty) || qty <= 0 || qty > maxCantidad) {
      toast.error(`Cantidad inválida (máx. ${maxCantidad})`);
      return;
    }

    await onSubmit({
      pedido_id: Number(pedidoId),
      pedido_item_id: Number(pedidoItemId),
      motivo,
      cantidad: qty,
      notas_cliente: notasCliente.trim() || undefined,
      ...(condicion ? { condicion_recibido: condicion as CrearDevolucionClienteInput['condicion_recibido'] } : {}),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva devolución de cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Pedido vinculado *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="ID del pedido"
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={() => void buscarPedido()} disabled={loadingPedido}>
                {loadingPedido ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {clienteNombre && (
              <p className="text-xs text-slate-500">Cliente: {clienteNombre}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ítem del pedido *</Label>
            <Select value={pedidoItemId} onValueChange={setPedidoItemId} disabled={items.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ítem" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.productos?.nombre ?? 'Producto'} · {item.variantes_producto?.talla}/
                    {item.variantes_producto?.color} (máx. {item.cantidad})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoDevolucion)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOTIVO_DEVOLUCION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min={1}
                max={maxCantidad}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Condición del producto</Label>
            <Select value={condicion || 'none'} onValueChange={(v) => setCondicion(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin especificar</SelectItem>
                {Object.entries(CONDICION_PRODUCTO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas del cliente</Label>
            <Textarea
              value={notasCliente}
              onChange={(e) => setNotasCliente(e.target.value)}
              placeholder="Descripción del motivo de devolución..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar devolución'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
