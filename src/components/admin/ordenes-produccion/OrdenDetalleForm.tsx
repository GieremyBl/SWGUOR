"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCreateOrdenProduccion } from "@/lib/hooks/useOrdenProduccion";
import { ETAPAS_PRODUCCION, ETAPA_LABELS } from "@/lib/schemas/ordenes-produccion";
import OrdenStepper from "./OrdenStepper";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrdenProduccion, SeguimientoProduccion } from "@/components/admin/ordenes-produccion/types";
import {
  Factory,
  Package,
  ClipboardX,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  User
} from "lucide-react";

interface OrdenDetalleFormProps {
  open?: boolean;
  initialData: OrdenProduccion | null;
  onClose: () => void;
}

export default function OrdenDetalleForm({ initialData: orden, onClose: onVolver }: OrdenDetalleFormProps) {
  // Extraemos 'registrarEtapa' e 'isChangingEtapa' para controlar el estado visual de carga
  const { registrarEtapa, isChangingEtapa } = useCreateOrdenProduccion();

  if (!orden) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border">
        <p className="text-slate-500">No se encontró la información de la orden.</p>
      </div>
    );
  }

  const etapaActual = orden.seguimiento_produccion?.[0]?.etapa || "pendiente";

  const handleCambiarEtapa = (nuevaEtapa: string) => {
    // Obtenemos el nombre legible de la etapa para construir la observación automática
    const nombreEtapa = ETAPA_LABELS[nuevaEtapa as keyof typeof ETAPA_LABELS] || nuevaEtapa;

    // AHORA SÍ: Pasamos el objeto completo incluyendo la observación requerida
    registrarEtapa({
      orden_id: orden.id.toString(),
      etapa: nuevaEtapa,
      observaciones: `Cambio manual de etapa a: ${nombreEtapa}.`
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Barra superior de navegación y acciones */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
        <div className="space-y-1">
          <button
            onClick={onVolver}
            disabled={isChangingEtapa}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 disabled:opacity-50"
          >
            <ArrowLeft size={16} /> Volver a órdenes
          </button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-base px-3 py-0.5 text-rose-600 border-rose-100 bg-rose-50/50">
              #{orden.id}
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {orden.productos?.nombre}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Calendar size={16} />
          <span>Creado el {format(new Date(orden.created_at || new Date()), "d 'de' MMMM, yyyy", { locale: es })}</span>
        </div>
      </div>

      {/* Flujo visual del Stepper en la cabecera */}
      <OrdenStepper etapas={ETAPAS_PRODUCCION} etapaActual={etapaActual} />

      {/* Layout de dos columnas para detalles y auditoría */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Columna Izquierda: Información Técnica y Controles */}
        <div className="lg:col-span-2 space-y-6">

          {/* Fichas Técnicas principales */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
              Especificaciones de Production
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500">
                  <Factory size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Taller Asignado</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{orden.talleres?.nombre || "No asignado"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500">
                  <Package size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Volumen Solicitado</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{orden.cantidad_solicitada} Unidades</p>
                </div>
              </div>
            </div>

            {/* Notas del Diseñador/Administrador */}
            <div className="p-5 bg-rose-50/40 rounded-xl border border-rose-100/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                <ClipboardX size={16} />
                <span>Notas e Instrucciones Especiales</span>
              </div>
              <p className="text-sm text-slate-600 italic leading-relaxed">
                {orden.notas || "No se adjuntaron notas adicionales para esta orden de producción."}
              </p>
            </div>
          </div>

          {/* Panel de Control de Cambios de Etapa */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
              Control de Operaciones (Cambio Manual de Estado)
            </h3>
            <p className="text-xs text-slate-500">
              Presione el botón del siguiente proceso para avanzar la orden. Las etapas completadas quedarán registradas en el historial.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {ETAPAS_PRODUCCION.map((etapa) => {
                const isCurrent = etapaActual === etapa;
                return (
                  <Button
                    key={etapa}
                    variant={isCurrent ? "default" : "outline"}
                    // Se deshabilitan los botones temporalmente mientras se procesa la mutación en red
                    disabled={isCurrent || isChangingEtapa}
                    onClick={() => handleCambiarEtapa(etapa)}
                    className={`justify-start h-12 px-4 rounded-xl font-medium transition-all ${isCurrent
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {isCurrent ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> : <Layers size={14} className="shrink-0 text-slate-400" />}
                      <span className="text-xs truncate">{ETAPA_LABELS[etapa as keyof typeof ETAPA_LABELS]}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Historial y Auditoría Logística */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
              Historial de Auditoría
            </h3>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
              {orden.seguimiento_produccion?.length || 0} Hitos
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-100">
            {orden.seguimiento_produccion?.map((event: SeguimientoProduccion, idx: number) => {
              const isLatest = idx === 0;
              return (
                <div key={event.id} className="relative space-y-1.5">
                  <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${isLatest ? "bg-rose-600 ring-4 ring-rose-50" : "bg-slate-300"
                    }`} />

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black uppercase tracking-tight ${isLatest ? "text-rose-600" : "text-slate-700"}`}>
                      {ETAPA_LABELS[event.etapa as keyof typeof ETAPA_LABELS] || event.etapa}
                    </span>
                    <span className="text-[10px] font-bold font-mono text-slate-400">
                      {format(new Date(event.created_at), "HH:mm 'hs'", { locale: es })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-snug">
                    {event.observaciones || "Transición de estado aprobada."}
                  </p>

                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <User size={10} />
                    <span>{format(new Date(event.created_at), "dd LLL, yyyy", { locale: es })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}