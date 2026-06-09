'use client';

import { useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TIPOS_INSUMO, LISTA_TIPOS_INSUMO } from '@/lib/constants/insumos';
import { UNIDADES_MEDIDA } from '@/lib/constants/estados';
import { fetchProveedores } from '@/lib/helpers/proveedores-helpers';
import type { InsumoCompraRow } from '@/lib/helpers/insumos-helpers';
import type { TipoInsumo, UnidadMedida } from '@prisma/client';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CategoriaOption {
  id: number;
  nombre: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<{ success?: boolean; error?: string }>;
  insumo?: InsumoCompraRow | null;
  isSaving?: boolean;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const fieldInputClass = 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 focus:bg-white';
const fieldLabelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide';
const fieldSelectClass = 'w-full h-11 bg-slate-50 border-slate-200 text-slate-900 [&_svg]:text-slate-500';
const UNIDADES = Object.keys(UNIDADES_MEDIDA) as UnidadMedida[];

const FORM_DEFAULT = {
  nombre: '',
  tipo: 'materia_prima' as TipoInsumo,
  categoria_id: 0,
  unidad_medida: 'metros' as UnidadMedida,
  stock_actual: '0',
  stock_minimo: '10',
  precio_unitario: '',
  proveedor_id: '',
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function InsumoFormDialog({ isOpen, onClose, onSave, insumo, isSaving }: Props) {
  const isEdit = !!insumo;

  const [proveedores, setProveedores] = useState<{ id: string; razon_social: string }[]>([]);
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [form, setForm] = useState(FORM_DEFAULT);

  // Cargar proveedores
  useEffect(() => {
    if (!isOpen) return;
    fetchProveedores(1, 200, '', 'activo')
      .then((res) => setProveedores(Array.isArray(res.data) ? res.data as { id: string; razon_social: string }[] : []))
      .catch(() => toast.error('Error al cargar proveedores'));
  }, [isOpen]);

  // Cargar categorías desde la DB (tabla categoria_insumo)
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/admin/inventario?resource=categorias')
      .then(r => r.json())
      .then(res => setCategorias(res.data?.categorias ?? []))
      .catch(() => toast.error('Error al cargar categorías'));
  }, [isOpen]);

  // Poblar form al abrir
  useEffect(() => {
    if (!isOpen) return;
    if (insumo) {
      setForm({
        nombre: insumo.nombre,
        tipo: insumo.tipo as TipoInsumo,
        categoria_id: typeof insumo.categoria_insumo === 'object' && insumo.categoria_insumo !== null
          ? (insumo.categoria_insumo as { id: number }).id
          : 0,
        unidad_medida: insumo.unidad_medida as UnidadMedida,
        stock_actual: String(insumo.stock_actual),
        stock_minimo: String(insumo.stock_minimo),
        precio_unitario: insumo.precio_unitario != null ? String(insumo.precio_unitario) : '',
        proveedor_id: insumo.proveedor_id ? String(insumo.proveedor_id) : '',

      });
    } else {
      setForm(FORM_DEFAULT);
    }
  }, [isOpen, insumo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.categoria_id) {
      toast.error('Seleccione una categoría');
      return;
    }

    const payload: Record<string, unknown> = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      categoria_id: form.categoria_id,
      unidad_medida: form.unidad_medida,
      stock_minimo: parseFloat(form.stock_minimo || '0'),
      precio_unitario: form.precio_unitario ? parseFloat(form.precio_unitario) : null,
      proveedor_id: form.proveedor_id || null,
    };

    if (!isEdit) {
      payload.stock_actual = parseFloat(form.stock_actual || '0');
    }

    const res = await onSave(payload);
    if (res?.success !== false && !res?.error) {
      onClose();
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] border border-slate-200 shadow-2xl bg-white text-slate-900 p-0 overflow-hidden max-h-[90vh] [&_[data-slot=dialog-close]]:text-slate-500 [&_[data-slot=dialog-close]]:hover:text-slate-800">
        <div className="h-2 bg-amber-500 w-full" />
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8px)] bg-white">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <PackagePlus className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {isEdit ? 'Editar insumo' : 'Nuevo insumo'}
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Catálogo de materiales vinculados a órdenes de compra.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div className="space-y-2">
              <Label className={fieldLabelClass}>Nombre</Label>
              <Input
                className={fieldInputClass}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            {/* Tipo + Categoría */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v as TipoInsumo })}
                  disabled={isSaving}
                >
                  <SelectTrigger className={fieldSelectClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border-slate-200">
                    {LISTA_TIPOS_INSUMO.map((k) => (
                      <SelectItem key={k} value={k} className="text-slate-900 focus:bg-amber-50 focus:text-slate-900">
                        {TIPOS_INSUMO[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={fieldLabelClass}>Categoría</Label>
                <Select
                  value={form.categoria_id ? String(form.categoria_id) : ''}
                  onValueChange={(v) => setForm({ ...form, categoria_id: Number(v) })}
                  disabled={isSaving}
                >
                  <SelectTrigger className={fieldSelectClass}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border-slate-200">
                    {categorias.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={String(c.id)}
                        className="text-slate-900 focus:bg-amber-50 focus:text-slate-900"
                      >
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Unidad + Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>Unidad de medida</Label>
                <Select
                  value={form.unidad_medida}
                  onValueChange={(v) => setForm({ ...form, unidad_medida: v as UnidadMedida })}
                  disabled={isSaving}
                >
                  <SelectTrigger className={fieldSelectClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border-slate-200">
                    {UNIDADES.map((k) => (
                      <SelectItem key={k} value={k} className="text-slate-900 focus:bg-amber-50 focus:text-slate-900">
                        {UNIDADES_MEDIDA[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={fieldLabelClass}>Precio referencial (S/)</Label>
                <Input
                  className={fieldInputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_unitario}
                  onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Stock — solo en creación */}
            {!isEdit && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={fieldLabelClass}>Stock inicial</Label>
                  <Input
                    className={fieldInputClass}
                    type="number" step="0.01" min="0"
                    value={form.stock_actual}
                    onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={fieldLabelClass}>Stock mínimo</Label>
                  <Input
                    className={fieldInputClass}
                    type="number" step="0.01" min="0"
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            {/* Stock mínimo — solo en edición */}
            {isEdit && (
              <div className="space-y-2">
                <Label className={fieldLabelClass}>Stock mínimo</Label>
                <Input
                  className={fieldInputClass}
                  type="number" step="0.01" min="0"
                  value={form.stock_minimo}
                  onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            )}

            {/* Proveedor */}
            <div className="space-y-2">
              <Label className={fieldLabelClass}>Proveedor habitual</Label>
              <Select
                value={form.proveedor_id || 'none'}
                onValueChange={(v) => setForm({ ...form, proveedor_id: v === 'none' ? '' : v })}
                disabled={isSaving}
              >
                <SelectTrigger className={fieldSelectClass}><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-200">
                  <SelectItem value="none" className="text-slate-900 focus:bg-amber-50 focus:text-slate-900">
                    Sin proveedor
                  </SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-slate-900 focus:bg-amber-50 focus:text-slate-900">
                      {p.razon_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
              <Button
                type="button" variant="ghost" onClick={onClose} disabled={isSaving}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}