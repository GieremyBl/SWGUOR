"use client";

import { useState } from "react";
import { Loader2, Pencil, Check, X, User, ArrowRight, Eye } from "lucide-react";
import { useSeguimientoConfeccion } from "@/lib/hooks/useSeguimientoConfeccion";
import { nombreResponsableSeguimiento } from "@/lib/helpers/seguimiento-confeccion-helpers";
import ConfeccionStepper, { ETAPA_LABELS_CONFECCION, EtapaConfeccion } from "./ConfeccionStepper";
import FormularioAvance from "./FormularioAvance";
import { registrarAvanceTaller } from "../actions";
import { toast } from "sonner";

const ETAPA_COLORS: Record<string, { pill: string; dot: string }> = {
  recepcion_cortes: { pill: "bg-slate-100   text-slate-700", dot: "bg-slate-400" },
  confeccion_y_remalle: { pill: "bg-blue-100    text-blue-700", dot: "bg-blue-500" },
  acabado_y_limpieza: { pill: "bg-amber-100   text-amber-700", dot: "bg-amber-500" },
  planchado_y_empaque: { pill: "bg-violet-100  text-violet-700", dot: "bg-violet-500" },
  entregado_a_guor: { pill: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

interface Props {
  confeccion: any;
  etapaActual: EtapaConfeccion;
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

  // Estados para el Modal de Avance y Lightbox
  const [etapaNuevaPendiente, setEtapaNuevaPendiente] = useState<EtapaConfeccion | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Helper para parsear la nota e imágenes
  const parsearNotaYEvidencias = (notasRaw: string) => {
    if (!notasRaw) return { texto: "", evidencias: [] as string[] };

    const token = "\n[EVIDENCIAS] ";
    if (notasRaw.includes(token)) {
      const partes = notasRaw.split(token);
      try {
        const evidencias = JSON.parse(partes[1]);
        return { texto: partes[0], evidencias: Array.isArray(evidencias) ? evidencias : [] };
      } catch (e) {
        return { texto: notasRaw, evidencias: [] };
      }
    }
    return { texto: notasRaw, evidencias: [] };
  };

  const handleSolicitarAvanceStepper = (nuevaEtapa: EtapaConfeccion) => {
    setEtapaNuevaPendiente(nuevaEtapa);
  };

  const handleConfirmarAvanceDesdeStepper = async (notasFormulario: string) => {
    if (!etapaNuevaPendiente) return;
    setIsMutationLoading(true);
    try {
      const res = await registrarAvanceTaller({
        confeccionId: confeccionId,
        etapaAnterior: etapaActual,
        etapaNueva: etapaNuevaPendiente,
        notas: notasFormulario,
        responsableId: "1",
        materialesRecibidos:
          etapaActual === 'recepcion_cortes' && etapaNuevaPendiente !== 'recepcion_cortes'
            ? { cortes: true, diseno: true, patronaje: true }
            : undefined,
      });

      if (res?.success) {
        toast.success("Progreso guardado en la bitácora.");
        if (onEtapaChanged) onEtapaChanged(etapaNuevaPendiente);
      } else {
        toast.error("Error al registrar avance en la base de datos.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de servidor al guardar el cambio.");
    } finally {
      setIsMutationLoading(false);
      setEtapaNuevaPendiente(null);
    }
  };

  const startEdit = (seg: any) => {
    setEditId(seg.id);
    const { texto } = parsearNotaYEvidencias(seg.notas || "");
    setEditNotas(texto);
  };

  const saveEdit = async (segId: string, notasOriginales: string) => {
    if (!editId) return;
    setIsMutationLoading(true);
    try {
      const token = "\n[EVIDENCIAS] ";
      let notaFinal = editNotas.trim();

      if (notasOriginales.includes(token)) {
        const partes = notasOriginales.split(token);
        notaFinal = `${notaFinal}${token}${partes[1]}`;
      }

      await actualizarNotas(segId, notaFinal);
      setEditId(null);
      toast.success("Nota de incidencia actualizada.");
    } catch (error) {
      toast.error("No se pudo modificar la nota.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STEPPER INTERACTIVO */}
      <ConfeccionStepper
        etapaActual={etapaActual}
        prendaNombre={confeccion.prenda}
        cantidadPrendas={confeccion.cantidad || 0}
        onCambiarEtapa={handleSolicitarAvanceStepper}
      />

      {/* 2. BITÁCORA DEL HISTORIAL */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="pb-4 border-b border-gray-100 mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Historial de Confección</h3>
            <p className="text-xs text-gray-400">Auditoría en tiempo real de los cambios de fase física en el taller externo</p>
          </div>
          {isMutationLoading && (
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--admin-accent))] font-medium">
              <Loader2 size={12} className="animate-spin" />
              Sincronizando...
            </div>
          )}
        </div>

        <div className="relative pl-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
              <Loader2 size={14} className="animate-spin text-pink-500" /> Cargando histórico...
            </div>
          ) : seguimientos.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No se registran movimientos previos para esta confección.</p>
          ) : (
            <ol className="relative border-l border-gray-100 space-y-6 list-none m-0 p-0">
              {seguimientos.map((seg: any) => {
                const { texto, evidencias } = parsearNotaYEvidencias(seg.notas || "");
                return (
                  <li key={seg.id} className="mb-2 ml-6 group relative">
                    <span className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${ETAPA_COLORS[seg.etapa_nueva]?.pill || "bg-gray-100"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${ETAPA_COLORS[seg.etapa_nueva]?.dot || "bg-gray-400"}`} />
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">
                          {ETAPA_LABELS_CONFECCION[seg.etapa_anterior as EtapaConfeccion]}
                        </span>
                        <ArrowRight size={10} className="text-gray-400" />
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ETAPA_COLORS[seg.etapa_nueva]?.pill}`}>
                          {ETAPA_LABELS_CONFECCION[seg.etapa_nueva as EtapaConfeccion]}
                        </span>
                      </div>
                      <time className="text-[10px] font-medium text-gray-400 tabular-nums">
                        {new Date(seg.created_at).toLocaleString()}
                      </time>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
                      <User size={11} className="text-gray-400" />
                      <span>{nombreResponsableSeguimiento(seg)}</span>
                    </div>

                    <div className="mt-2 rounded-xl bg-gray-50/50 border border-gray-100 p-3">
                      {editId === seg.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNotas}
                            onChange={(e) => setEditNotas(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--admin-accent)/0.2)]"
                            rows={2}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => saveEdit(seg.id, seg.notas || "")}
                              className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            {texto ? (
                              <p className="text-xs text-gray-600 leading-relaxed">
                                <span className="font-semibold text-gray-400">Nota técnica:</span> {texto}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Transición fluida sin incidencias en lote.</p>
                            )}

                            {puedeActualizar && (
                              <button
                                onClick={() => startEdit(seg)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all shrink-0"
                                title="Editar observaciones"
                              >
                                <Pencil size={11} />
                              </button>
                            )}
                          </div>

                          {/* Render Inline de las Evidencias Fotográficas */}
                          {evidencias.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {evidencias.map((url, i) => (
                                <div
                                  key={i}
                                  onClick={() => setLightboxImg(url)}
                                  className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden cursor-pointer group/img bg-slate-100"
                                >
                                  <img src={url} alt="Evidencia" className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                                    <Eye size={12} />
                                  </div>
                                </div>
                              ))}
                            </div>
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

      {/* MODAL DE FORMULARIO AVANCE INTEGRADO AL STEPPER */}
      {etapaNuevaPendiente && (
        <FormularioAvance
          isOpen={!!etapaNuevaPendiente}
          onClose={() => setEtapaNuevaPendiente(null)}
          confeccionId={confeccionId}
          etapaAnteriorLabel={ETAPA_LABELS_CONFECCION[etapaActual]}
          etapaNuevaLabel={ETAPA_LABELS_CONFECCION[etapaNuevaPendiente]}
          onConfirmar={handleConfirmarAvanceDesdeStepper}
        />
      )}

      {/* LIGHTBOX SIMPLE MODAL */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-1" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg} alt="Evidencia Full" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}