'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  campanaConEscalasSchema,
  type CampanaConEscalasForm,
  type CampanaRow,
} from '@/lib/schemas/promociones-ofertas';
import {
  fetchOfertaDetalle,
  fetchPromocionDetalle,
} from '@/lib/helpers/promociones-helpers';
import { EscalaDescuentosSection } from './EscalaDescuentosSection';
import {
  emptyCampanaConEscalasForm,
  mapCampanaDetalleToForm,
} from './campana-form.mapper';
import { toInputDateTimeLocal } from './utils';

type TipoCampana = 'promocion' | 'oferta';

interface CategoriaOpt {
  id: number | string;
  nombre: string;
}

interface ProductoOpt {
  id: number | string;
  nombre: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoCampana;
  campana: CampanaRow | null;
  isSaving: boolean;
  onSave: (data: CampanaConEscalasForm) => void;
}

const fieldLabelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide';
// Clase unificada para asegurar visibilidad del texto en inputs
const inputBaseClass = 'bg-slate-50 border-slate-200 h-11 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-amber-600/30 focus:border-amber-600';

export function CampanaFormModal({
  open,
  onOpenChange,
  tipo,
  campana,
  isSaving,
  onSave,
}: Props) {
  const [form, setForm] = useState<CampanaConEscalasForm>(emptyCampanaConEscalasForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaOpt[]>([]);
  const [productos, setProductos] = useState<ProductoOpt[]>([]);

  const [prevKey, setPrevKey] = useState<{ id: string | number | undefined; tipo: TipoCampana }>({
    id: campana?.id,
    tipo,
  });

  const titulo = tipo === 'promocion' ? 'promoción' : 'oferta';

  if (campana?.id !== prevKey.id || tipo !== prevKey.tipo) {
    setPrevKey({ id: campana?.id, tipo });
    setForm(campana ? mapCampanaDetalleToForm(campana) : emptyCampanaConEscalasForm());
    setErrors({});
  }

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    fetch('/api/admin/categorias', { cache: 'no-store', signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setCategorias(
          list.map((c: { id: number; nombre: string }) => ({ id: c.id, nombre: c.nombre })),
        );
      })
      .catch(() => setCategorias([]));

    fetch('/api/admin/productos', { cache: 'no-store', signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.productos) ? data.productos : [];
        setProductos(
          list.map((p: { id: number | string; nombre: string }) => ({
            id: p.id,
            nombre: p.nombre,
          })),
        );
      })
      .catch(() => setProductos([]));

    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    let activo = true;
    if (!open || !campana?.id) return;

    const loadDetalle = async () => {
      setLoadingDetalle(true);
      try {
        const res =
          tipo === 'promocion'
            ? await fetchPromocionDetalle(campana.id)
            : await fetchOfertaDetalle(campana.id);

        if (activo && res.success && res.data) {
          setForm(mapCampanaDetalleToForm(res.data));
        } else if (activo) {
          setForm(mapCampanaDetalleToForm(campana));
        }
      } catch {
        if (activo) setForm(mapCampanaDetalleToForm(campana));
      } finally {
        if (activo) setLoadingDetalle(false);
      }
    };

    loadDetalle();
    return () => {
      activo = false;
    };
  }, [open, campana, tipo]);

  useEffect(() => {
    if (open && !campana?.id) {
      setForm(emptyCampanaConEscalasForm());
      setErrors({});
      setLoadingDetalle(false);
    }
  }, [open, campana?.id]);

  const setField = <K extends keyof CampanaConEscalasForm>(
    key: K,
    value: CampanaConEscalasForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[String(key)];
      return copy;
    });
  };

  const handleDateChange = (key: 'fecha_inicio' | 'fecha_fin', rawValue: string) => {
    if (!rawValue) {
      if (key === 'fecha_fin') setField('fecha_fin', null);
      return;
    }
    const parsedDate = new Date(rawValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      setField(key, parsedDate.toISOString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = campanaConEscalasSchema.safeParse(form);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl gap-0 border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col [&_[data-slot=dialog-close]]:text-slate-500 [&_[data-slot=dialog-close]]:hover:text-slate-800"
        onInteractOutside={(e) => {
          if (isSaving) e.preventDefault();
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 text-left shrink-0">
          <DialogTitle className="capitalize text-slate-900">
            {campana ? `Editar ${titulo}` : `Nueva ${titulo}`}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Define vigencia, alcance y escalas de descuento en un solo paso
          </DialogDescription>
        </DialogHeader>

        {loadingDetalle ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
            <span className="text-xs font-medium text-slate-400">Cargando datos...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setField('nombre', e.target.value)}
                  className={`${inputBaseClass} ${errors.nombre ? 'border-red-400' : ''}`}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-500 font-medium">{errors.nombre}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className={fieldLabelClass}>Descripción</Label>
                <textarea
                  className={`w-full min-h-[72px] rounded-md border p-3 text-sm focus:outline-none focus:ring-2 ${inputBaseClass}`}
                  value={form.descripcion ?? ''}
                  onChange={(e) => setField('descripcion', e.target.value || null)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={fieldLabelClass}>Inicio *</Label>
                  <Input
                    type="datetime-local"
                    value={toInputDateTimeLocal(form.fecha_inicio)}
                    onChange={(e) => handleDateChange('fecha_inicio', e.target.value)}
                    className={`${inputBaseClass} ${errors.fecha_inicio ? 'border-red-400' : ''}`}
                  />
                  {errors.fecha_inicio && (
                    <p className="text-xs text-red-500 font-medium">{errors.fecha_inicio}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldLabelClass}>Fin (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={toInputDateTimeLocal(form.fecha_fin ?? undefined)}
                    onChange={(e) => handleDateChange('fecha_fin', e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo !== false}
                    onChange={(e) => setField('activo', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600"
                  />
                  Campaña activa
                </label>
              </div>

              <EscalaDescuentosSection
                alcance={form.alcance}
                categoriaId={form.categoria_id ?? null}
                productoId={form.producto_id ?? null}
                escalas={form.escalas}
                categorias={categorias}
                productos={productos}
                errors={errors}
                onAlcanceChange={(alcance) => {
                  setField('alcance', alcance);
                  if (alcance !== 'categoria') setField('categoria_id', null);
                  if (alcance !== 'producto') setField('producto_id', null);
                }}
                onCategoriaChange={(id) => setField('categoria_id', id)}
                onProductoChange={(id) => setField('producto_id', id)}
                onEscalasChange={(escalas) => setField('escalas', escalas)}
              />
            </div>

            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-amber-700 hover:bg-amber-800 text-white min-w-[100px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}