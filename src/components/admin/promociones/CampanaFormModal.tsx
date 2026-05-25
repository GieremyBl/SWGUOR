'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  campanaSchema,
  type CampanaForm,
  type CampanaRow,
  type ReglaDescuentoRow,
  type ReglaVinculoForm,
} from '@/lib/schemas/promociones-ofertas';
import { useReglasActivasPicker } from '@/lib/hooks/usePromocionesOfertas';
import {
  fetchOfertaDetalle,
  fetchPromocionDetalle,
} from '@/lib/helpers/promociones-helpers';
import { toInputDateTimeLocal } from './utils';

type TipoCampana = 'promocion' | 'oferta';

interface Props {
  tipo: TipoCampana;
  campana: CampanaRow | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: CampanaForm) => void;
}

const emptyForm = (): CampanaForm => ({
  nombre: '',
  descripcion: '',
  activo: true,
  fecha_inicio: new Date().toISOString(),
  fecha_fin: null,
  reglas: [],
});

function mapDetalleToForm(
  data: CampanaRow & {
    promocion_reglas?: Array<{ regla_id: number | string; prioridad: number }>;
    oferta_reglas?: Array<{ regla_id: number | string; prioridad: number }>;
  },
): CampanaForm {
  const vinculos = data.promocion_reglas ?? data.oferta_reglas ?? [];
  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    activo: data.activo,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    reglas: vinculos.map((v) => ({
      regla_id: v.regla_id,
      prioridad: v.prioridad,
    })),
  };
}

export function CampanaFormModal({ tipo, campana, isSaving, onClose, onSave }: Props) {
  const [form, setForm] = useState<CampanaForm>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const { data: reglasRes } = useReglasActivasPicker();
  const reglasActivas: ReglaDescuentoRow[] = reglasRes?.data ?? [];

  const titulo = tipo === 'promocion' ? 'promoción' : 'oferta';

  useEffect(() => {
    if (!campana?.id) {
      setForm(emptyForm());
      return;
    }

    const load = async () => {
      setLoadingDetalle(true);
      try {
        const res =
          tipo === 'promocion'
            ? await fetchPromocionDetalle(campana.id)
            : await fetchOfertaDetalle(campana.id);
        if (res.success && res.data) {
          setForm(mapDetalleToForm(res.data as CampanaRow & {
            promocion_reglas?: Array<{ regla_id: number | string; prioridad: number }>;
            oferta_reglas?: Array<{ regla_id: number | string; prioridad: number }>;
          }));
        } else {
          setForm(mapDetalleToForm(campana));
        }
      } catch {
        setForm(mapDetalleToForm(campana));
      } finally {
        setLoadingDetalle(false);
      }
    };
    load();
  }, [campana, tipo]);

  const setField = <K extends keyof CampanaForm>(key: K, value: CampanaForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[String(key)];
      return copy;
    });
  };

  const updateRegla = (index: number, patch: Partial<ReglaVinculoForm>) => {
    setForm((prev) => {
      const reglas = [...(prev.reglas ?? [])];
      reglas[index] = { ...reglas[index], ...patch };
      return { ...prev, reglas };
    });
  };

  const addRegla = () => {
    const first = reglasActivas[0];
    if (!first) return;
    setForm((prev) => ({
      ...prev,
      reglas: [
        ...(prev.reglas ?? []),
        { regla_id: first.id, prioridad: (prev.reglas?.length ?? 0) + 1 },
      ],
    }));
  };

  const removeRegla = (index: number) => {
    setForm((prev) => ({
      ...prev,
      reglas: (prev.reglas ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = campanaSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const key = String(err.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    onSave({ ...parsed.data, id: campana?.id });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {campana ? `Editar ${titulo}` : `Nueva ${titulo}`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Agrupa reglas de descuento con prioridad de aplicación
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loadingDetalle ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
              <Input value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label>
              <textarea
                className="w-full min-h-[72px] rounded-md border px-3 py-2 text-sm"
                value={form.descripcion ?? ''}
                onChange={(e) => setField('descripcion', e.target.value || null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Inicio *</label>
                <Input
                  type="datetime-local"
                  value={toInputDateTimeLocal(form.fecha_inicio)}
                  onChange={(e) =>
                    setField('fecha_inicio', new Date(e.target.value).toISOString())
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fin (opcional)</label>
                <Input
                  type="datetime-local"
                  value={toInputDateTimeLocal(form.fecha_fin ?? undefined)}
                  onChange={(e) =>
                    setField(
                      'fecha_fin',
                      e.target.value ? new Date(e.target.value).toISOString() : null,
                    )
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.activo !== false}
                onChange={(e) => setField('activo', e.target.checked)}
              />
              Campaña activa
            </label>

            <div className="border rounded-xl p-4 space-y-3 bg-amber-50/40 border-amber-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Reglas asociadas</p>
                <Button type="button" size="sm" variant="outline" onClick={addRegla}>
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>

              {(form.reglas ?? []).length === 0 && (
                <p className="text-xs text-slate-500">Sin reglas vinculadas.</p>
              )}

              {(form.reglas ?? []).map((v, idx) => (
                <div key={`${v.regla_id}-${idx}`} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500">Regla</label>
                    <select
                      className="w-full h-9 rounded-md border px-2 text-sm"
                      value={String(v.regla_id)}
                      onChange={(e) => updateRegla(idx, { regla_id: e.target.value })}
                    >
                      {reglasActivas.map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          {r.nombre} ({r.valor_descuento}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-slate-500">Prioridad</label>
                    <Input
                      type="number"
                      min={1}
                      value={v.prioridad}
                      onChange={(e) =>
                        updateRegla(idx, { prioridad: Number(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRegla(idx)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

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
        )}
      </div>
    </div>
  );
}

