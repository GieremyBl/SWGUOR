'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { type MaterialFormValues } from '@/lib/schemas/material';

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

const UNIDADES = ['metros', 'kilos', 'yards', 'unidades'] as const;
const TIPOS    = ['plano', 'punto', 'tejido', 'especial'] as const;

export default function CreateMaterialDialog({ isOpen, onClose, onSuccess }: Props) {
  const { create, isCreating } = useMateriales();

  // ✅ Añadimos tipado estricto al estado para que coincida con los literales válidos
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
    stock_actual: string; // Se mantiene en el formulario para la UI
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
    stock_actual:      '0',
    stock_minimo:      '10',
    precio_unitario:   '',
    ubicacion_almacen: '',
    alerta_bajo_stock: true,
  });

  function set(field: keyof typeof form, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.nombre.trim()) return;

    // ✅ Construimos el objeto MaterialFormValues con las propiedades conocidas únicamente
    const datosValidados: MaterialFormValues = {
      nombre:            form.nombre,
      tipo:              form.tipo,
      unidad_medida:     form.unidad_medida,
      stock_minimo:      Number(form.stock_minimo),
      alerta_bajo_stock: form.alerta_bajo_stock,
      descripcion:       form.descripcion || undefined,
      composicion:       form.composicion || undefined,
      gramaje:           form.gramaje         ? Number(form.gramaje)         : undefined,
      ancho_total:       form.ancho_total     ? Number(form.ancho_total)     : undefined,
      ancho_util:        form.ancho_util      ? Number(form.ancho_util)      : undefined,
      color:             form.color           || undefined,
      codigo_color:      form.codigo_color    || undefined,
      precio_unitario:   form.precio_unitario ? Number(form.precio_unitario) : undefined,
      ubicacion_almacen: form.ubicacion_almacen || undefined,
      // Nota: Si tu backend necesita el stock inicial al crear, agrega un campo opcional "stock_inicial" en el esquema
    };

    create(datosValidados);

    onSuccess();
    handleClose();
  }

  function handleClose() {
    setForm({
      nombre: '', tipo: 'plano', descripcion: '', composicion: '',
      gramaje: '', ancho_total: '', ancho_util: '', color: '',
      codigo_color: '', unidad_medida: 'metros', stock_actual: '0',
      stock_minimo: '10', precio_unitario: '', ubicacion_almacen: '',
      alerta_bajo_stock: true,
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gray-900">Registrar Material</DialogTitle>
          <p className="text-sm text-gray-500">Completa los datos del nuevo material o tela.</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">

          {/* Nombre */}
          <div className="md:col-span-2 space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Nombre *</Label>
            <Input
              placeholder="Ej: Tela algodón pima 120g"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Tipo</Label>
            <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Unidad */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Unidad de medida</Label>
            <Select value={form.unidad_medida} onValueChange={v => set('unidad_medida', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIDADES.map(u => <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Composición */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Composición</Label>
            <Input placeholder="Ej: 100% algodón" value={form.composicion} onChange={e => set('composicion', e.target.value)} />
          </div>

          {/* Gramaje */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Gramaje (g/m²)</Label>
            <Input type="number" placeholder="Ej: 180" value={form.gramaje} onChange={e => set('gramaje', e.target.value)} />
          </div>

          {/* Ancho total */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Ancho total (m)</Label>
            <Input type="number" placeholder="Ej: 1.50" value={form.ancho_total} onChange={e => set('ancho_total', e.target.value)} />
          </div>

          {/* Ancho útil */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Ancho útil (m)</Label>
            <Input type="number" placeholder="Ej: 1.45" value={form.ancho_util} onChange={e => set('ancho_util', e.target.value)} />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Color</Label>
            <Input placeholder="Ej: Blanco hueso" value={form.color} onChange={e => set('color', e.target.value)} />
          </div>

          {/* Código color */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Código de color (hex)</Label>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="#FFFFFF"
                value={form.codigo_color}
                onChange={e => set('codigo_color', e.target.value)}
              />
              {form.codigo_color && (
                <div className="w-9 h-9 rounded-lg border shadow-sm flex-shrink-0" style={{ backgroundColor: form.codigo_color }} />
              )}
            </div>
          </div>

          {/* Stock actual */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Stock inicial</Label>
            <Input type="number" min={0} value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)} />
          </div>

          {/* Stock mínimo */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Stock mínimo</Label>
            <Input type="number" min={0} value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} />
          </div>

          {/* Precio */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Precio unitario (S/)</Label>
            <Input type="number" min={0} step="0.01" placeholder="0.00" value={form.precio_unitario} onChange={e => set('precio_unitario', e.target.value)} />
          </div>

          {/* Ubicación */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Ubicación en almacén</Label>
            <Input placeholder="Ej: Estante A-3" value={form.ubicacion_almacen} onChange={e => set('ubicacion_almacen', e.target.value)} />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2 space-y-1.5">
            <Label className="font-bold text-xs uppercase tracking-wider text-gray-600">Descripción</Label>
            <Input placeholder="Notas adicionales..." value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>

        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!form.nombre.trim() || isCreating}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-6"
          >
            {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Registrar Material'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}