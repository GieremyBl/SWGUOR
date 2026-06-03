'use client';

import { useState, useEffect, useRef } from 'react';
import { Factory, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getSupabaseBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Taller } from './TalleresTable'; // Importación limpia de la estructura compartida

// ─────────────────────────────────────────────────────────────
// SUSPEND MODAL
// ─────────────────────────────────────────────────────────────

interface SuspendProps {
  taller:    Taller;
  onClose:   () => void;
  onSuccess: () => void;
}

export function TallerSuspendModal({ taller, onClose, onSuccess }: SuspendProps) {
  const [isSuspending, setIsSuspending] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSuspend = async () => {
    if (!taller?.id) return;
    setIsSuspending(true);
    
    try {
      const { error } = await supabase
        .from('talleres')
        .update({ estado: 'suspendido' })
        .eq('id', Number(taller.id));

      if (error) throw error;
      
      toast.success(`Taller "${taller.nombre}" suspendido correctamente`);
      
      if (isMountedRef.current) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      // FIX (error: any): Tipado estricto para el manejo de excepciones de Supabase
      const msg = err instanceof Error ? err.message : 'No se pudo suspender el taller en este momento.';
      toast.error(msg);
    } finally {
      if (isMountedRef.current) {
        setIsSuspending(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Suspender Taller</h3>
        <p className="text-sm text-gray-500 mt-2">
          ¿Estás seguro de suspender a{' '}
          <span className="font-semibold text-gray-900">{taller?.nombre}</span>?
          Esta acción evitará que el taller reciba nuevas órdenes.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isSuspending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSuspend}
            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white"
            disabled={isSuspending}
          >
            {isSuspending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Suspendiendo...
              </span>
            ) : (
              'Suspender'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  activo:     'Activo',
  inactivo:   'Inactivo',
  suspendido: 'Suspendido',
};

// Extendemos la interfaz base agregando la propiedad opcional de auditoría nativa de la BD
interface TallerDetail extends Taller {
  contacto?:   string | null;
  email?:      string | null;
  created_at?: string | null;
}

interface DetailProps {
  taller:  TallerDetail;
  onClose: () => void;
}

export function TallerDetailModal({ taller, onClose }: DetailProps) {
  // FIX: Se mapea una propiedad "preventCapitalize" para evitar romper la estética de correos y RUCs
  const fields = [
    { label: 'RUC',          value: taller.ruc,          preventCapitalize: true },
    { label: 'Nombre',       value: taller.nombre,       preventCapitalize: false },
    { label: 'Contacto',     value: taller.contacto,     preventCapitalize: false },
    { label: 'Teléfono',     value: taller.telefono,     preventCapitalize: true },
    { label: 'Email',        value: taller.email,        preventCapitalize: true },
    { label: 'Dirección',    value: taller.direccion,    preventCapitalize: false },
    { label: 'Especialidad', value: taller.especialidad, preventCapitalize: false },
    { label: 'Estado',       value: STATUS_MAP[taller.estado?.toLowerCase()] ?? taller.estado, preventCapitalize: false },
  ];

  const createdAt = taller.created_at
    ? new Date(taller.created_at).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-xl">
              <Factory className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{taller.nombre}</h3>
              <p className="text-xs text-gray-500 font-mono">RUC: {taller.ruc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-3">
          {fields.map(f => (
            <div key={f.label} className="flex justify-between items-center py-2 border-b last:border-0 gap-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">{f.label}</span>
              <span className={`text-sm font-medium text-gray-900 text-right break-words max-w-[70%] ${
                f.preventCapitalize ? 'normal-case' : 'capitalize'
              }`}>
                {f.value || '—'}
              </span>
            </div>
          ))}
          {createdAt && (
            <p className="text-[11px] text-gray-400 font-medium pt-2 text-left">Registrado el {createdAt}</p>
          )}
        </div>
      </div>
    </div>
  );
}