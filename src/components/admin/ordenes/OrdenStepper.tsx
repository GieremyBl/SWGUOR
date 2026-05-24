"use client";

import { Check, Zap, ChevronRight } from "lucide-react";
import { ETAPA_LABELS } from "@/lib/schemas/ordenes-produccion";

interface OrdenStepperProps {
  etapas: readonly string[];
  etapaActual: string;
}

// Colores únicos por etapa - mejorados con más contraste
const ETAPA_COLORS: Record<string, { bg: string; text: string; border: string; icon: string; gradient: string }> = {
  diseno: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-300", icon: "bg-teal-500", gradient: "from-teal-400 to-teal-600" },
  patronaje: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-300", icon: "bg-cyan-500", gradient: "from-cyan-400 to-cyan-600" },
  corte: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-300", icon: "bg-indigo-500", gradient: "from-indigo-400 to-indigo-600" },
  confeccion: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", icon: "bg-amber-500", gradient: "from-amber-400 to-amber-600" },
  remallado: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-300", icon: "bg-orange-500", gradient: "from-orange-400 to-orange-600" },
  bordado_estampado: { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-300", icon: "bg-fuchsia-500", gradient: "from-fuchsia-400 to-fuchsia-600" },
  control_calidad: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300", icon: "bg-rose-500", gradient: "from-rose-400 to-rose-600" },
  acabado: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-300", icon: "bg-violet-500", gradient: "from-violet-400 to-violet-600" },
  listo_entrega: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300", icon: "bg-emerald-500", gradient: "from-emerald-400 to-emerald-600" },
};

export default function OrdenStepper({ etapas, etapaActual }: OrdenStepperProps) {
  const indexActual = etapas.indexOf(etapaActual);
  const porcentajeProgreso = ((indexActual + 1) / etapas.length) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Header con progreso general */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Control de Etapas</h3>
          <p className="text-sm text-slate-500">Seguimiento de la orden de producción</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{indexActual + 1}</p>
            <p className="text-xs text-slate-500">de {etapas.length} etapas</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-slate-200 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-700">{Math.round(porcentajeProgreso)}%</span>
          </div>
        </div>
      </div>

      {/* Stepper Visual Principal */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-white border-2 border-slate-200 rounded-2xl p-8 shadow-lg">
        {/* Versión Desktop */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between gap-1">
            {etapas.map((etapa, idx) => {
              const isCompletado = idx < indexActual;
              const isActual = idx === indexActual;
              const colors = ETAPA_COLORS[etapa] || ETAPA_COLORS.diseno;

              return (
                <div key={etapa} className="flex items-center flex-1">
                  {/* Nodo de la etapa */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-500 transform hover:scale-110 ${
                        isCompletado
                          ? `${colors.icon} border-white text-white shadow-xl scale-100`
                          : isActual
                            ? `bg-white ${colors.border} border-4 ring-4 ring-offset-2 ${colors.icon} ring-opacity-30 shadow-2xl scale-110`
                            : `bg-slate-100 border-slate-300 text-slate-400 shadow-sm`
                      }`}
                    >
                      {isCompletado ? (
                        <Check size={28} className="stroke-[3]" />
                      ) : (
                        <span className="text-xl font-black">{idx + 1}</span>
                      )}
                    </div>

                    <span
                      className={`mt-4 text-xs font-bold uppercase tracking-widest text-center block max-w-[90px] leading-tight transition-all duration-300 ${
                        isActual
                          ? "text-slate-900 font-black text-sm"
                          : isCompletado
                            ? "text-slate-700"
                            : "text-slate-400"
                      }`}
                    >
                      {ETAPA_LABELS[etapa as keyof typeof ETAPA_LABELS] || etapa}
                    </span>
                  </div>

                  {/* Línea conectora */}
                  {idx < etapas.length - 1 && (
                    <div className="flex-1 h-1.5 mx-2 rounded-full relative overflow-hidden bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCompletado
                            ? `bg-gradient-to-r from-emerald-500 to-emerald-400`
                            : isActual
                              ? `bg-gradient-to-r ${colors.gradient} animate-pulse`
                              : `bg-slate-200`
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Versión Mobile */}
        <div className="md:hidden space-y-4">
          {etapas.map((etapa, idx) => {
            const isCompletado = idx < indexActual;
            const isActual = idx === indexActual;
            const colors = ETAPA_COLORS[etapa] || ETAPA_COLORS.diseno;

            return (
              <div key={etapa}>
                <div className="flex items-center gap-4">
                  {/* Nodo */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-300 ${
                      isCompletado
                        ? `${colors.icon} border-white text-white shadow-lg`
                        : isActual
                          ? `bg-white ${colors.border} border-3 ring-2 ${colors.icon} ring-opacity-30 shadow-lg scale-105`
                          : `bg-slate-100 border-slate-300 text-slate-400`
                    }`}
                  >
                    {isCompletado ? (
                      <Check size={22} className="stroke-[3]" />
                    ) : (
                      <span className="text-lg font-black">{idx + 1}</span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-bold uppercase tracking-wide ${
                        isActual ? "text-slate-900 font-black" : isCompletado ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {ETAPA_LABELS[etapa as keyof typeof ETAPA_LABELS] || etapa}
                    </p>
                    <p className={`text-xs ${isCompletado ? "text-emerald-600" : isActual ? colors.text : "text-slate-400"}`}>
                      {isCompletado ? "✓ Completado" : isActual ? "En progreso" : "Pendiente"}
                    </p>
                  </div>

                  {isActual && <ChevronRight className="text-slate-400 flex-shrink-0" size={20} />}
                </div>

                {/* Línea conectora en mobile */}
                {idx < etapas.length - 1 && (
                  <div className="ml-6 mt-2 mb-2">
                    <div
                      className={`w-1 h-6 rounded-full transition-all duration-500 ${
                        isCompletado ? "bg-gradient-to-b from-emerald-500 to-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Barra de progreso mejorada */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Progreso General</p>
            <p className="text-sm font-bold text-slate-900">{Math.round(porcentajeProgreso)}%</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${porcentajeProgreso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card de etapa actual mejorada */}
      <div
        className={`p-8 rounded-2xl border-2 transition-all duration-500 shadow-lg ${
          ETAPA_COLORS[etapaActual]?.bg || ETAPA_COLORS.diseno.bg
        } ${ETAPA_COLORS[etapaActual]?.border || ETAPA_COLORS.diseno.border}`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${ETAPA_COLORS[etapaActual]?.icon || ETAPA_COLORS.diseno.icon} shadow-lg`}
          >
            <Zap size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Etapa Actual</p>
            <p className={`text-2xl font-black ${ETAPA_COLORS[etapaActual]?.text || ETAPA_COLORS.diseno.text} mb-2`}>
              {ETAPA_LABELS[etapaActual as keyof typeof ETAPA_LABELS] || etapaActual}
            </p>
            <p className="text-sm text-slate-600">
              Completa esta etapa para avanzar a la siguiente fase de producción
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}