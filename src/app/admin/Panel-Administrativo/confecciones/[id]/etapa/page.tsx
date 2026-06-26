"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Layers, Eye, User, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useSeguimientoConfeccion } from "@/lib/hooks/useSeguimientoConfeccion";
import { nombreResponsableSeguimiento } from "@/lib/helpers/seguimiento-confeccion-helpers";

import ConfeccionStepper, {
  ETAPA_LABELS_CONFECCION,
  EtapaConfeccion
} from "@/components/admin/confecciones/etapa/ConfeccionStepper";
import FormularioAvance from "@/components/admin/confecciones/etapa/FormularioAvance";
import { obtenerFlujoTalleres, registrarAvanceTaller } from "@/components/admin/confecciones/actions";
import { toast } from "sonner";

// MAPEO DE COLORES DE RELIEVE VISUAL PARA EL HISTORIAL DE SEGUIMIENTO
const ETAPA_COLORS: Record<string, { pill: string; dot: string }> = {
  recepcion_cortes: { pill: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  confeccion_y_remalle: { pill: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  acabado_y_limpieza: { pill: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  planchado_y_empaque: { pill: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  entregado_a_guor: { pill: "bg-green-100 text-green-700", dot: "bg-green-500" },
};

export default function EtapaIndividualPage() {
  const params = useParams();
  const router = useRouter();
  const idLote = params?.id as string;

  const { role } = usePermissions();
  const puedeActualizar = role === "administrador" || role === "gerente" || role === "representante_taller";

  // CORRECCIÓN 1 Y 2: Desestructuración con nombres reales del hook e idLote como string directo
  const { seguimientos, isLoading: loadingHistorial, refetch: refetchHistorial } = useSeguimientoConfeccion(idLote);

  const [confeccion, setConfeccion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [etapaNuevaPendiente, setEtapaNuevaPendiente] = useState<EtapaConfeccion | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const cargarDatosLote = async () => {
    if (!idLote) return;
    setLoading(true);
    try {
      const res = await obtenerFlujoTalleres();
      if (res.success && res.data) {
        const loteEspecifico = res.data.find((c: any) => c.id.toString() === idLote);
        if (loteEspecifico) {
          setConfeccion(loteEspecifico);
        } else {
          toast.error("No se encontró el lote especificado.");
          router.push("/admin/Panel-Administrative/confecciones");
        }
      } else {
        toast.error("Error al sincronizar con el servidor.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error crítico de comunicación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosLote();
  }, [idLote]);

  const handleIniciarCambioEtapa = (nuevaEtapa: EtapaConfeccion) => {
    if (!puedeActualizar) {
      toast.error("Tu rol no cuenta con permisos de modificación.");
      return;
    }
    setEtapaNuevaPendiente(nuevaEtapa);
  };

  const handleConfirmarAvanceBicatora = async (notasFormulario: string) => {
    if (!confeccion || !etapaNuevaPendiente) return;

    try {
      const res = await registrarAvanceTaller({
        confeccionId: confeccion.id,
        etapaAnterior: confeccion.etapa,
        etapaNueva: etapaNuevaPendiente,
        notas: notasFormulario,
        responsableId: "1",
        materialesRecibidos:
          confeccion.etapa === "recepcion_cortes" && etapaNuevaPendiente !== "recepcion_cortes"
            ? { cortes: true, diseno: true, patronaje: true }
            : undefined,
      });

      if (res?.success) {
        toast.success(`Fase actualizada a: ${ETAPA_LABELS_CONFECCION[etapaNuevaPendiente]}`);
        setEtapaNuevaPendiente(null);
        await cargarDatosLote();
        await refetchHistorial();
      } else {
        toast.error("El servidor rechazó el cambio de estado.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de red al procesar el formulario.");
    }
  };

  // Helper para procesar las evidencias adjuntas dentro de las notas del historial
  const parseEvidencias = (notas: string | null): { comentario: string; urls: string[] } => {
    if (!notas) return { comentario: "", urls: [] };
    const marker = "\n[EVIDENCIAS] ";
    const index = notas.indexOf(marker);
    if (index === -1) return { comentario: notas, urls: [] };

    const comentario = notas.substring(0, index);
    const jsonStr = notas.substring(index + marker.length);
    try {
      const urls = JSON.parse(jsonStr);
      return { comentario, urls: Array.isArray(urls) ? urls : [] };
    } catch (e) {
      return { comentario: notas, urls: [] };
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/Panel-Administrative/confecciones`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-[var(--guor-dark)] tracking-tight">
              Control de Fase Física — Lote #{idLote}
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
              <Layers size={12} /> Gestión interactiva del estado secuencial de producción
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            await cargarDatosLote();
            await refetchHistorial();
          }}
          disabled={loading || loadingHistorial}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={loading || loadingHistorial ? "animate-spin text-pink-500" : ""} />
          Sincronizar Lote
        </button>
      </div>

      {/* Bloque 1: El Stepper */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-pink-500" />
            <p className="text-sm font-medium">Buscando datos del taller...</p>
          </div>
        ) : confeccion ? (
          <ConfeccionStepper
            etapaActual={confeccion.etapa}
            prendaNombre={confeccion.prenda}
            cantidadPrendas={confeccion.cantidad}
            onCambiarEtapa={handleIniciarCambioEtapa}
          />
        ) : (
          <div className="text-center py-12 text-sm text-slate-400 italic">
            No se pudo mapear la información del lote.
          </div>
        )}
      </div>

      {/* Bloque 2: Formulario incrustado inline abajo del Stepper */}
      {etapaNuevaPendiente && confeccion && (
        <FormularioAvance
          isOpen={true}
          onClose={() => setEtapaNuevaPendiente(null)}
          confeccionId={confeccion.id.toString()}
          etapaAnteriorLabel={ETAPA_LABELS_CONFECCION[confeccion.etapa as EtapaConfeccion]}
          etapaNuevaLabel={ETAPA_LABELS_CONFECCION[etapaNuevaPendiente]}
          onConfirmar={handleConfirmarAvanceBicatora}
        />
      )}

      {/* Bloque 3: Historial de Transiciones y Bitácora de Evidencias */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black text-[var(--guor-dark)] uppercase tracking-tight mb-6 flex items-center gap-2">
          <MessageSquare size={16} className="text-pink-500" />
          Historial de Movimientos y Evidencias Técnicas
        </h3>

        {loadingHistorial ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-xs">
            <RefreshCw size={16} className="animate-spin" /> Cargando bitácora...
          </div>
        ) : !seguimientos || seguimientos.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Este lote no registra transiciones en el taller todavía.
          </p>
        ) : (
          <div className="relative border-l border-slate-100 ml-3 pl-6 space-y-6">
            {/* CORRECCIÓN 4: Tipado explícito 'any' (o el tipo nativo de tu fila) para el parámetro 'seg' */}
            {seguimientos.map((seg: any) => {
              const { comentario, urls } = parseEvidencias(seg.notas);
              const colorConfigAnterior = ETAPA_COLORS[seg.etapa_anterior] || { pill: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };
              const colorConfigNueva = ETAPA_COLORS[seg.etapa_nueva] || { pill: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };

              return (
                <div key={seg.id} className="relative group">
                  {/* Nodo conector */}
                  <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-4 border-white shadow-sm ${colorConfigNueva.dot}`} />

                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/80 hover:bg-white hover:shadow-sm transition-all">
                    {/* Encabezado del item */}
                    <div className="flex flex-wrap items-center gap-2 justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${colorConfigAnterior.pill}`}>
                          {ETAPA_LABELS_CONFECCION[seg.etapa_anterior as EtapaConfeccion] || seg.etapa_anterior}
                        </span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${colorConfigNueva.pill}`}>
                          {ETAPA_LABELS_CONFECCION[seg.etapa_nueva as EtapaConfeccion] || seg.etapa_nueva}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {nombreResponsableSeguimiento(seg)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(seg.created_at).toLocaleString("es-PE")}
                        </span>
                      </div>
                    </div>

                    {/* Notas técnicas */}
                    {comentario ? (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                        <span className="font-bold text-slate-400 block mb-0.5 text-[10px] uppercase tracking-wider">Observaciones:</span>
                        {comentario}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Transición fluida sin comentarios en lote.</p>
                    )}

                    {/* Galería de Evidencias Inline */}
                    {urls.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Evidencias Adjuntas:</span>
                        <div className="grid grid-cols-5 gap-2.5">
                          {urls.map((url: string, i: number) => (
                            <div
                              key={i}
                              onClick={() => setLightboxImg(url)}
                              className="group/thumb relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm cursor-zoom-in"
                            >
                              <img src={url} alt={`Evidencia ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye size={14} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL LIGHTBOX PARA IMÁGENES COMPLETA */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-1" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg} alt="Evidencia Full" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}