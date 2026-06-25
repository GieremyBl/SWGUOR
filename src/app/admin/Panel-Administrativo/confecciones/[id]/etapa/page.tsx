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
import { registrarAvanceTaller } from "@/components/admin/confecciones/actions";
import { toast } from "sonner";

// Configuración de estilos y layouts para cada columna según el Enum de PostgreSQL
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

  // Estado para controlar la apertura del FormularioAvance compartido
  const [movimiento, setMovimiento] = useState<MovimientoPendiente | null>(null);

  const puedeActualizar =
    hasRole(["administrador", "gerente", "representante_taller"]) ||
    can("update_status", "confecciones");

  // Fetch inicial sincronizado con el backend
  const cargarFlujoDeTalleres = async () => {
    setLoading(true);
    try {
      // Reemplazar por tu llamada real (ej. Supabase o API route)
      // select id, prenda, cantidad, prioridad, etapa, taller, responsable from confecciones
      const respuestaMock = [
        { id: 1044, prenda: "Polos Camiseros Pima", cantidad: 450, prioridad: "urgente", etapa: "recepcion_cortes", taller: "Taller Hermanos Castro" },
        { id: 1045, prenda: "Poleras Oversize Mockup", cantidad: 200, prioridad: "alta", etapa: "confeccion_y_remalle", taller: "Maquila Textil Sur" },
        { id: 1042, prenda: "Pantalones Cargo Drill", cantidad: 150, prioridad: "media", etapa: "acabado_y_limpieza", taller: "Taller Hermanos Castro" },
        { id: 1039, prenda: "Casacas Impermeables", cantidad: 300, prioridad: "baja", etapa: "entregado_a_guor", taller: "Confecciones Alianza" },
      ];
      setConfecciones(respuestaMock);
    } catch (error) {
      toast.error("Error al sincronizar el flujo de producción.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFlujoDeTalleres();
  }, []);

  // Prepara el cambio de etapa abriendo el FormularioAvance
  const iniciarCambioEtapa = (confeccion: any, etapaNueva: EtapaConfeccion) => {
    setMovimiento({ confeccion, etapaNueva });
  };

  // Ejecuta la acción del servidor (registrarAvanceTaller) al confirmar en el modal
  const handleConfirmarAvance = async (notas: string) => {
    if (!movimiento) return;
    const { confeccion, etapaNueva } = movimiento;

    try {
      const res = await registrarAvanceTaller({
        confeccionId: Number(confeccion.id),
        etapaAnterior: confeccion.etapa,
        etapaNueva: etapaNueva,
        notas: notas || `Cambio de fase optimizado desde el Pipeline General.`,
        responsableId: 1, // Reemplazar dinámicamente con la sesión del usuario
      });

      if (res?.success) {
        toast.success(`Orden #${confeccion.id} movida con éxito.`);
        // Mutación optimista en el cliente para evitar recargas lentas
        setConfecciones(prev =>
          prev.map(c => c.id === confeccion.id ? { ...c, etapa: etapaNueva } : c)
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de servidor al guardar la transición.");
    }
  };

  const getPrioridadEstilo = (p: string) => {
    if (p === "urgente") return "bg-red-100 text-red-800 border-red-200";
    if (p === "alta") return "bg-orange-100 text-orange-800 border-orange-200";
    if (p === "media") return "bg-sky-100 text-sky-800 border-sky-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* ENCABEZADO CONTROL OPERATIVO */}
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
                <h1 className="text-xl md:text-2xl font-black text-[var(--guor-dark)] tracking-tight">
                  Pipeline General de Confección
                </h1>
                <p className="text-xs text-slate-400">
                  Monitoreo de carga física y control de transiciones por taller externo
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

        {/* TABLERO KANBAN RESPONSIVO */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {ETAPAS_CONFECCION_ORDENADAS.map((etapaId, idx) => {
            const config = COLUMNAS_CONFIG[etapaId];
            const ColumnIcon = config.icon;
            const itemsEnEtapa = confecciones.filter((c) => c.etapa === etapaId);
            const totalUnidades = itemsEnEtapa.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

            // Identificar la siguiente fase lógica en la BD
            const siguienteEtapaAsignable = idx < ETAPAS_CONFECCION_ORDENADAS.length - 1 
              ? ETAPAS_CONFECCION_ORDENADAS[idx + 1] 
              : null;

            return (
              <div 
                key={etapaId} 
                className="rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col max-h-[75vh] min-w-[280px]"
              >
                {/* Cabecera Columna */}
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

                {/* Volumen total acumulado */}
                {itemsEnEtapa.length > 0 && (
                  <div className="bg-slate-50/70 px-4 py-1.5 border-b border-slate-100 flex justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Carga total:</span>
                    <span className="font-bold text-slate-600">{totalUnidades.toLocaleString("es-PE")} unds.</span>
                  </div>
                )}

                {/* Tarjetas */}
                <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[180px] bg-slate-50/40">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                      <RefreshCw size={16} className="animate-spin mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Cargando...</span>
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

                          {/* Control Avanzar de Etapa Interactivo */}
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

                        {/* Link técnico al detalle completo */}
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

      {/* MODAL DE INCIDENCIAS INTEGRADO */}
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