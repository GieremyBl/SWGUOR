"use client";

import { useState } from "react";
import { Check, Zap, ArrowRight } from "lucide-react";

// DICCIONARIO PARA TRADUCIR EL ENUM DEL TALLER A TEXTOS LIMPIOS Y PROFESIONALES:
export const ETAPA_LABELS_CONFECCION = {
    "recepcion_cortes": "Recepción de Cortes",
    "confeccion_y_remalle": "Confección y Remalle",
    "acabado_y_limpieza": "Acabado y Limpieza",
    "planchado_y_empaque": "Planchado y Empaque",
    "entregado_a_guor": "Entregado a GUOR",
};

// Array ordenado secuencialmente según tu ENUM en Prisma / Supabase
const ETAPAS_CONFECCION_ORDENADAS = [
    "recepcion_cortes",
    "confeccion_y_remalle",
    "acabado_y_limpieza",
    "planchado_y_empaque",
    "entregado_a_guor",
] as const;

type EtapaConfeccion = typeof ETAPAS_CONFECCION_ORDENADAS[number];
type Estado = "completado" | "activo" | "pendiente";

interface ConfeccionStepperProps {
    etapaActual: EtapaConfeccion;
    prendaNombre: string;
    cantidadPrendas: number;
    onCambiarEtapa: (nuevaEtapa: EtapaConfeccion) => Promise<void> | void;
}

