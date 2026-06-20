'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import {
  tarifaTallerSchema,
  MONEDAS_TARIFA,
  type TarifaTallerRow,
} from '@/lib/schemas/tarifa-talleres';
import { ESPECIALIDADES_TALLER } from '@/lib/schemas/talleres';
import { ESPECIALIDAD_TALLER_LABELS } from '@/lib/constants/talleres';
import type { TarifaTallerForm } from '@/lib/schemas/tarifa-talleres';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Omit<TarifaTallerForm, 'taller_id'>) => Promise<{ success?: boolean; error?: string }>;
  editing?: TarifaTallerRow | null;
  isSaving?: boolean;
}

const fieldClass = 'h-11 bg-slate-50 border-slate-200';
const labelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide';

function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function TarifaTallerFormDialog({
  isOpen,
  onClose,
  onSave,
  editing,
  isSaving,
}: Props) {
  const [form, setForm] = useState({
    especialidad: '',
    precio_unitario: '',
    moneda: 'PEN',
    vigente_desde: new Date().toISOString().slice(0, 10),
    vigente_hasta: '',
    activo: true,
    notas: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setForm({
        especialidad: editing.especialidad,
        precio_unitario: String(editing.precio_unitario),
        moneda: editing.moneda ?? 'PEN',
        vigente_desde: toDateInput(editing.vigente_desde),
        vigente_hasta: toDateInput(editing.vigente_hasta),
        activo: editing.activo,
        notas: editing.notas ?? '',
      });
    } else {
      setForm({
        especialidad: '',
        precio_unitario: '',
        moneda: 'PEN',
        vigente_desde: new Date().toISOString().slice(0, 10),
        vigente_hasta: '',
        activo: true,
        notas: '',
      });
    }
    setErrors({});
  }, [isOpen, editing]);

  const handleSubmit = async () => {
    if (!editing && !form.especialidad) {
      setErrors({ especialidad: 'Seleccione una especialidad' });
      return;
    }

    const payload = {
      especialidad: form.especialidad as TarifaTallerForm['especialidad'],
      precio_unitario: Number(form.precio_unitario),
      moneda: form.moneda as TarifaTallerForm['moneda'],
      vigente_desde: form.vigente_desde,
      vigente_hasta: form.vigente_hasta || null,
      activo: form.activo,
      notas: form.notas || null,
      taller_id: 1,
    };

    const schema = editing
      ? tarifaTallerSchema.omit({ taller_id: true }).partial()
      : tarifaTallerSchema.omit({ taller_id: true });

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'form');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const { taller_id: _t, ...rest } = parsed.data as TarifaTallerForm;
    const res = await onSave(rest);
    if (res.success) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
          <DialogDescription>
            Precio por especialidad y vigencia del servicio del taller.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className={labelClass}>Especialidad *</Label>
            <Select
              value={form.especialidad}
              onValueChange={(v) => setForm((f) => ({ ...f, especialidad: v }))}
              disabled={!!editing}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES_TALLER.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESPECIALIDAD_TALLER_LABELS[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.especialidad && <p className="text-xs text-red-500">{errors.especialidad}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className={labelClass}>Precio unitario *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                className={fieldClass}
                value={form.precio_unitario}
                onChange={(e) => setForm((f) => ({ ...f, precio_unitario: e.target.value }))}
              />
              {errors.precio_unitario && <p className="text-xs text-red-500">{errors.precio_unitario}</p>}
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Moneda</Label>
              <Select
                value={form.moneda}
                onValueChange={(v) => setForm((f) => ({ ...f, moneda: v }))}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS_TARIFA.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className={labelClass}>Vigente desde</Label>
              <Input
                type="date"
                className={fieldClass}
                value={form.vigente_desde}
                onChange={(e) => setForm((f) => ({ ...f, vigente_desde: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Vigente hasta</Label>
              <Input
                type="date"
                className={fieldClass}
                value={form.vigente_hasta}
                onChange={(e) => setForm((f) => ({ ...f, vigente_hasta: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Notas</Label>
            <Textarea
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              className="min-h-[72px] resize-none bg-slate-50"
              placeholder="Condiciones, mínimos, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : editing ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
