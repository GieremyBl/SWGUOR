'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

type EstadoTaller = 'activo' | 'inactivo' | 'suspendido';
type EspecialidadTaller = 'corte' | 'costura' | 'confeccion' | 'bordado' | 'estampado' | 'acabados' | 'otro';

const ESPECIALIDADES: { value: EspecialidadTaller; label: string }[] = [
  { value: 'corte', label: 'Corte' },
  { value: 'costura', label: 'Costura' },
  { value: 'confeccion', label: 'Confección' },
  { value: 'bordado', label: 'Bordado' },
  { value: 'estampado', label: 'Estampado' },
  { value: 'acabados', label: 'Acabados' },
  { value: 'otro', label: 'Otro' },
];

interface TallerForm {
  nombre: string;
  ruc: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  especialidad: EspecialidadTaller | '';
  estado: EstadoTaller;
}

interface Props {
  taller?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY: TallerForm = {
  nombre: '', ruc: '', contacto: '', telefono: '',
  email: '', direccion: '', especialidad: '', estado: 'activo',
};

export default function TallerFormModal({ taller, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<TallerForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (taller) {
      setForm({
        nombre: taller.nombre ?? '',
        ruc: taller.ruc ?? '',
        contacto: taller.contacto ?? '',
        telefono: taller.telefono ?? '',
        email: taller.email ?? '',
        direccion: taller.direccion ?? '',
        especialidad: taller.especialidad ?? '',
        estado: taller.estado ?? 'activo',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [taller]);

  const handleChange = (field: keyof TallerForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.ruc.trim()) e.ruc = 'El RUC es requerido';
    if (!form.especialidad) e.especialidad = 'Seleccione una especialidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        especialidad: form.especialidad === '' ? null : form.especialidad
      };

      if (!taller) {
        const { data: existing } = await supabase
          .from('talleres').select('ruc').eq('ruc', form.ruc).maybeSingle();
        if (existing) {
          setErrors({ ruc: `El RUC ${form.ruc} ya está registrado` });
          setIsSaving(false);
          return;
        }

        const { error } = await supabase.from('talleres').insert([payload]);
        if (error) throw error;
        toast.success('Taller registrado exitosamente');
      } else {
        const { error } = await supabase.from('talleres').update(payload).eq('id', taller.id);
        if (error) throw error;
        toast.success('Datos del taller actualizados');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Error al guardar el taller');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={e => handleChange('nombre', e.target.value)}
                placeholder="Ej: Taller El Sol"
                className={errors.nombre ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">RUC *</label>
              <Input
                value={form.ruc}
                onChange={e => handleChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="20123456789"
                maxLength={11}
                className={errors.ruc ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {errors.ruc && <p className="text-xs text-red-500 mt-1">{errors.ruc}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Especialidad *</label>
              <select
                value={form.especialidad}
                onChange={e => handleChange('especialidad', e.target.value)}
                className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${errors.especialidad ? 'border-red-400' : 'border-gray-200'
                  }`}
              >
                <option value="">Seleccionar...</option>
                {ESPECIALIDADES.map(esp => (
                  <option key={esp.value} value={esp.value}>{esp.label}</option>
                ))}
              </select>
              {errors.especialidad && <p className="text-xs text-red-500 mt-1">{errors.especialidad}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
              <select
                value={form.estado}
                onChange={e => handleChange('estado', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contacto *</label>
            <Input
              value={form.contacto}
              onChange={e => handleChange('contacto', e.target.value)}
              placeholder="Nombre del responsable"
              className={errors.contacto ? 'border-red-400 focus:ring-red-400' : ''}
            />
            {errors.contacto && <p className="text-xs text-red-500 mt-1">{errors.contacto}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono</label>
              <Input
                value={form.telefono}
                onChange={e => handleChange('telefono', e.target.value)}
                placeholder="9xx xxx xxx"
                className={errors.telefono ? 'border-red-400' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="taller@email.com"
                className={errors.email ? 'border-red-400' : ''}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección</label>
            <Input
              value={form.direccion}
              onChange={e => handleChange('direccion', e.target.value)}
              placeholder="Av. / Jr. ..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white" disabled={isSaving}>
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</>
                : taller ? 'Actualizar' : 'Crear Taller'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
