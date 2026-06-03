'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { crearAlmacenSchema, type CrearAlmacen as AlmacenInput } from '@/lib/schemas/almacenes';
import type { Almacen } from '@/components/admin/almacenes/AlmacenesTable';

interface AlmacenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AlmacenInput) => void;
  almacen?: Almacen | null;
}

export default function AlmacenDialog({
  open,
  onOpenChange,
  onSave,
  almacen,
}: AlmacenDialogProps) {
  const [formData, setFormData] = useState<Partial<AlmacenInput>>({
    nombre: '',
    descripcion: '',
    direccion: '',
    capacidad_total: undefined,
    unidad_capacidad: 'unidades',
    estado: 'activo',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (almacen) {
      setFormData({
        nombre: almacen.nombre,
        descripcion: almacen.descripcion || '',
        direccion: almacen.direccion || '',
        capacidad_total: almacen.capacidad_total ? Number(almacen.capacidad_total) : undefined,
        unidad_capacidad: almacen.unidad_capacidad || 'unidades',
        estado: almacen.estado,
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        direccion: '',
        capacidad_total: undefined,
        unidad_capacidad: 'unidades',
        estado: 'activo',
      });
    }
    setErrors({});
  }, [almacen, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = crearAlmacenSchema.parse(formData);
      onSave(validated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const zodErrors: Record<string, string> = {};
        error.issues.forEach((err: any) => {
          zodErrors[err.path[0]] = err.message;
        });
        setErrors(zodErrors);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#d4af37]">
              {almacen ? 'Editar Almacén' : 'Nuevo Almacén'}
            </DialogTitle>
            <p className="text-slate-400 text-sm mt-1">
              {almacen ? 'Actualiza los datos del centro de distribución' : 'Registra un nuevo depósito en el sistema'}
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre del Almacén</Label>
              <Input
                id="nombre"
                placeholder="Ej: Almacén Central Gamarra"
                className="rounded-xl border-slate-200 focus:ring-pink-500 h-11"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
              {errors.nombre && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.nombre}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="direccion" className="text-xs font-bold uppercase tracking-wider text-slate-500">Dirección / Ubicación</Label>
              <Input
                id="direccion"
                placeholder="Dirección exacta del local"
                className="rounded-xl border-slate-200 focus:ring-pink-500 h-11"
                value={formData.direccion || ''}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacidad_total" className="text-xs font-bold uppercase tracking-wider text-slate-500">Capacidad Total</Label>
                <Input
                  id="capacidad_total"
                  type="number"
                  placeholder="0.00"
                  className="rounded-xl border-slate-200 focus:ring-pink-500 h-11"
                  value={formData.capacidad_total || ''}
                  onChange={(e) => setFormData({ ...formData, capacidad_total: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidad_capacidad" className="text-xs font-bold uppercase tracking-wider text-slate-500">Unidad</Label>
                <Select
                  value={formData.unidad_capacidad}
                  onValueChange={(value) => setFormData({ ...formData, unidad_capacidad: value })}
                >
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="metros">Metros</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="m3">M3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion" className="text-xs font-bold uppercase tracking-wider text-slate-500">Notas Adicionales</Label>
              <Textarea
                id="descripcion"
                placeholder="Detalles sobre el acceso o tipo de mercancía..."
                className="rounded-xl border-slate-200 focus:ring-pink-500 min-h-[80px]"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estado" className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado Operativo</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="activo">Activo (Operativo)</SelectItem>
                  <SelectItem value="inactivo">Inactivo (Cerrado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-11 px-8 font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-lg active:scale-95 transition-all"
            >
              {almacen ? 'Guardar Cambios' : 'Crear Almacén'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}