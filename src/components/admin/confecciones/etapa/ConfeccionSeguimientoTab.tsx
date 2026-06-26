"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Pencil, Check, X, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSeguimientoConfeccion } from "@/lib/hooks/useSeguimientoConfeccion";
import { nombreResponsableSeguimiento } from "@/lib/helpers/seguimiento-confeccion-helpers";
import ConfeccionStepper, { ETAPA_LABELS_CONFECCION, EtapaConfeccion } from "./ConfeccionStepper";
import { registrarAvanceTaller } from "../actions";
import { toast } from "sonner";

// MAPEO DE COLORES DE RELIEVE VISUAL PARA CADA ETAPA DE TU ENUM REAL
const ETAPA_COLORS: Record<string, { pill: string; dot: string }> = {
  recepcion_cortes: { pill: "bg-slate-100   text-slate-700", dot: "bg-slate-400" },
  confeccion_y_remalle: { pill: "bg-blue-100    text-blue-700", dot: "bg-blue-500" },
  acabado_y_limpieza: { pill: "bg-amber-100   text-amber-700", dot: "bg-amber-500" },
  planchado_y_empaque: { pill: "bg-violet-100  text-violet-700", dot: "bg-violet-500" },
  entregado_a_guor: { pill: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

interface Props {
  confeccion: any;
  etapaActual: EtapaConfeccion; // Forzamos el tipo estricto del Enum de Prisma
  puedeActualizar: boolean;
  onEtapaChanged?: (nuevaEtapa: EtapaConfeccion) => void;
}

export default function ConfeccionSeguimientoTab({
  confeccion,
  etapaActual,
  puedeActualizar,
  onEtapaChanged,
}: Props) {
  const confeccionId = confeccion.id.toString();
  const { seguimientos, isLoading, actualizarNotas } = useSeguimientoConfeccion(confeccionId);

  const [editId, setEditId] = useState<string | null>(null);
  const [editNotas, setEditNotas] = useState("");
  const [isMutationLoading, setIsMutationLoading] = useState(false);

  // Manejador del avance físico de etapas conectando el stepper con actions.ts
  const handleAvanzarEtapaTaller = async (nuevaEtapa: EtapaConfeccion) => {
    setIsMutationLoading(true);
    try {
      const res = await registrarAvanceTaller({
        confeccionId: confeccionId,
        etapaAnterior: etapaActual, 
        etapaNueva: nuevaEtapa,
        notas: `Cambio de fase de producción realizado desde el panel de control del taller.`,
        responsableId: "1",
        materialesRecibidos:
          etapaActual === 'recepcion_cortes' && nuevaEtapa !== 'recepcion_cortes'
            ? { cortes: true, diseno: true, patronaje: true }
            : undefined,
      });

      if (res?.success) {
        toast.success("Progreso guardado en la bitácora.");
        if (onEtapaChanged) onEtapaChanged(nuevaEtapa);
      } else {
        toast.error("Error al registrar avance físico en la base de datos.");
      }
    } catch (error) {
      console.error("Error al registrar avance físico:", error);
      toast.error("Error de servidor al guardar el cambio de etapa.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  const startEdit = (seg: any) => {
    setEditId(seg.id);
    setEditNotas(seg.notas || "");
  };

  const saveEdit = async () => {
    if (!editId) return;
    setIsMutationLoading(true);
    try {
      await actualizarNotas(editId, editNotas);
      setEditId(null);
      toast.success("Nota de incidencia actualizada correctamente.");
    } catch (error) {
      toast.error("No se pudo modificar la nota.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. CONTROLADOR GRÁFICO DE ETAPAS (STEPPER) EN LA CABECERA DE LA PESTAÑA */}
      <ConfeccionStepper
        etapaActual={etapaActual}
        prendaNombre={confeccion.prenda}
        cantidadPrendas={confeccion.cantidad || 0}
        onCambiarEtapa={handleAvanzarEtapaTaller}
      />

      {/* 2. BITÁCORA / LÍNEA DE TIEMPO DEL HISTORIAL DE PRODUCCIÓN */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="pb-4 border-b border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-gray-900">Historial de Confección</h3>
          <p className="text-xs text-gray-400">Auditoría en tiempo real de los cambios de fase física en el taller externo</p>
        </div>

        <div className="relative pl-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
              <Loader2 size={14} className="animate-spin text-pink-500" />
              Cargando histórico de transiciones...
            </div>
          ) : seguimientos.length === 0 ? (
            <div className="text-xs text-gray-400 italic py-4">
              La orden de confección se encuentra registrada pero aún no reporta ingresos a la línea de costura.
            </div>
          ) : (
            <ol className="relative border-l border-gray-200 space-y-6">
              {seguimientos.map((seg: any) => {
                const labelAnterior = ETAPA_LABELS_CONFECCION[seg.etapa_anterior as keyof typeof ETAPA_LABELS_CONFECCION] || "Inicio de Orden";
                const labelNuevo = ETAPA_LABELS_CONFECCION[seg.etapa_nuevo as keyof typeof ETAPA_LABELS_CONFECCION] || seg.etapa_nuevo;
                const dotColor = ETAPA_COLORS[seg.etapa_nuevo]?.dot ?? "bg-gray-300";

                return (
                  <li key={seg.id} className="mb-2 ml-6 group relative">
                    <span className={`absolute flex items-center justify-center w-3 h-3 rounded-full -left-[30px] top-1.5 ring-4 ring-white ${dotColor}`} />

                    <div className="bg-gray-50/60 hover:bg-gray-50 rounded-xl p-4 border border-gray-100 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">

                        {/* Flujo de cambio físico real */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-400 opacity-70">
                            {labelAnterior}
                          </span>
                          <ArrowRight size={12} className="text-gray-300" />
                          <span className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] ${ETAPA_COLORS[seg.etapa_nuevo]?.pill ?? "bg-gray-100 text-gray-700"}`}>
                            {labelNuevo}
                          </span>
                        </div>

                        {/* Marca de tiempo de la base de datos */}
                        <span className="text-[10px] text-gray-400 font-mono">
                          {seg.created_at ? new Date(seg.created_at).toLocaleString("es-PE", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                          }) : "—"}
                        </span>
                      </div>

                      {/* Operario / Responsable */}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
                        <User size={11} className="text-gray-400" />
                        <span className="font-medium text-gray-400">Registrado por:</span>
                        <span className="font-bold text-gray-600">
                          {nombreResponsableSeguimiento(seg.usuarios)}
                        </span>
                      </div>

                      {/* Editor / Visualizador de Notas */}
                      {editId === seg.id ? (
                        <div className="mt-3 space-y-2 max-w-md">
                          <Textarea
                            value={editNotas}
                            onChange={(e) => setEditNotas(e.target.value)}
                            className="min-h-[64px] text-xs resize-none"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} disabled={isMutationLoading} className="h-7 gap-1">
                              <Check className="w-3 h-3" /> Guardar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditId(null)} className="h-7 gap-1">
                              <X className="w-3 h-3" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : seg.notas ? (
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-start gap-1.5">
                          <MessageSquare size={11} className="text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-400">Nota técnica:</span> {seg.notas}
                          </p>
                          {puedeActualizar && (
                            <button
                              onClick={() => startEdit(seg)}
                              className="opacity-0 group-hover:opacity-100 ml-auto p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-gray-400 italic">Transición fluida sin incidencias en lote.</p>
                          {puedeActualizar && (
                            <button
                              onClick={() => startEdit(seg)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}