"use client";

import { Check, Zap, ArrowRight } from "lucide-react";

export const ETAPA_LABELS_CONFECCION = {
    "recepcion_cortes": "Recepción de Cortes",
    "confeccion_y_remalle": "Confección y Remalle",
    "acabado_y_limpieza": "Acabado y Limpieza",
    "planchado_y_empaque": "Planchado y Empaque",
    "entregado_a_guor": "Entregado a GUOR",
};

export const ETAPAS_CONFECCION_ORDENADAS = [
    "recepcion_cortes",
    "confeccion_y_remalle",
    "acabado_y_limpieza",
    "planchado_y_empaque",
    "entregado_a_guor",
] as const;

export type EtapaConfeccion = typeof ETAPAS_CONFECCION_ORDENADAS[number];
type EstadoElemento = "completado" | "activo" | "pendiente";

interface ConfeccionStepperProps {
    etapaActual: EtapaConfeccion;
    prendaNombre: string;
    cantidadPrendas: number;
    onCambiarEtapa: (nuevaEtapa: EtapaConfeccion) => void; // <-- Usado por el Tab para abrir el modal
}

export default function ConfeccionStepper({
    etapaActual,
    prendaNombre,
    cantidadPrendas,
    onCambiarEtapa,
}: ConfeccionStepperProps) {

    const indiceActual = ETAPAS_CONFECCION_ORDENADAS.indexOf(etapaActual);
    const siguienteEtapa = indiceActual < ETAPAS_CONFECCION_ORDENADAS.length - 1
        ? ETAPAS_CONFECCION_ORDENADAS[indiceActual + 1]
        : null;

    const obtenerEstado = (etapa: EtapaConfeccion, index: number): EstadoElemento => {
        if (index < indiceActual) return "completado";
        if (etapa === etapaActual) return "activo";
        return "pendiente";
    };

    const labelDe = (etapa: EtapaConfeccion) => ETAPA_LABELS_CONFECCION[etapa];

    return (
        <div className="w-full rounded-3xl border border-[var(--guor-cream)] bg-white p-6 shadow-sm">
            {/* Cabecera Informativa */}
            <div className="mb-6 flex flex-col justify-between gap-2 border-b border-dashed border-slate-100 pb-5 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-black text-[var(--guor-dark)] tracking-tight">
                        Control de Producción Física
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                        Lote: <span className="font-bold text-slate-700">{prendaNombre}</span> &middot; Cantidad: <span className="font-bold text-slate-700">{cantidadPrendas} uds.</span>
                    </p>
                </div>
            </div>

            {/* Stepper Gráfico */}
            <div className="relative mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center md:gap-2">
                {/* Línea conectora de fondo */}
                <div className="absolute left-[15px] top-0 hidden h-full w-[2px] bg-slate-100 md:left-0 md:top-4 md:block md:h-[2px] md:w-full -z-0" />

                {ETAPAS_CONFECCION_ORDENADAS.map((etapa, idx) => {
                    const estado = obtenerEstado(etapa, idx);

                    return (
                        <div key={etapa} className="relative z-10 flex flex-1 items-center gap-4 md:flex-col md:gap-2">
                            {/* Círculo indicador */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300
                                ${estado === "completado" ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100" : ""}
                                ${estado === "activo" ? "bg-[hsl(var(--admin-accent))] border-[hsl(var(--admin-accent))] text-white shadow-md shadow-[hsl(var(--admin-accent)/0.2)] scale-105" : ""}
                                ${estado === "pendiente" ? "bg-white border-slate-200 text-slate-400" : ""}
                            `}>
                                {estado === "completado" ? <Check size={14} className="stroke-[3]" /> : idx + 1}
                            </div>

                            {/* Etiqueta */}
                            <div className="text-left md:text-center">
                                <p className={`text-[11px] font-black tracking-tight leading-none transition-colors duration-300
                                    ${estado === "activo" ? "text-[var(--guor-dark)]" : "text-slate-400"}
                                    ${estado === "completado" ? "text-slate-500" : ""}
                                `}>
                                    {labelDe(etapa)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Barra de Acción Inferior */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                            <Zap size={16} className="text-[hsl(var(--admin-accent))]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--admin-accent))]">Fase actual en taller</p>
                            <p className="text-base font-black text-[var(--guor-dark)]">{labelDe(etapaActual)}</p>
                        </div>
                    </div>

                    {siguienteEtapa ? (
                        <button
                            onClick={() => onCambiarEtapa(siguienteEtapa)} // Opción nativa que dispara la apertura del formulario
                            className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--admin-accent))] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                        >
                            Avanzar a: {labelDe(siguienteEtapa)}
                            <ArrowRight size={14} className="stroke-[3]" />
                        </button>
                    ) : (
                        <span className="inline-flex items-center rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200">
                            Trabajo en taller concluido
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}