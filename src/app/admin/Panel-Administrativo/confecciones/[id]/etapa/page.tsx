"use client";

import { useState, useEffect } from "react";
import { 
  Scissors, 
  Shirt, 
  Sparkles, 
  Package, 
  CheckCircle, 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  User,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { ETAPA_LABELS_CONFECCION, ETAPAS_CONFECCION_ORDENADAS, EtapaConfeccion } from "@/components/admin/confecciones/etapa/ConfeccionStepper";
import FormularioAvance from "@/components/admin/confecciones/etapa/FormularioAvance";
import { obtenerFlujoTalleres, registrarAvanceTaller } from "@/components/admin/confecciones/actions";
import { toast } from "sonner";

const COLUMNAS_CONFIG: Record<EtapaConfeccion, { icon: any; color: string }> = {
  recepcion_cortes: { icon: Scissors, color: "border-t-slate-500 text-slate-600 bg-slate-50/50" },
  confeccion_y_remalle: { icon: Shirt, color: "border-t-blue-500 text-blue-600 bg-blue-50/30" },
  acabado_y_limpieza: { icon: Sparkles, color: "border-t-amber-500 text-amber-600 bg-amber-50/30" },
  planchado_y_empaque: { icon: Package, color: "border-t-violet-500 text-violet-600 bg-violet-50/30" },
  entregado_a_guor: { icon: CheckCircle, color: "border-t-emerald-500 text-emerald-600 bg-emerald-50/50" }
};

interface MovimientoPendiente {
  confeccion: any;
  etapaNueva: EtapaConfeccion;
}

export default function ConfeccionesEtapasPage() {
  const { hasRole, can } = usePermissions();
  const [confecciones, setConfecciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movimiento, setMovimiento] = useState<MovimientoPendiente | null>(null);

  const puedeActualizar =
    hasRole(["administrador", "gerente", "representante_taller"]) ||
    can("update_status", "confecciones");

  // Fetch real sincronizado con la Base de Datos vía Server Actions
  const cargarFlujoDeTalleres = async () => {
    setLoading(true);
    try {
      const res = await obtenerFlujoTalleres();
      if (res.success && res.data) {
        setConfecciones(res.data);
      } else {
        toast.error(res.error || "Error al sincronizar el flujo de producción.");
      }
    } catch (error) {
      toast.error("Error crítico de comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFlujoDeTalleres();
  }, []);

  const iniciarCambioEtapa = (confeccion: any, etapaNueva: EtapaConfeccion) => {
    if (!puedeActualizar) {
      toast.error("No dispones de los privilegios necesarios para alterar las etapas físicas del taller.");
      return;
    }
    setMovimiento({ confeccion, etapaNueva });
  };

  // Mutación optimista en el cliente integrada con tu base de datos por Prisma
  const handleConfirmarAvance = async (notas: string) => {
    if (!movimiento) return;
    const { confeccion, etapaNueva } = movimiento;

    const estadoPrevioGuardado = [...confecciones];

    // Transición optimista visual instantánea
    setConfecciones(prev =>
      prev.map(c => c.id === confeccion.id ? { ...c, etapa: etapaNueva } : c)
    );
    setMovimiento(null);

    try {
      const res = await registrarAvanceTaller({
        confeccionId: confeccion.id, // Ya es un string compatible
        etapaAnterior: confeccion.etapa,
        etapaNueva: etapaNueva,
        notas: notas || `Transición automática desde el Pipeline General de Talleres.`,
        responsableId: "1", // Reemplazar dinámicamente con el ID de la sesión del usuario conectado
        materialesRecibidos:
          confeccion.etapa === 'recepcion_cortes' && etapaNueva !== 'recepcion_cortes'
            ? { cortes: true, diseno: true, patronaje: true }
            : undefined,
      });

      if (res.success) {
        toast.success("Progreso y estado físico sincronizados.");
        } else {
        const errorMsg = "error" in res ? res.error : "Error desconocido en el taller";
        toast.error(errorMsg);
        }
    } catch (error: any) {
      console.error(error);
      toast.error(`No se pudo guardar: ${error.message || "Error interno"}. Revirtiendo cambios.`);
      setConfecciones(estadoPrevioGuardado); // Rollback automático ante fallas
    }
  };

  const getPrioridadEstilo = (p: string) => {
    const prioridad = p.toLowerCase();
    if (prioridad === "urgente") return "bg-red-100 text-red-800 border-red-200";
    if (prioridad === "alta") return "bg-orange-100 text-orange-800 border-orange-200";
    if (prioridad === "media") return "bg-sky-100 text-sky-800 border-sky-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/admin/Panel-Administrative/confecciones"
              className="inline-flex items-center gap-1.5 text-pink-600 hover:text-pink-700 text-xs font-black uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={14} className="stroke-[3]" />
              Volver a Lista
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-600 text-white rounded-xl shadow-md">
                <Layers size={20} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Pipeline General de Confección
                </h1>
                <p className="text-xs text-slate-400">
                  Monitoreo en tiempo real de la carga física en base de datos por taller externo
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={cargarFlujoDeTalleres}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sincronizar Flujo
          </button>
        </div>

        {/* KANBAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {ETAPAS_CONFECCION_ORDENADAS.map((etapaId, idx) => {
            const config = COLUMNAS_CONFIG[etapaId];
            const ColumnIcon = config.icon;
            const itemsEnEtapa = confecciones.filter((c) => c.etapa === etapaId);
            const totalUnidades = itemsEnEtapa.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

            const siguienteEtapaAsignable = idx < ETAPAS_CONFECCION_ORDENADAS.length - 1 
              ? ETAPAS_CONFECCION_ORDENADAS[idx + 1] 
              : null;

            return (
              <div 
                key={etapaId} 
                className="rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col max-h-[75vh] min-w-[280px]"
              >
                <div className={`p-4 border-t-4 ${config.color} border-b border-slate-100 rounded-t-2xl flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <ColumnIcon size={16} />
                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 truncate max-w-[150px]">
                      {ETAPA_LABELS_CONFECCION[etapaId]}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 font-mono">
                    {itemsEnEtapa.length}
                  </span>
                </div>

                {itemsEnEtapa.length > 0 && (
                  <div className="bg-slate-50/70 px-4 py-1.5 border-b border-slate-100 flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Carga total:</span>
                    <span className="font-bold text-slate-600">{totalUnidades.toLocaleString("es-PE")} unds.</span>
                  </div>
                )}

                <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[180px] bg-slate-50/40">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                      <RefreshCw size={16} className="animate-spin mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Cargando base de datos...</span>
                    </div>
                  ) : itemsEnEtapa.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-xl bg-white/50">
                      <AlertCircle size={16} className="text-slate-300 mb-1" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sin Órdenes</p>
                    </div>
                  ) : (
                    itemsEnEtapa.map((confeccion) => (
                      <div
                        key={confeccion.id}
                        className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group relative space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            #{confeccion.id}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getPrioridadEstilo(confeccion.prioridad)}`}>
                            {confeccion.prioridad}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-xs text-gray-900 leading-snug group-hover:text-pink-600 transition-colors">
                            {confeccion.prenda}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Volumen: <span className="font-bold text-slate-700">{confeccion.cantidad} uds.</span>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 truncate text-slate-400 max-w-[140px]">
                            <User size={12} className="shrink-0 text-slate-300" />
                            <span className="truncate font-semibold text-slate-500">{confeccion.taller}</span>
                          </div>

                          {puedeActualizar && siguienteEtapaAsignable && (
                            <button
                              onClick={() => iniciarCambioEtapa(confeccion, siguienteEtapaAsignable)}
                              className="flex items-center gap-0.5 rounded-md bg-pink-50 border border-pink-100 px-2 py-0.5 font-bold uppercase tracking-wider text-pink-600 hover:bg-pink-600 hover:text-white transition-all text-[9px]"
                              title={`Avanzar a ${ETAPA_LABELS_CONFECCION[siguienteEtapaAsignable]}`}
                            >
                              Avanzar
                              <ArrowRight size={10} />
                            </button>
                          )}
                        </div>

                        <Link
                          href={`/admin/Panel-Administrative/confecciones/${confeccion.id}`}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center justify-center p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-pink-600 hover:bg-white shadow-sm transition-all"
                        >
                          <ExternalLink size={11} />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE INCIDENCIAS */}
      {movimiento && (
        <FormularioAvance
          isOpen={!!movimiento}
          onClose={() => setMovimiento(null)}
          etapaAnteriorLabel={ETAPA_LABELS_CONFECCION[movimiento.confeccion.etapa as EtapaConfeccion]}
          etapaNuevaLabel={ETAPA_LABELS_CONFECCION[movimiento.etapaNueva]}
          onConfirmar={handleConfirmarAvance}
        />
      )}
    </div>
  );
}