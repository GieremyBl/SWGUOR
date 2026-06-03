'use client';

import { useEffect, useState } from 'react';
import { useMateriales } from '@/lib/hooks/useMateriales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Minus, Plus } from 'lucide-react';
import { type Material, type MaterialFormValues } from '@/lib/schemas/material';

interface Props {
  isOpen:    boolean;
  material:  Material | null | any;
  onClose:   () => void;
  onSuccess: () => void;
}

const UNIDADES = ['metros', 'kilos', 'yards', 'unidades'] as const;
const TIPOS    = ['plano', 'punto', 'tejido', 'especial'] as const;

type StockOp = 'sumar' | 'restar' | 'absoluto';

export default function EditMaterialDialog({ isOpen, material, onClose, onSuccess }: Props) {
  const { update, isUpdating, ajustarStock, isAjustandoStock } = useMateriales();

  const [form, setForm] = useState<{
    nombre: string;
    tipo: 'plano' | 'punto' | 'tejido' | 'especial';
    descripcion: string;
    composicion: string;
    gramaje: string;
    ancho_total: string;
    ancho_util: string;
    color: string;
    codigo_color: string;
    unidad_medida: 'metros' | 'unidades' | 'kilos' | 'yards';
    stock_minimo: string;
    precio_unitario: string;
    ubicacion_almacen: string;
    alerta_bajo_stock: boolean;
  }>({
    nombre:            '',
    tipo:              'plano',
    descripcion:       '',
    composicion:       '',
    gramaje:           '',
    ancho_total:       '',
    ancho_util:        '',
    color:             '',
    codigo_color:      '',
    unidad_medida:     'metros',
    stock_minimo:      '10',
    precio_unitario:   '',
    ubicacion_almacen: '',
    alerta_bajo_stock: true,
  });

  const [stockOp,       setStockOp]       = useState<StockOp>('sumar');
  const [stockCantidad, setStockCantidad] = useState('');
  const [stockMotivo,   setStockMotivo]   = useState('');

  useEffect(() => {
    if (!material) return;
    setForm({
      nombre:            material.nombre            ?? '',
      tipo:              (material.tipo as any)     ?? 'plano',
      descripcion:       material.descripcion       ?? '',
      composicion:       material.composicion       ?? '',
      gramaje:           material.gramaje            != null ? String(material.gramaje)       : '',
      ancho_total:       material.ancho_total        != null ? String(material.ancho_total)   : '',
      ancho_util:        material.ancho_util         != null ? String(material.ancho_util)    : '',
      color:             material.color             ?? '',
      codigo_color:      material.codigo_color      ?? '',
      unidad_medida:     (material.unidad_medida as any) ?? 'metros',
      stock_minimo:      String(material.stock_minimo ?? 10),
      precio_unitario:   material.precio_unitario    != null ? String(material.precio_unitario) : '',
      ubicacion_almacen: material.ubicacion_almacen ?? '',
      alerta_bajo_stock: material.alerta_bajo_stock ?? true,
    });
    setStockOp('sumar');
    setStockCantidad('');
    setStockMotivo('');
  }, [material]);

  function set(field: keyof typeof form, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!material?.id) return;

    const datosValidados: MaterialFormValues = {
      nombre:            form.nombre,
      tipo:              form.tipo,
      unidad_medida:     form.unidad_medida,
      stock_minimo:      Number(form.stock_minimo),
      alerta_bajo_stock: form.alerta_bajo_stock,
      descripcion:       form.descripcion || undefined,
      composicion:       form.composicion || undefined,
      gramaje:           form.gramaje           ? Number(form.gramaje)           : undefined,
      ancho_total:       form.ancho_total       ? Number(form.ancho_total)       : undefined,
      ancho_util:        form.ancho_util        ? Number(form.ancho_util)        : undefined,
      color:             form.color             || undefined,
      codigo_color:      form.codigo_color      || undefined,
      precio_unitario:   form.precio_unitario   ? Number(form.precio_unitario)   : undefined,
      ubicacion_almacen: form.ubicacion_almacen || undefined,
    };

    update(String(material.id), datosValidados);
    onSuccess();
    onClose();
  }

  function handleAjustarStock() {
    const cantidad = Number(stockCantidad);
    if (!cantidad || cantidad <= 0 || !material?.id) return;

    ajustarStock(String(material.id), {
      operacion: stockOp,
      cantidad,
      motivo:    stockMotivo || undefined,
    });

    setStockCantidad('');
    setStockMotivo('');
    onSuccess();
  }

  const isBusy = isUpdating || isAjustandoStock;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gray-900">Editar Material</DialogTitle>
          <p className="text-sm text-gray-500">{material?.nombre}</p>
        </DialogHeader>

        {/* ── Ajuste rápido de stock ── */}
        <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-gray-500">Ajuste de Stock</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Stock actual:</span>
            <span className="text-lg font-black text-gray-900">
              {material?.stock_actual} <span className="text-sm font-medium text-gray-400">{material?.unidad_medida ?? 'm'}</span>
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Operación */}
            <div className="flex rounded-lg border bg-white overflow-hidden">
              {/* ✅ Sintaxis de mapeo JSX completamente reparada aquí */}
              {(['sumar', 'restar', 'absoluto'] as StockOp[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setStockOp(op)}
                  className={`px-3 py-2 text-xs font-bold capitalize transition-colors ${
                    stockOp === op ? 'bg-pink-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {op === 'sumar' ? <Plus className="w-3.5 h-3.5" /> : op === 'restar' ? <Minus className="w-3.5 h-3.5" /> : 'Abs'}
                </button>
              ))}
            </div>
            <Input
              type="number" min={0} placeholder="Cantidad"
              className="flex-1 h-9"
              value={stockCantidad}
              onChange={e => setStockCantidad(e.target.value)}
            />
            <Input
              placeholder="Motivo (opcional)"
              className="flex-1 h-9"
              value={stockMotivo}
              onChange={e => setStockMotivo(e.target.value)}
            />
            <Button
              size="sm"
              type="button"
              onClick={handleAjustarStock}
              disabled={!stockCantidad || Number(stockCantidad) <= 0 || isAjustandoStock}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold h-9 px-4 whitespace-nowrap"
            >
              {isAjustandoStock ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
            </Button>
          </div>
        </div>

        {/* ── Datos del material ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">

          <div className="md:col-span-2 space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Nombre *</Label>
            <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Tipo</Label>
            <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Unidad de medida</Label>
            <Select value={form.unidad_medida} onValueChange={v => set('unidad_medida', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIDADES.map(u => <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Composición</Label>
            <Input value={form.composicion} onChange={e => set('composicion', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Gramaje (g/m²)</Label>
            <Input type="number" value={form.gramaje} onChange={e => set('gramaje', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Ancho total (m)</Label>
            <Input type="number" value={form.ancho_total} onChange={e => set('ancho_total', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Ancho útil (m)</Label>
            <Input type="number" value={form.ancho_util} onChange={e => set('ancho_util', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Color</Label>
            <Input value={form.color} onChange={e => set('color', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Código de color (hex)</Label>
            <div className="flex gap-2 items-center">
              <Input value={form.codigo_color} onChange={e => set('codigo_color', e.target.value)} />
              {form.codigo_color && (
                <div className="w-9 h-9 rounded-lg border shadow-sm flex-shrink-0" style={{ backgroundColor: form.codigo_color }} />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Stock mínimo</Label>
            <Input type="number" min={0} value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Precio unitario (S/)</Label>
            <Input type="number" min={0} step="0.01" value={form.precio_unitario} onChange={e => set('precio_unitario', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Ubicación en almacén</Label>
            <Input value={form.ubicacion_almacen} onChange={e => set('ubicacion_almacen', e.target.value)} />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Descripción</Label>
            <Input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>

        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>Cancelar</Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!form.nombre.trim() || isBusy}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-6"
          >
            {isUpdating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}