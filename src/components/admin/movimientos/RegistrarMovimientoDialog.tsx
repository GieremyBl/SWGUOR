'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PackageOpen,
  Boxes,
  Factory,
  Loader2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  FlaskConical,
  Undo2,
  Wrench,
  Activity,
  ShoppingCart,
} from 'lucide-react';
import { registrarMovimientoInventario } from '@/app/admin/inventario/movimientos/actions';
// ─── Tipos de movimiento agrupados ────────────────────────────────────────────
const TIPOS_MOVIMIENTO = [
  {
    grupo: 'Básicos', items: [
      { value: 'entrada', label: 'Entrada al stock', icon: ArrowUp, color: 'text-emerald-600' },
      { value: 'salida', label: 'Salida de stock', icon: ArrowDown, color: 'text-orange-600' },
      { value: 'ajuste', label: 'Ajuste de inventario', icon: RotateCcw, color: 'text-blue-600' },
    ]
  },
  {
    grupo: 'Producción', items: [
      { value: 'consumo_orden_produccion', label: 'Consumo en O/P', icon: FlaskConical, color: 'text-violet-600' },
      { value: 'consumo_orden_produccion_item', label: 'Consumo O/P (ítem)', icon: FlaskConical, color: 'text-purple-600' },
      { value: 'produccion_entrada', label: 'Entrada de producción', icon: Activity, color: 'text-teal-600' },
    ]
  },
  {
    grupo: 'Devoluciones', items: [
      { value: 'devolucion_consumo', label: 'Dev. de consumo', icon: Undo2, color: 'text-cyan-600' },
      { value: 'devolucion_a_proveedor', label: 'Devolución a proveedor', icon: Undo2, color: 'text-amber-600' },
      { value: 'recepcion_devolucion_proveedor', label: 'Recepción dev. prov.', icon: ShoppingCart, color: 'text-lime-600' },
      { value: 'devolucion_a_cliente', label: 'Devolución a cliente', icon: Undo2, color: 'text-rose-600' },
      { value: 'recepcion_devolucion_cliente', label: 'Recepción dev. cliente', icon: ArrowDown, color: 'text-pink-600' },
    ]
  },
  {
    grupo: 'Incidencias', items: [
      { value: 'incidencia_taller', label: 'Incidencia en taller', icon: Wrench, color: 'text-red-600' },
    ]
  },
];
const REFERENCIAS = [
  { value: 'ORDEN_COMPRA', label: 'Orden de Compra' },
  { value: 'ORDEN_PRODUCCION', label: 'Orden de Producción' },
  { value: 'PEDIDO_CLIENTE', label: 'Pedido de Cliente' },
  { value: 'DEVOLUCION', label: 'Devolución' },
  { value: 'AJUSTE_MANUAL', label: 'Ajuste Manual' },
  { value: 'MERMA_INCIDENCIA', label: 'Merma / Incidencia' },
  { value: 'INVENTARIO_INICIAL', label: 'Inventario Inicial' },
];
type TipoItem = 'producto' | 'insumo' | 'material';
interface ItemOpcion {
  id: string;
  nombre: string;
  stock?: number;
  unidad?: string;
}
interface RegistrarMovimientoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
const TIPO_ITEM_CONFIG = {
  producto: { label: 'Producto', icon: PackageOpen },
  insumo: { label: 'Insumo', icon: Boxes },
  material: { label: 'Material', icon: Factory },
};
export function RegistrarMovimientoDialog({ open, onClose, onSuccess }: RegistrarMovimientoDialogProps) {
  const [tipoItem, setTipoItem] = useState<TipoItem>('insumo');
  const [items, setItems] = useState<ItemOpcion[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemId, setItemId] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('');
  const [referenciaTipo, setReferenciaTipo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // ─── Cargar lista de artículos según tipo ─────────────────────────────────
  const cargarItems = useCallback(async (tipo: TipoItem) => {
    setLoadingItems(true);
    setItems([]);
    setItemId('');
    try {
      const endpoints: Record<TipoItem, string> = {
        producto: '/api/admin/productos?limit=200',
        insumo: '/api/admin/insumos?limite=200',
        material: '/api/admin/materiales?limite=200',
      };
      const res = await fetch(endpoints[tipo]);
      if (!res.ok) throw new Error('Error al cargar artículos');
      const json = await res.json();
      // Normalizar respuesta según formato de cada API:
      // - insumos:   { success, data: { insumos: [...] } }
      // - materiales: { success, data: [...] } o { success, data: { materiales: [...] } }
      // - productos:  { success, data: [...] }
      const rawData = json?.data;
      const data: any[] =
        Array.isArray(rawData) ? rawData :
          Array.isArray(rawData?.insumos) ? rawData.insumos :
            Array.isArray(rawData?.materiales) ? rawData.materiales :
              Array.isArray(json) ? json :
                [];
      setItems(
        data.map((item: any) => ({
          id: String(item.id),
          nombre: item.nombre,
          stock: item.stock_actual ?? item.stock ?? undefined,
          unidad: item.unidad_medida ?? item.unidad ?? undefined,
        }))
      );
    } catch {
      toast.error('No se pudieron cargar los artículos');
    } finally {
      setLoadingItems(false);
    }
  }, []);
  useEffect(() => {
    if (open) cargarItems(tipoItem);
  }, [open, tipoItem, cargarItems]);
  const resetForm = () => {
    setTipoItem('insumo');
    setItemId('');
    setTipoMovimiento('');
    setReferenciaTipo('');
    setCantidad('');
    setMotivo('');
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return toast.error('Selecciona un artículo');
    if (!tipoMovimiento) return toast.error('Selecciona el tipo de movimiento');
    if (!referenciaTipo) return toast.error('Selecciona el tipo de referencia');
    if (!cantidad || Number(cantidad) <= 0) return toast.error('La cantidad debe ser mayor a 0');
    if (!motivo.trim()) return toast.error('Ingresa el motivo del movimiento');
    setSubmitting(true);
    try {
      const params = {
        tipo_movimiento: tipoMovimiento as any,
        referencia_tipo: referenciaTipo as any,
        cantidad: Number(cantidad),
        motivo: motivo.trim(),
        ...(tipoItem === 'producto' && { producto_id: itemId }),
        ...(tipoItem === 'insumo' && { insumo_id: itemId }),
        ...(tipoItem === 'material' && { material_id: itemId }),
      };
      const result = await registrarMovimientoInventario(params);
      if (result.success) {
        toast.success('Movimiento registrado correctamente');
        handleClose();
        onSuccess?.();
      } else {
        toast.error(result.error || 'Error al registrar el movimiento');
      }
    } catch {
      toast.error('Error inesperado al registrar el movimiento');
    } finally {
      setSubmitting(false);
    }
  };
  const itemSeleccionado = items.find(i => i.id === itemId);
  const TipoItemIcon = TIPO_ITEM_CONFIG[tipoItem].icon;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg rounded-2xl border-slate-100 shadow-2xl p-0 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-black tracking-tight">
              Registrar Movimiento
            </DialogTitle>
            <DialogDescription className="text-pink-100 text-sm mt-1">
              Registra una entrada, salida o ajuste de stock manualmente
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo de artículo */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Tipo de Artículo
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TIPO_ITEM_CONFIG) as TipoItem[]).map((tipo) => {
                const { label, icon: Icon } = TIPO_ITEM_CONFIG[tipo];
                const isActive = tipoItem === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoItem(tipo)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-xs font-bold ${isActive
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-pink-200 hover:bg-pink-50/50'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-pink-500' : 'text-slate-400'}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Selección de artículo */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Artículo
            </Label>
            <Select value={itemId} onValueChange={setItemId} disabled={loadingItems}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50">
                {loadingItems ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Cargando artículos...</span>
                  </div>
                ) : (
                  <SelectValue placeholder={`Seleccionar ${TIPO_ITEM_CONFIG[tipoItem].label.toLowerCase()}...`} />
                )}
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <TipoItemIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{item.nombre}</span>
                      {item.stock !== undefined && (
                        <span className="text-[10px] text-slate-400 ml-auto pl-3">
                          Stock: {item.stock} {item.unidad ?? ''}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {!loadingItems && items.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">No hay artículos disponibles</div>
                )}
              </SelectContent>
            </Select>
            {/* Stock actual del artículo seleccionado */}
            {itemSeleccionado?.stock !== undefined && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="text-slate-400">Stock actual:</span>
                <span className={`font-bold ${(itemSeleccionado.stock ?? 0) <= 0 ? 'text-red-500' : 'text-emerald-600'
                  }`}>
                  {itemSeleccionado.stock} {itemSeleccionado.unidad ?? 'unidades'}
                </span>
              </p>
            )}
          </div>
          {/* Tipo de movimiento */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Tipo de Movimiento
            </Label>
            <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {TIPOS_MOVIMIENTO.map((grupo) => (
                  <SelectGroup key={grupo.grupo}>
                    <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {grupo.grupo}
                    </SelectLabel>
                    {grupo.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SelectItem key={item.value} value={item.value} className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Referencia */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Referencia
              </Label>
              <Select value={referenciaTipo} onValueChange={setReferenciaTipo}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Tipo de ref..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {REFERENCIAS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="rounded-lg">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Cantidad */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Cantidad
              </Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold text-right"
              />
            </div>
          </div>
          {/* Motivo */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Motivo <span className="text-pink-500">*</span>
            </Label>
            <Textarea
              placeholder="Describe el motivo del movimiento de inventario..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="rounded-xl border-slate-200 bg-slate-50 resize-none text-sm"
            />
          </div>
          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg active:scale-95 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                'Registrar Movimiento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}