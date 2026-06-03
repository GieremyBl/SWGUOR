'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { PersonalRow } from '@/lib/services/personal-interno.service';
import { type Cargo } from '@prisma/client';

const CARGOS: { value: Cargo; label: string }[] = [
  { value: 'gerente', label: 'Gerente' },
  { value: 'administrador', label: 'Administrador' },
  { value: 'disenador', label: 'Diseñador' },
  { value: 'cortador', label: 'Cortador' },
  { value: 'representante_taller', label: 'Rep. de Taller' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'ayudante', label: 'Ayudante' },
  { value: 'almacenero', label: 'Almacenero' },
];

// ── Types ─────────────────────────────────────────────────────

interface UsuarioOption {
  id: string;
  email: string;
  rol: string;
}

interface FormState {
  nombre_completo: string;
  cargo: Cargo | '';
  dni: string;
  telefono: string;
  fecha_ingreso: string;
  usuario_id: string;
}

interface Props {
  personal: PersonalRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────

export default function PersonalFormModal({ personal, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  
  // Solución al Error eslint: Nace en true si vamos a crear, evitando el setState síncrono inicial
  const [loadingUsuarios, setLoadingUsuarios] = useState(!personal);

  const initialFecha = () => {
    if (!personal?.fecha_ingreso) return '';
    try {
      const d = new Date(personal.fecha_ingreso);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [form, setForm] = useState<FormState>({
    nombre_completo: personal?.nombre_completo ?? '',
    cargo: (personal?.cargo as Cargo) ?? '',
    dni: personal?.dni ? String(personal.dni) : '',
    telefono: personal?.telefono ? String(personal.telefono) : '',
    fecha_ingreso: initialFecha(),
    usuario_id: '',
  });

  // Carga usuarios disponibles solo en modo creación
  useEffect(() => {
    if (personal) return;
    let isMounted = true;
    
    fetch('/api/admin/usuarios')
      .then((r) => r.json())
      .then(({ data }) => {
        if (isMounted) setUsuarios(data ?? []);
      })
      .catch(() => toast.error('No se pudieron cargar los usuarios'))
      .finally(() => {
        if (isMounted) setLoadingUsuarios(false);
      });

    return () => {
      isMounted = false;
    };
  }, [personal]);

  const handleChange = (field: keyof FormState, value: string) => {
    let v = value;
    if (field === 'nombre_completo') v = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (field === 'dni' || field === 'telefono') v = value.replace(/\D/g, '');
    
    setForm((prev) => ({ ...prev, [field]: v }));
    setErrors((prev) => { 
      const c = { ...prev }; 
      delete c[field]; 
      return c; 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.nombre_completo.trim()) newErrors.nombre_completo = 'Requerido';
    if (!form.cargo) newErrors.cargo = 'Requerido';
    if (form.dni && form.dni.length !== 8) newErrors.dni = 'Debe tener 8 dígitos';
    if (!personal && !form.usuario_id) newErrors.usuario_id = 'Requerido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (personal) {
        // ── Edición ──────────────────────────────────────────
        const res = await fetch(`/api/admin/personal/${personal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_completo: form.nombre_completo.trim(),
            cargo: form.cargo || undefined,
            dni: form.dni ? Number(form.dni) : undefined,
            telefono: form.telefono ? Number(form.telefono) : undefined,
            fecha_ingreso: form.fecha_ingreso || undefined,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Error al actualizar');
        toast.success('Perfil actualizado correctamente');
      } else {
        // ── Creación ─────────────────────────────────────────
        const res = await fetch('/api/admin/personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: form.usuario_id,
            nombre_completo: form.nombre_completo.trim(),
            cargo: form.cargo,
            ...(form.dni && { dni: Number(form.dni) }),
            ...(form.telefono && { telefono: Number(form.telefono) }),
            ...(form.fecha_ingreso && { fecha_ingreso: form.fecha_ingreso }),
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message ?? 'Error al crear el personal');
        toast.success('Perfil corporativo generado correctamente');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  const usuarioSeleccionado = usuarios.find((u) => u.id === form.usuario_id) ?? null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {personal ? 'Editar Colaborador' : 'Nuevo Colaborador'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {personal
                ? 'Actualiza los datos de identidad corporativa'
                : 'Registra un nuevo talento vinculando su usuario de acceso'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── Identidad y Contratación ────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Identidad y Contratación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nombre Completo *
                </label>
                <Input
                  value={form.nombre_completo}
                  onChange={(e) => handleChange('nombre_completo', e.target.value)}
                  placeholder="Ej. Carlos Mamani"
                  className={errors.nombre_completo ? 'border-red-400' : ''}
                />
                {errors.nombre_completo && (
                  <p className="text-xs text-red-500 mt-1">{errors.nombre_completo}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">DNI</label>
                <Input
                  value={form.dni}
                  onChange={(e) => handleChange('dni', e.target.value)}
                  placeholder="8 dígitos"
                  maxLength={8}
                  className={errors.dni ? 'border-red-400' : ''}
                />
                {errors.dni && <p className="text-xs text-red-500 mt-1">{errors.dni}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono</label>
                <Input
                  value={form.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="Número de celular"
                  maxLength={9}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cargo *</label>
                <select
                  value={form.cargo}
                  onChange={(e) => handleChange('cargo', e.target.value)}
                  className={`w-full h-10 px-3 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.cargo ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {CARGOS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.cargo && <p className="text-xs text-red-500 mt-1">{errors.cargo}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Fecha de Ingreso
                </label>
                <Input
                  type="date"
                  value={form.fecha_ingreso}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── Vincular Usuario — solo en creación ────────── */}
          {!personal && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Vincular Usuario
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Usuario de Acceso *
                </label>
                <select
                  value={form.usuario_id}
                  onChange={(e) => handleChange('usuario_id', e.target.value)}
                  disabled={loadingUsuarios}
                  className={`w-full h-10 px-3 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 ${
                    errors.usuario_id ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <option value="">
                    {loadingUsuarios ? 'Cargando usuarios...' : 'Seleccionar usuario...'}
                  </option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email} — {u.rol}
                    </option>
                  ))}
                </select>
                {errors.usuario_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.usuario_id}</p>
                )}
              </div>

              {/* Chip informativo del usuario seleccionado */}
              {usuarioSeleccionado && (
                <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {usuarioSeleccionado.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-800">{usuarioSeleccionado.email}</p>
                    <p className="text-[11px] text-teal-600 capitalize">{usuarioSeleccionado.rol}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Aviso en edición ────────────────────────────── */}
          {personal && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">
                La suspensión de acceso o cambio de rol se gestionan desde el panel de Usuarios.
              </p>
            </div>
          )}

          {/* ── Acciones ─────────────────────────────────────── */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : personal ? (
                'Actualizar Perfil'
              ) : (
                'Generar Perfil'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}