'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { proveedorSchema, CATEGORIAS_SUMINISTRO, type ProveedorForm } from '@/lib/schemas/proveedor';
import { crearProveedorCotizacionAction } from '@/app/admin/Panel-Administrativo/cotizaciones-proveedor/actions';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  initial: Partial<ProveedorForm>;
  onClose: () => void;
  onCreated: (proveedor: { id: string; razon_social: string; ruc?: string }) => void;
}

export function ProveedorQuickCreateModal({
  open,
  initial,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<ProveedorForm>({
    ruc: initial.ruc ?? '',
    razon_social: initial.razon_social ?? '',
    contacto: initial.contacto ?? '',
    telefono: initial.telefono ?? '',
    email: initial.email ?? '',
    direccion: initial.direccion ?? 'Por completar',
    categoria_suministro: initial.categoria_suministro ?? 'Otros',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = proveedorSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const key = String(err.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await crearProveedorCotizacionAction(parsed.data);
      if (!res.success) throw new Error(res.error || 'No se pudo crear');
      toast.success('Proveedor registrado');
      onCreated({
        id: res.data!.id,
        razon_social: res.data!.razon_social,
        ruc: res.data!.ruc,
      });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear proveedor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="font-bold text-lg">Registrar proveedor</h2>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {(['ruc', 'razon_social', 'contacto', 'telefono', 'email', 'direccion'] as const).map(
            (field) => (
              <div key={field}>
                <label className="text-xs font-semibold text-slate-600 uppercase">
                  {field.replace('_', ' ')}
                </label>
                <Input
                  value={form[field]}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, [field]: e.target.value }));
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy[field];
                      return copy;
                    });
                  }}
                  className="mt-1 rounded-xl"
                />
                {errors[field] && (
                  <p className="text-xs text-red-600 mt-1">{errors[field]}</p>
                )}
              </div>
            ),
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Categoría</label>
            <select
              className="mt-1 w-full border rounded-xl h-10 px-3 text-sm"
              value={form.categoria_suministro}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, categoria_suministro: e.target.value }))
              }
            >
              {CATEGORIAS_SUMINISTRO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-700 hover:bg-indigo-800">
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Crear proveedor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
