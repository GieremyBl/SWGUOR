'use client';

import { useEffect, useState } from 'react';
import { Package2, Layers } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchMaterialesCompras } from '@/lib/helpers/materiales-compras-helpers';
import { fetchInsumosCompras } from '@/lib/helpers/insumos-helpers';
import type { FichaDetalleRow } from '@/lib/schemas/fichas-tecnicas-detalle';
import type { FichaDetalleItemPayload } from '@/lib/helpers/fichas-tecnicas-detalle-helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: FichaDetalleItemPayload) => Promise<{ success?: boolean; error?: string }>;
  editing?: FichaDetalleRow | null;
  isSaving?: boolean;
}

type TipoItem = 'material' | 'insumo';

const fieldClass = 'h-11 bg-slate-50 border-slate-200';
const labelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide';

export default function FichaDetalleItemDialog({
  isOpen,
  onClose,
  onSave,
  editing,
  isSaving,
}: Props) {
  const isEdit = !!editing;
  const [materiales, setMateriales] = useState<{ id: string; nombre: string }[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nombre: string }[]>([]);
  const [form, setForm] = useState({
    tipo: 'material' as TipoItem,
    ref_id: '',
    cantidad_consumo: '',
    porcentaje_desperdicio: '0',
    observaciones: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetchMaterialesCompras(),
      fetchInsumosCompras(),
    ])
      .then(([mats, ins]) => {
        setMateriales(mats.map((m) => ({ id: String(m.id), nombre: m.nombre })));
        setInsumos(ins.map((i) => ({ id: String(i.id), nombre: i.nombre })));
      })
      .catch(() => toast.error('Error al cargar catálogos'));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      const esMaterial = !!editing.material_id || !!editing.materiales;
      setForm({
        tipo: esMaterial ? 'material' : 'insumo',
        ref_id: esMaterial
          ? String(editing.material_id ?? editing.materiales?.id ?? '')
          : String(editing.insumo_id ?? editing.insumo?.id ?? ''),
        cantidad_consumo: String(editing.cantidad_consumo),
        porcentaje_desperdicio: String(editing.porcentaje_desperdicio ?? 0),
        observaciones: editing.observaciones ?? '',
      });
    } else {
      setForm({
        tipo: 'material',
        ref_id: '',
        cantidad_consumo: '',
        porcentaje_desperdicio: '0',
        observaciones: '',
      });
    }
  }, [isOpen, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ref_id) {
      toast.error('Selecciona un ítem del catálogo');
      return;
    }

    const payload: FichaDetalleItemPayload = {
      material_id: form.tipo === 'material' ? form.ref_id : null,
      insumo_id: form.tipo === 'insumo' ? form.ref_id : null,
      cantidad_consumo: parseFloat(form.cantidad_consumo),
      porcentaje_desperdicio: parseFloat(form.porcentaje_desperdicio || '0'),
      observaciones: form.observaciones.trim() || null,
    };

    const res = await onSave(payload);
    if (res?.success !== false && !res?.error) {
      onClose();
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const opciones = form.tipo === 'material' ? materiales : insumos;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] border border-slate-200 shadow-xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            {form.tipo === 'material'
              ? <Layers className="w-5 h-5 text-blue-600" />
              : <Package2 className="w-5 h-5 text-purple-600" />}
            {isEdit ? 'Editar ítem' : 'Agregar material o insumo'}
          </DialogTitle>
          <DialogDescription>
            Vincula un material o insumo del catálogo con su consumo por prenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as TipoItem, ref_id: '' })}
                disabled={isSaving || isEdit}
              >
                <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="insumo">Insumo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Ítem</Label>
              <Select
                value={form.ref_id}
                onValueChange={(v) => setForm({ ...form, ref_id: v })}
                disabled={isSaving || isEdit}
              >
                <SelectTrigger className={fieldClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {opciones.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Cantidad consumo</Label>
              <Input
                className={fieldClass}
                type="number"
                step="0.0001"
                min="0.0001"
                value={form.cantidad_consumo}
                onChange={(e) => setForm({ ...form, cantidad_consumo: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>% Desperdicio</Label>
              <Input
                className={fieldClass}
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.porcentaje_desperdicio}
                onChange={(e) => setForm({ ...form, porcentaje_desperdicio: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Observaciones</Label>
            <Textarea
              className="bg-slate-50 border-slate-200 min-h-[80px]"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              disabled={isSaving}
              maxLength={500}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-pink-600 hover:bg-pink-700 text-white">
              {isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
