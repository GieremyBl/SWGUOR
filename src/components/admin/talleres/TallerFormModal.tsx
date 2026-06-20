'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { tallerSchema, ESPECIALIDADES_TALLER, ESTADOS_TALLER } from '@/lib/schemas/talleres';
import { ESPECIALIDAD_TALLER_LABELS } from '@/lib/constants/talleres';
import type { Taller, TallerForm } from '@/lib/schemas/talleres';

interface Props {
  taller?: Taller | null;
  onClose: () => void;
  onSave: (data: TallerForm) => Promise<{ success?: boolean; error?: string }>;
  isSaving?: boolean;
}

const EMPTY: TallerForm = {
  nombre: '',
  ruc: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  especialidad: undefined,
  estado: 'activo',
};

export default function TallerFormModal({ taller, onClose, onSave, isSaving }: Props) {
  const [form, setForm] = useState<TallerForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taller) {
      setForm({
        nombre: taller.nombre ?? '',
        ruc: taller.ruc ?? '',
        contacto: taller.contacto ?? '',
        telefono: taller.telefono ?? '',
        email: taller.email ?? '',
        direccion: taller.direccion ?? '',
        especialidad: taller.especialidad,
        estado: taller.estado ?? 'activo',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [taller]);

  const handleChange = (field: keyof TallerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: TallerForm = {
      ...form,
      email: form.email?.trim() || undefined,
      especialidad: form.especialidad || undefined,
    };

    const parsed = tallerSchema.omit({ id: true }).safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'form');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const res = await onSave(parsed.data);
    if (res.success) {
      onClose();
    } else if (res.error) {
      toast.error(res.error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {taller ? 'Editar Taller' : 'Nuevo Taller'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {taller ? 'Actualiza los datos del taller externo' : 'Registra un taller de maquila o servicio'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej: Taller El Sol"
                className={errors.nombre ? 'border-red-400' : ''}
              />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">RUC *</label>
              <Input
                value={form.ruc}
                onChange={(e) => handleChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="20123456789"
                maxLength={11}
                disabled={!!taller}
                className={errors.ruc ? 'border-red-400' : ''}
              />
              {errors.ruc && <p className="text-xs text-red-500 mt-1">{errors.ruc}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Especialidad</label>
              <select
                value={form.especialidad ?? ''}
                onChange={(e) => handleChange('especialidad', e.target.value)}
                className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  errors.especialidad ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <option value="">Seleccionar...</option>
                {ESPECIALIDADES_TALLER.map((esp) => (
                  <option key={esp} value={esp}>{ESPECIALIDAD_TALLER_LABELS[esp]}</option>
                ))}
              </select>
              {errors.especialidad && <p className="text-xs text-red-500 mt-1">{errors.especialidad}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {ESTADOS_TALLER.map((est) => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contacto *</label>
            <Input
              value={form.contacto}
              onChange={(e) => handleChange('contacto', e.target.value)}
              placeholder="Nombre del responsable"
              className={errors.contacto ? 'border-red-400' : ''}
            />
            {errors.contacto && <p className="text-xs text-red-500 mt-1">{errors.contacto}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono *</label>
              <Input
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="9xx xxx xxx"
                className={errors.telefono ? 'border-red-400' : ''}
              />
              {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="taller@email.com"
                className={errors.email ? 'border-red-400' : ''}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección *</label>
            <Input
              value={form.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              placeholder="Av. / Jr. ..."
              className={errors.direccion ? 'border-red-400' : ''}
            />
            {errors.direccion && <p className="text-xs text-red-500 mt-1">{errors.direccion}</p>}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </span>
              ) : taller ? (
                'Actualizar'
              ) : (
                'Crear Taller'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
