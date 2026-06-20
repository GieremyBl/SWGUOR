'use client';

import { useEffect, useState } from 'react';
import { Ruler } from 'lucide-react';
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
import type { FichaMedidaRow } from '@/lib/schemas/ficha-medidas';
import type { FichaMedidaPayload } from '@/lib/helpers/ficha-medidas-helpers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: FichaMedidaPayload) => Promise<{ success?: boolean; error?: string }>;
  editing?: FichaMedidaRow | null;
  isSaving?: boolean;
}

const fieldClass = 'h-11 bg-slate-50 border-slate-200';
const labelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide';

export default function FichaMedidaItemDialog({
  isOpen,
  onClose,
  onSave,
  editing,
  isSaving,
}: Props) {
  const isEdit = !!editing;
  const [form, setForm] = useState({
    punto_medida: '',
    talla: '',
    valor_cm: '',
    tolerancia: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setForm({
        punto_medida: editing.punto_medida ?? '',
        talla: editing.talla ?? '',
        valor_cm: editing.valor_cm != null ? String(editing.valor_cm) : '',
        tolerancia: editing.tolerancia != null ? String(editing.tolerancia) : '',
      });
    } else {
      setForm({ punto_medida: '', talla: '', valor_cm: '', tolerancia: '' });
    }
  }, [isOpen, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.punto_medida.trim() || !form.talla.trim()) {
      toast.error('Punto de medida y talla son obligatorios');
      return;
    }

    const payload: FichaMedidaPayload = {
      punto_medida: form.punto_medida.trim(),
      talla: form.talla.trim(),
      valor_cm: form.valor_cm ? Number(form.valor_cm) : null,
      tolerancia: form.tolerancia ? Number(form.tolerancia) : null,
    };

    const res = await onSave(payload);
    if (res?.success !== false && !res?.error) {
      onClose();
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] border border-slate-200 shadow-xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Ruler className="w-5 h-5 text-pink-600" />
            {isEdit ? 'Editar medida' : 'Agregar medida'}
          </DialogTitle>
          <DialogDescription>
            Registra un punto de medida para una talla específica de la prenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Punto de medida</Label>
              <Input
                className={fieldClass}
                placeholder="Ej: Pecho"
                value={form.punto_medida}
                onChange={(e) => setForm({ ...form, punto_medida: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Talla</Label>
              <Input
                className={fieldClass}
                placeholder="Ej: M"
                value={form.talla}
                onChange={(e) => setForm({ ...form, talla: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Valor (cm)</Label>
              <Input
                className={fieldClass}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.0"
                value={form.valor_cm}
                onChange={(e) => setForm({ ...form, valor_cm: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Tolerancia (±cm)</Label>
              <Input
                className={fieldClass}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.0"
                value={form.tolerancia}
                onChange={(e) => setForm({ ...form, tolerancia: e.target.value })}
                disabled={isSaving}
              />
            </div>
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
