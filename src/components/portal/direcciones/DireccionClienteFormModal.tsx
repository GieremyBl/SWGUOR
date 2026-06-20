'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Plus } from 'lucide-react';
import { ZodError } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  direccionClienteCreateSchema,
  direccionClienteUpdateSchema,
  type DireccionClienteCreateInput,
  type DireccionClienteRecord,
  type DireccionClienteUpdateInput,
} from '@/lib/schemas/direcciones-cliente';

type FormState = {
  alias: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  departamento: string;
  pais: string;
  es_principal: boolean;
};

const EMPTY_FORM: FormState = {
  alias: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  departamento: '',
  pais: '',
  es_principal: false,
};

function toPayload(form: FormState): DireccionClienteCreateInput {
  return {
    alias: form.alias.trim(),
    direccion: form.direccion.trim(),
    ciudad: form.ciudad.trim() || null,
    provincia: form.provincia.trim() || null,
    departamento: form.departamento.trim() || null,
    pais: form.pais.trim() || null,
    es_principal: form.es_principal,
  };
}

interface DireccionClienteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direccion?: DireccionClienteRecord | null;
  onSubmit: (payload: DireccionClienteCreateInput | DireccionClienteUpdateInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function DireccionClienteFormModal({
  open,
  onOpenChange,
  direccion,
  onSubmit,
  isSubmitting,
}: DireccionClienteFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(direccion);

  useEffect(() => {
    if (!open) return;

    if (direccion) {
      setForm({
        alias: direccion.alias ?? '',
        direccion: direccion.direccion ?? '',
        ciudad: direccion.ciudad ?? '',
        provincia: direccion.provincia ?? '',
        departamento: direccion.departamento ?? '',
        pais: direccion.pais ?? '',
        es_principal: Boolean(direccion.es_principal),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [open, direccion]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const payload = toPayload(form);

      if (isEditing) {
        direccionClienteUpdateSchema.parse(payload);
      } else {
        direccionClienteCreateSchema.parse(payload);
      }

      await onSubmit(payload);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path[0];
          if (typeof key === 'string' && !fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }
      if (err instanceof Error) {
        setErrors({ form: err.message });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
              {isEditing ? (
                <MapPin className="w-5 h-5 text-rose-500" />
              ) : (
                <Plus className="w-5 h-5 text-rose-500" />
              )}
            </div>
            <div>
              <DialogTitle>
                {isEditing ? 'Editar dirección' : 'Agregar nueva dirección'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Actualice los datos de su sede o punto de entrega.'
                  : 'Registre una nueva sede para sus despachos y pedidos.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {errors.form}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="alias">
              Alias <span className="text-red-500">*</span>
            </Label>
            <Input
              id="alias"
              value={form.alias}
              onChange={(e) => setField('alias', e.target.value)}
              placeholder="Ej. Oficina central, Almacén norte"
              className="rounded-xl"
            />
            {errors.alias && <p className="text-xs text-red-600">{errors.alias}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">
              Dirección detallada <span className="text-red-500">*</span>
            </Label>
            <Input
              id="direccion"
              value={form.direccion}
              onChange={(e) => setField('direccion', e.target.value)}
              placeholder="Av. Industrial 123, Urb. Los Olivos"
              className="rounded-xl"
            />
            {errors.direccion && <p className="text-xs text-red-600">{errors.direccion}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={form.ciudad}
                onChange={(e) => setField('ciudad', e.target.value)}
                placeholder="Lima"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input
                id="provincia"
                value={form.provincia}
                onChange={(e) => setField('provincia', e.target.value)}
                placeholder="Lima"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                value={form.departamento}
                onChange={(e) => setField('departamento', e.target.value)}
                placeholder="Lima"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={form.pais}
                onChange={(e) => setField('pais', e.target.value)}
                placeholder="Perú"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <Checkbox
              id="es_principal"
              checked={form.es_principal}
              onCheckedChange={(checked) => setField('es_principal', checked === true)}
            />
            <Label htmlFor="es_principal" className="text-sm font-medium cursor-pointer">
              Marcar como dirección principal
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-rose-500 hover:bg-rose-600"
              disabled={isSubmitting}
            >
              <span className="inline-flex items-center">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Registrar dirección'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