export default function ConfeccionStepper({
    etapaActual,
    prendaNombre,
    cantidadPrendas,
    onCambiarEtapa,
}: ConfeccionStepperProps) {
    const [loading, setLoading] = useState(false);

    // Encontrar el índice actual en base al flujo estricto del taller
    const indexActual = ETAPAS_CONFECCION_ORDENADAS.indexOf(etapaActual);

    const porcentaje = Math.round((Math.max(indexActual, 0) / (ETAPAS_CONFECCION_ORDENADAS.length - 1)) * 100);

    const estadoDe = (idx: number): Estado =>
        idx < indexActual ? "completado" : idx === indexActual ? "activo" : "pendiente";

    const labelDe = (etapa: EtapaConfeccion) => {
        return ETAPA_LABELS_CONFECCION[etapa] || etapa;
    };

    // Determinar cuál es la siguiente etapa lógica
    const siguienteEtapa = indexActual < ETAPAS_CONFECCION_ORDENADAS.length - 1
        ? ETAPAS_CONFECCION_ORDENADAS[indexActual + 1]
        : null;

    const handleAvanzarEtapa = async () => {
        if (!siguienteEtapa || loading) return;
        setLoading(true);
        try {
            await onCambiarEtapa(siguienteEtapa);
        } catch (error) {
            console.error("Error al avanzar la etapa de confección:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--admin-accent)/0.15)] bg-white shadow-lg shadow-black/5">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-7">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--admin-accent))]">
                            Taller Externo Maquila — {prendaNombre} ({cantidadPrendas} unds.)
                        </p>
                        <h3 className="mt-1 text-xl sm:text-2xl font-black text-[var(--guor-dark)] tracking-tight">
                            Avance Físico de Costura
                        </h3>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-2xl sm:text-3xl font-black text-[hsl(var(--admin-accent))] tabular-nums leading-none">
                            {Math.max(indexActual + 1, 1)}
                            <span className="text-sm font-bold text-[hsl(var(--admin-accent)/0.5)]">/{ETAPAS_CONFECCION_ORDENADAS.length}</span>
                        </p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--admin-accent))]">
                            {porcentaje}% procesado en taller
                        </p>
                    </div>
                </div>

                {/* ── Horizontal: tablet / desktop ── */}
                <div className="hidden sm:block px-6 sm:px-8 py-8 overflow-x-auto">
                    <div className="flex items-start min-w-max">
                        {ETAPAS_CONFECCION_ORDENADAS.map((etapa, idx) => {
                            const estado = estadoDe(idx);
                            return (
                                <div key={etapa} className="flex items-center last:flex-none">
                                    <div className="flex flex-col items-center w-[120px] shrink-0">
                                        <div
                                            className={
                                                "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 " +
                                                (estado === "completado"
                                                    ? "bg-[hsl(var(--admin-accent))] border-[hsl(var(--admin-accent))] text-white"
                                                    : estado === "activo"
                                                        ? "bg-white border-[hsl(var(--admin-accent))] text-[var(--guor-dark)] ring-4 ring-[hsl(var(--admin-accent)/0.15)] motion-safe:animate-pulse"
                                                        : "bg-transparent border-[var(--guor-cream)] text-[hsl(var(--admin-accent)/0.3)]")
                                            }
                                        >
                                            {estado === "completado" ? (
                                                <Check size={18} className="stroke-[3]" />
                                            ) : (
                                                <span className="text-sm font-black">{idx + 1}</span>
                                            )}
                                        </div>
                                        <span
                                            className={
                                                "mt-3 text-center text-[10px] font-bold uppercase tracking-wider leading-tight max-w-[110px] break-words " +
                                                (estado === "pendiente" ? "text-[hsl(var(--admin-accent)/0.4)]" : "text-[var(--guor-dark)]")
                                            }
                                        >
                                            {labelDe(etapa)}
                                        </span>
                                    </div>

                                    {idx < ETAPAS_CONFECCION_ORDENADAS.length - 1 && (
                                        <div
                                            className={
                                                "w-12 border-t-[3px] mx-2 " +
                                                (idx < indexActual
                                                    ? "border-dashed border-[hsl(var(--admin-accent))]"
                                                    : "border-dashed border-[var(--guor-cream)]")
                                            }
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Vertical: mobile ── */}
                <div className="sm:hidden px-6 py-6">
                    {ETAPAS_CONFECCION_ORDENADAS.map((etapa, idx) => {
                        const estado = estadoDe(idx);
                        const esUltima = idx === ETAPAS_CONFECCION_ORDENADAS.length - 1;
                        return (
                            <div key={etapa} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={
                                            "flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0 transition-all duration-300 " +
                                            (estado === "completado"
                                                ? "bg-[hsl(var(--admin-accent))] border-[hsl(var(--admin-accent))] text-white"
                                                : estado === "activo"
                                                    ? "bg-white border-[hsl(var(--admin-accent))] text-[var(--guor-dark)] ring-4 ring-[hsl(var(--admin-accent)/0.15)] motion-safe:animate-pulse"
                                                    : "bg-transparent border-[var(--guor-cream)] text-[hsl(var(--admin-accent)/0.3)]")
                                        }
                                    >
                                        {estado === "completado" ? (
                                            <Check size={16} className="stroke-[3]" />
                                        ) : (
                                            <span className="text-xs font-black">{idx + 1}</span>
                                        )}
                                    </div>
                                    {!esUltima && (
                                        <div
                                            className="w-[2px] flex-1 min-h-[28px] my-1"
                                            style={{
                                                backgroundImage:
                                                    idx < indexActual
                                                        ? "repeating-linear-gradient(180deg, hsl(var(--admin-accent)) 0 6px, transparent 6px 11px)"
                                                        : "repeating-linear-gradient(180deg, var(--guor-cream) 0 6px, transparent 6px 11px)",
                                            }}
                                        />
                                    )}
                                </div>
                                <div className={esUltima ? "pb-1" : "pb-5"}>
                                    <p
                                        className={
                                            "text-xs font-black uppercase tracking-wide " +
                                            (estado === "pendiente" ? "text-[hsl(var(--admin-accent)/0.4)]" : "text-[var(--guor-dark)]")
                                        }
                                    >
                                        {labelDe(etapa)}
                                    </p>
                                    <p
                                        className={
                                            "text-[10px] font-semibold " +
                                            (estado === "pendiente"
                                                ? "text-[hsl(var(--admin-accent)/0.4)]"
                                                : "text-[hsl(var(--admin-accent))]")
                                        }
                                    >
                                        {estado === "completado" ? "Terminado" : estado === "activo" ? "En desarrollo" : "En cola"}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer de Control: Barra Dinámica para Cambiar de Etapa */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[hsl(var(--admin-accent)/0.1)] bg-gray-50 px-6 sm:px-8 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--admin-accent)/0.15)] border border-[hsl(var(--admin-accent)/0.2)]">
                            <Zap size={16} className="text-[hsl(var(--admin-accent))]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--admin-accent))]">Fase actual en taller</p>
                            <p className="text-base font-black text-[var(--guor-dark)]">{labelDe(etapaActual)}</p>
                        </div>
                    </div>

                    {/* Botón de acción inteligente para avanzar */}
                    {siguienteEtapa ? (
                        <button
                            onClick={handleAvanzarEtapa}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--admin-accent))] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[hsl(var(--admin-accent)/0.2)] transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Actualizando..." : `Avanzar a: ${labelDe(siguienteEtapa)}`}
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