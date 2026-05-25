'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  reglaDescuentoSchema,
  type ReglaDescuentoForm,
  type ReglaDescuentoRow,
} from '@/lib/schemas/promociones-ofertas';
import {
  TIPO_BENEFICIO_OPCIONES,
  TIPO_CONTEO_OPCIONES,
} from '@/lib/constants/promociones';
import { toInputDateTimeLocal } from './utils';

interface CategoriaOpt {
  id: number | string;
  nombre: string;
}

interface Props {
  regla: ReglaDescuentoRow | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: ReglaDescuentoForm) => void;
}

const emptyForm = (): ReglaDescuentoForm => ({
  nombre: '',
  cantidad_min: 400,
  monto_min_compra: null,
  tipo_beneficio: 'porcentaje_subtotal',
  valor_descuento: 5,
  fecha_inicio: new Date().toISOString(),
  fecha_fin: new Date(Date.now() + 30 * 86400000).toISOString(),
  categoria_id: null,
  tipo_conteo: 'modelos_distintos',
  activo: true,
});

export function ReglaDescuentoFormModal({ regla, isSaving, onClose, onSave }: Props) {
  const [form, setForm] = useState<ReglaDescuentoForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categorias, setCategorias] = useState<CategoriaOpt[]>([]);

  useEffect(() => {
    if (!regla) {
      setForm(emptyForm());
      return;
    }
    setForm({
      id: regla.id,
      nombre: regla.nombre,
      cantidad_min: regla.cantidad_min,
      monto_min_compra: regla.monto_min_compra,
      tipo_beneficio: regla.tipo_beneficio as ReglaDescuentoForm['tipo_beneficio'],
      valor_descuento: Number(regla.valor_descuento),
      fecha_inicio: regla.fecha_inicio,
      fecha_fin: regla.fecha_fin,
      categoria_id: regla.categoria_id,
      tipo_conteo: (regla.tipo_conteo as ReglaDescuentoForm['tipo_conteo']) ?? null,
      activo: regla.activo ?? true,
    });
  }, [regla]);

  useEffect(() => {
    fetch('/api/admin/categorias', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setCategorias(
          list.map((c: { id: number; nombre: string }) => ({ id: c.id, nombre: c.nombre })),
        );
      })
      .catch(() => setCategorias([]));
  }, []);

  const setField = <K extends keyof ReglaDescuentoForm>(
    key: K,
    value: ReglaDescuentoForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[String(key)];
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reglaDescuentoSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const key = String(err.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSave({ ...parsed.data, id: regla?.id });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {regla ? 'Editar regla de descuento' : 'Nueva regla de descuento'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Condiciones y beneficio aplicable a cotizaciones
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nombre *" error={errors.nombre}>
            <Input value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cantidad mínima" error={errors.cantidad_min}>
              <Input
                type="number"
                min={1}
                value={form.cantidad_min}
                onChange={(e) => setField('cantidad_min', Number(e.target.value))}
              />
            </Field>
            <Field label="Monto mín. compra" error={errors.monto_min_compra}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.monto_min_compra ?? ''}
                onChange={(e) =>
                  setField('monto_min_compra', e.target.value ? Number(e.target.value) : null)
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo beneficio" error={errors.tipo_beneficio}>
              <select
                className="w-full h-9 rounded-md border px-3 text-sm"
                value={form.tipo_beneficio}
                onChange={(e) =>
                  setField('tipo_beneficio', e.target.value as ReglaDescuentoForm['tipo_beneficio'])
                }
              >
                {TIPO_BENEFICIO_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="% descuento" error={errors.valor_descuento}>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.valor_descuento}
                onChange={(e) => setField('valor_descuento', Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo conteo" error={errors.tipo_conteo}>
              <select
                className="w-full h-9 rounded-md border px-3 text-sm"
                value={form.tipo_conteo ?? ''}
                onChange={(e) =>
                  setField(
                    'tipo_conteo',
                    (e.target.value || null) as ReglaDescuentoForm['tipo_conteo'],
                  )
                }
              >
                <option value="">Sin especificar</option>
                {TIPO_CONTEO_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoría" error={errors.categoria_id}>
              <select
                className="w-full h-9 rounded-md border px-3 text-sm"
                value={form.categoria_id ?? ''}
                onChange={(e) =>
                  setField('categoria_id', e.target.value ? e.target.value : null)
                }
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Desde *" error={errors.fecha_inicio}>
              <Input
                type="datetime-local"
                value={toInputDateTimeLocal(form.fecha_inicio)}
                onChange={(e) =>
                  setField('fecha_inicio', new Date(e.target.value).toISOString())
                }
              />
            </Field>
            <Field label="Hasta *" error={errors.fecha_fin}>
              <Input
                type="datetime-local"
                value={toInputDateTimeLocal(form.fecha_fin)}
                onChange={(e) =>
                  setField('fecha_fin', new Date(e.target.value).toISOString())
                }
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.activo !== false}
              onChange={(e) => setField('activo', e.target.checked)}
            />
            Regla activa
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-amber-700 hover:bg-amber-800">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
