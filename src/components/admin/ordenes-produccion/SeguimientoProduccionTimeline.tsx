'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  GitCommitVertical,
  User,
  Clock,
  Pencil,
  Check,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ETAPAS_PRODUCCION, ETAPA_LABELS } from '@/lib/schemas/ordenes-produccion';
import { useSeguimientoProduccion } from '@/lib/hooks/useSeguimientoProduccion';
import {
  etapaActualDesdeSeguimiento,
  nombreUsuarioSeguimiento,
} from '@/lib/helpers/seguimiento-produccion-helpers';
import type { SeguimientoProduccionRow } from '@/lib/schemas/seguimiento-produccion';

interface Props {
  ordenId: string;
  etapaOrden?: string | null;
  canEdit?: boolean;
  compact?: boolean;
}

export default function SeguimientoProduccionTimeline({
  ordenId,
  etapaOrden,
  canEdit = true,
  compact = false,
}: Props) {
  const {
    seguimientos,
    isLoading,
    registrarEtapa,
    actualizarObservaciones,
    isRegistrando,
    isActualizando,
  } = useSeguimientoProduccion(ordenId);

  const [showForm, setShowForm] = useState(false);
  const [nuevaEtapa, setNuevaEtapa] = useState('');
  const [nuevasObs, setNuevasObs] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editObs, setEditObs] = useState('');

  const etapaActual = etapaActualDesdeSeguimiento(seguimientos, etapaOrden);

  const handleRegistrar = async () => {
    if (!nuevaEtapa) return;
    const res = await registrarEtapa({
      etapa: nuevaEtapa as typeof ETAPAS_PRODUCCION[number],
      observaciones: nuevasObs || `Avance manual a: ${ETAPA_LABELS[nuevaEtapa as keyof typeof ETAPA_LABELS]}`,
    });
    if (res?.success) {
      setShowForm(false);
      setNuevaEtapa('');
      setNuevasObs('');
    }
  };

  const startEdit = (row: SeguimientoProduccionRow) => {
    setEditId(String(row.id));
    setEditObs(row.observaciones ?? '');
  };

  const saveEdit = async () => {
    if (!editId) return;
    const res = await actualizarObservaciones(editId, editObs || null);
    if (res?.success) {
      setEditId(null);
      setEditObs('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-medium">Cargando seguimiento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GitCommitVertical className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">
            {seguimientos.length} {seguimientos.length === 1 ? 'hito' : 'hitos'}
          </span>
          {!compact && (
            <span className="text-[10px] font-mono bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
              Etapa: {ETAPA_LABELS[etapaActual as keyof typeof ETAPA_LABELS] ?? etapaActual}
            </span>
          )}
        </div>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-8 gap-1.5 text-xs font-bold"
          >
            <Plus className={`w-3.5 h-3.5 transition-transform ${showForm ? 'rotate-45' : ''}`} />
            {showForm ? 'Cancelar' : 'Registrar etapa'}
          </Button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 space-y-3">
          <Select value={nuevaEtapa} onValueChange={setNuevaEtapa}>
            <SelectTrigger className="h-10 bg-white">
              <SelectValue placeholder="Seleccionar etapa" />
            </SelectTrigger>
            <SelectContent>
              {ETAPAS_PRODUCCION.map((e) => (
                <SelectItem key={e} value={e}>
                  {ETAPA_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Observaciones (opcional)"
            value={nuevasObs}
            onChange={(e) => setNuevasObs(e.target.value)}
            className="bg-white min-h-[72px] resize-none"
          />
          <Button
            onClick={handleRegistrar}
            disabled={!nuevaEtapa || isRegistrando}
            className="w-full bg-rose-600 hover:bg-rose-700 h-9"
          >
            {isRegistrando ? 'Registrando...' : 'Confirmar avance'}
          </Button>
        </div>
      )}

      {seguimientos.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">
          Sin registros de seguimiento.
        </p>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-100">
          {seguimientos.map((event, idx) => {
            const isLatest = idx === 0;
            const isEditing = editId === String(event.id);

            return (
              <div key={String(event.id)} className="relative space-y-1.5">
                <div
                  className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                    event.activo
                      ? 'bg-rose-600 ring-4 ring-rose-50'
                      : isLatest
                        ? 'bg-rose-400'
                        : 'bg-slate-300'
                  }`}
                />

                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-black uppercase tracking-tight ${
                          event.activo ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {ETAPA_LABELS[event.etapa as keyof typeof ETAPA_LABELS] || event.etapa}
                      </span>
                      {event.activo && (
                        <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">
                          Activa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {nombreUsuarioSeguimiento(event.usuarios)}
                      </span>
                      <span>
                        {format(new Date(event.created_at), "dd LLL yyyy, HH:mm", { locale: es })}
                      </span>
                      {event.duracion_minutos != null && !event.activo && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.duracion_minutos} min
                        </span>
                      )}
                    </div>
                  </div>
                  {canEdit && !isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-slate-400 hover:text-rose-600"
                      onClick={() => startEdit(event)}
                      disabled={isActualizando}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      value={editObs}
                      onChange={(e) => setEditObs(e.target.value)}
                      className="min-h-[64px] text-xs resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={isActualizando} className="h-7 gap-1">
                        <Check className="w-3 h-3" /> Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditId(null)}
                        className="h-7 gap-1"
                      >
                        <X className="w-3 h-3" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-snug">
                    {event.observaciones || 'Sin observaciones registradas.'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
