'use client';

// GUOR PRO Modal Design — Almacenes
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { crearAlmacenSchema, type CrearAlmacen as AlmacenInput } from '@/lib/schemas/almacenes';
import { z } from 'zod';
import { toast } from 'sonner';

interface Props {
  almacen?:  any | null;
  onClose:  () => void;
  onSuccess:   () => void;
}

const EMPTY = {
  nombre:           '',
  descripcion:      '',
  direccion:        '',
  capacidad_total:  undefined as number | undefined,
  unidad_capacidad: 'unidades',
  estado:           'activo',
};

export default function AlmacenFormModal({ almacen, onClose, onSuccess }: Props) {
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (almacen) {
      setForm({
        nombre:           almacen.nombre           ?? '',
        descripcion:      almacen.descripcion       ?? '',
        direccion:        almacen.direccion         ?? '',
        capacidad_total:  almacen.capacidad_total ? Number(almacen.capacidad_total) : undefined,
        unidad_capacidad: almacen.unidad_capacidad  ?? 'unidades',
        estado:           almacen.estado            ?? 'activo',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [almacen]);

  const handleChange = (field: string, value: string | number | undefined) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = crearAlmacenSchema.parse(form);
      setIsSaving(true);
      
      const method = almacen ? 'PUT' : 'POST';
      const url = almacen
        ? `/api/admin/almacenes/${almacen.id}`
        : '/api/admin/almacenes';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error('Error al guardar');

      toast.success(almacen ? 'Almacén actualizado' : 'Almacén creado');
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const zodErrors: Record<string, string> = {};
        error.issues.forEach(err => {
          if (!zodErrors[String(err.path[0])]) zodErrors[String(err.path[0])] = err.message;
        });
        setErrors(zodErrors);
      } else {
        toast.error('Error al guardar almacén');
      }
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
              {almacen ? 'Editar Almacén' : 'Nuevo Almacén'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {almacen ? 'Actualiza los datos del centro de distribución' : 'Registra un nuevo depósito en el sistema'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del Almacén *</label>
            <Input
              value={form.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
              placeholder="Ej: Almacén Central Gamarra"
              className={errors.nombre ? 'border-red-400 focus:ring-red-400' : ''}
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección / Ubicación</label>
            <Input
              value={form.direccion}
              onChange={e => handleChange('direccion', e.target.value)}
              placeholder="Dirección exacta del local"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Capacidad Total</label>
              <Input
                type="number"
                value={form.capacidad_total ?? ''}
                onChange={e => handleChange('capacidad_total', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unidad</label>
              <select
                value={form.unidad_capacidad}
                onChange={e => handleChange('unidad_capacidad', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="unidades">Unidades</option>
                <option value="metros">Metros</option>
                <option value="kg">Kilogramos</option>
                <option value="m3">M³</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado Operativo</label>
            <select
              value={form.estado}
              onChange={e => handleChange('estado', e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="activo">Activo (Operativo)</option>
              <option value="inactivo">Inactivo (Cerrado)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notas Adicionales</label>
            <Textarea
              value={form.descripcion}
              onChange={e => handleChange('descripcion', e.target.value)}
              placeholder="Detalles sobre el acceso o tipo de mercancía..."
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white" disabled={isSaving}>
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</>
                : almacen ? 'Actualizar' : 'Crear Almacén'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
