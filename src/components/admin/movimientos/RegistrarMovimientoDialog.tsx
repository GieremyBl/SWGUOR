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
      { value: 'consumo_orden_produccion', label: 'Consumo en O/P', icon: FlaskConical, color: 'text-indigo-600' },
      { value: 'consumo_orden_produccion_item', label: 'Consumo O/P (ítem)', icon: FlaskConical, color: 'text-purple-600' },
      { value: 'produccion_entrada', label: 'Entrada de producción', icon: Activity, color: 'text-teal-600' },
    ]
  },
  {
    grupo: 'Devoluciones', items: [
      { value: 'devolucion_consumo', label: 'Dev. de consumo', icon: Undo2, color: 'text-cyan-600' },
      { value: 'devolucion_a_proveedor', label: 'Devolución a proveedor', icon: Undo2, color: 'text-amber-600' },
      { value: 'recepcion_devolucion_proveedor', label: 'Recepción dev. prov.', icon: ShoppingCart, color: 'text-sky-600' },
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
      {/* Contenedor principal con bordes amplios idénticos a image_b3bba4.png */}
      <DialogContent className="max-w-lg rounded-[22px] border-none shadow-2xl p-0 overflow-hidden bg-white">

        {/* HEADER MINIMALISTA: Fondo blanco, divisor sutil bajo y texto oscuro */}
        <div className="p-7 pb-5 border-b border-gray-100 bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#0B132B] text-xl font-bold tracking-tight">
              Registrar Movimiento
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-0.5 font-normal">
              Define los cambios y ajustes del flujo de stock manual
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-7 pt-5 space-y-4">

          {/* Selector de Tipo de Artículo con estética refinada */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-500">
              Tipo de Artículo *
            </Label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#F6F4EF] p-1.5 rounded-xl">
              {(Object.keys(TIPO_ITEM_CONFIG) as TipoItem[]).map((tipo) => {
                const { label, icon: Icon } = TIPO_ITEM_CONFIG[tipo];
                const isActive = tipoItem === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoItem(tipo)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all text-xs font-semibold ${isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección de artículo con el fondo suave de image_b3bba4.png */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-500">
              Artículo
            </Label>
            <Select value={itemId} onValueChange={setItemId} disabled={loadingItems}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200/70 bg-[#FBF9F4] text-slate-700 font-medium focus:bg-white transition-colors">
                {loadingItems ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Cargando catálogo...</span>
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
                      <span className="font-medium text-xs text-slate-700">{item.nombre}</span>
                      {item.stock !== undefined && (
                        <span className="text-[10px] text-slate-400 ml-auto pl-3">
                          Stock: {item.stock} {item.unidad ?? ''}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {!loadingItems && items.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">No hay registros disponibles</div>
                )}
              </SelectContent>
            </Select>

            {/* Stock de referencia limpio */}
            {itemSeleccionado?.stock !== undefined && (
              <p className="text-xs text-slate-400 pl-1">
                Cantidad disponible actual:{' '}
                <span className={`font-semibold ${(itemSeleccionado.stock ?? 0) <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {itemSeleccionado.stock} {itemSeleccionado.unidad ?? 'unidades'}
                </span>
              </p>
            )}
          </div>

          {/* Tipo de movimiento */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-500">
              Tipo de Movimiento
            </Label>
            <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200/70 bg-[#FBF9F4] text-slate-700 font-medium focus:bg-white">
                <SelectValue placeholder="Seleccionar tipo de operación..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {TIPOS_MOVIMIENTO.map((grupo) => (
                  <SelectGroup key={grupo.grupo}>
                    <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                      {grupo.grupo}
                    </SelectLabel>
                    {grupo.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SelectItem key={item.value} value={item.value} className="rounded-lg text-xs">
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
            {/* Origen / Referencia */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-slate-500">
                Referencia
              </Label>
              <Select value={referenciaTipo} onValueChange={setReferenciaTipo}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200/70 bg-[#FBF9F4] text-slate-700 font-medium focus:bg-white">
                  <SelectValue placeholder="Tipo de ref..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {REFERENCIAS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="rounded-lg text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cantidad a ingresar o retirar */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-slate-500">
                Cantidad
              </Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="h-11 rounded-xl border-slate-200/70 bg-[#FBF9F4] font-bold text-slate-800 text-right focus:bg-white focus-visible:ring-slate-300"
              />
            </div>
          </div>

          {/* Motivo idéntico al Textarea de image_b3bba4.png */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-slate-500">
              Motivo o Justificación *
            </Label>
            <Textarea
              placeholder="¿Qué causa u origen tiene este movimiento?"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="rounded-xl border-slate-200/70 bg-[#FBF9F4] text-slate-700 text-sm p-3 placeholder:text-slate-400 focus:bg-white focus-visible:ring-slate-300 resize-none"
            />
          </div>

          {/* BOTONES DE ACCIÓN: Estilo exacto de image_b3bba4.png */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 h-12 rounded-xl bg-[#F6F4EF] hover:bg-[#EFECE5] text-slate-700 font-semibold text-sm transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 rounded-xl bg-[#DC143C] hover:bg-[#C11032] text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
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