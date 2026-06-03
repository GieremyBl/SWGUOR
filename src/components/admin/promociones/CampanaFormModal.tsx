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
  reglas: [], // Corregido: eliminado el typo 'regles'
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
  const [form, setForm] = useState<CampanaForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  
  // Guardamos las llaves de control en el estado para rastrear transiciones de props de forma segura
  const [prevKey, setPrevKey] = useState<{ id: string | number | undefined; tipo: TipoCampana }>({
    id: campana?.id,
    tipo,
  });

  const { data: reglasRes } = useReglasActivasPicker();
  const reglasActivas: ReglaDescuentoRow[] = reglasRes?.data ?? [];
  const titulo = tipo === 'promocion' ? 'promoción' : 'oferta';

  // FIX: Sincronización correcta e idiomática de Props a Estado sin usar refs en el render
  if (campana?.id !== prevKey.id || tipo !== prevKey.tipo) {
    setPrevKey({ id: campana?.id, tipo });
    setForm(campana ? mapDetalleToForm(campana) : emptyForm());
    setErrors({});
  }

  // FIX: Fetch asíncrono con manejo de desmontaje y dependencias de ESLint resueltas
  useEffect(() => {
    let isMounted = true;
    if (!campana?.id) return;

    const loadDetalle = async () => {
      setLoadingDetalle(true);
      try {
        const res =
          tipo === 'promocion'
            ? await fetchPromocionDetalle(campana.id)
            : await fetchOfertaDetalle(campana.id);
            
        if (isMounted) {
          if (res.success && res.data) {
            setForm(mapDetalleToForm(res.data as CampanaRow & {
              promocion_reglas?: Array<{ regla_id: number | string; prioridad: number }>;
              oferta_reglas?: Array<{ regla_id: number | string; prioridad: number }>;
            }));
          } else {
            setForm(mapDetalleToForm(campana));
          }
        }
      } catch {
        if (isMounted) {
          setForm(mapDetalleToForm(campana));
        }
      } finally {
        if (isMounted) {
          setLoadingDetalle(false);
        }
      }
    };

    loadDetalle();

    return () => {
      isMounted = false;
    };
  }, [campana, tipo]); // Corregido: Añadida la dependencia 'campana' completa requerida por mapDetalleToForm

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

  const handleDateChange = (key: 'fecha_inicio' | 'fecha_fin', rawValue: string) => {
    if (!rawValue) {
      if (key === 'fecha_fin') setField('fecha_fin', null);
      return;
    }
    const parsedDate = new Date(rawValue);
    if (!isNaN(parsedDate.getTime())) {
      setField(key, parsedDate.toISOString());
    }
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
            <h2 className="text-xl font-bold text-gray-900 capitalize">
              {campana ? `Editar ${titulo}` : `Nueva ${titulo}`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Agrupa reglas de descuento con prioridad de aplicación
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loadingDetalle ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
            <span className="text-xs font-medium text-gray-400">Cargando dependencias de campaña...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
              <Input 
                value={form.nombre} 
                onChange={(e) => setField('nombre', e.target.value)} 
                className={errors.nombre ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {errors.nombre && <p className="text-xs text-red-500 mt-1 font-medium">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label>
              <textarea
                className="w-full min-h-[72px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white"
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
                  onChange={(e) => handleDateChange('fecha_inicio', e.target.value)}
                  className={errors.fecha_inicio ? 'border-red-400 focus:ring-red-400' : ''}
                />
                {errors.fecha_inicio && <p className="text-xs text-red-500 mt-1 font-medium">{errors.fecha_inicio}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fin (opcional)</label>
                <Input
                  type="datetime-local"
                  value={toInputDateTimeLocal(form.fecha_fin ?? undefined)}
                  onChange={(e) => handleDateChange('fecha_fin', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.activo !== false}
                  onChange={(e) => setField('activo', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-700 focus:ring-amber-600 cursor-pointer"
                />
                Campaña activa
              </label>
            </div>

            {/* Panel de Reglas Vinculadas */}
            <div className="border rounded-xl p-4 space-y-3 bg-slate-50/50 border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Reglas asociadas</p>
                  <p className="text-[11px] text-slate-400">Aplica descuentos en cascada según su prioridad</p>
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={addRegla} 
                  disabled={reglasActivas.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>

              {(form.reglas ?? []).length === 0 && (
                <div className="py-4 text-center border border-dashed rounded-lg bg-white">
                  <p className="text-xs text-slate-400 font-medium">Sin reglas vinculadas a esta campaña.</p>
                </div>
              )}

              {(form.reglas ?? []).map((v, idx) => (
                <div key={`${v.regla_id}-${idx}`} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Regla de Descuento</label>
                    <select
                      className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white"
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
                  <div className="w-24 shrink-0">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prioridad</label>
                    <Input
                      type="number"
                      min={1}
                      value={v.prioridad}
                      onChange={(e) =>
                        updateRegla(idx, { prioridad: Number(e.target.value) || 1 })
                      }
                      className="h-10"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeRegla(idx)}
                    className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {errors.reglas && <p className="text-xs text-red-500 font-medium">{errors.reglas}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-amber-700 hover:bg-amber-800 text-white min-w-[100px]">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}