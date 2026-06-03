"use client";

import { useState } from "react";
import { Shirt, Clock, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "../shared/SectionCard";
import { FieldLabel } from "../shared/FieldLabel";

interface Props {
    orden: any;
    onComplete: () => void;
}

const ESTADOS_CONFECCION = [
    { value: "pendiente", label: "Pendiente", Icon: Clock },
    { value: "en_proceso", label: "En proceso", Icon: Loader2 },
    { value: "completada", label: "Completada", Icon: CheckCircle2 },
    { value: "rechazada", label: "Rechazada", Icon: XCircle },
] as const;

export function FormTaller({ orden, onComplete }: Props) {
    const [estadoConf, setEstadoConf] = useState<string>(orden.estado_confeccion ?? "pendiente");
    const [prendas, setPrendas] = useState<string>(orden.prendas_completadas ?? "");
    const [incidencia, setIncidencia] = useState<string>(orden.incidencia_confeccion ?? "");
    const [loading, setLoading] = useState(false);

    const progreso = orden.cantidad && Number(prendas) > 0
        ? Math.min(Math.round((Number(prendas) / orden.cantidad) * 100), 100)
        : 0;

    const handleGuardar = async (completar = false) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/ordenes-produccion/${orden.id}/etapa`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estado_confeccion: estadoConf,
                    prendas_completadas: prendas ? Number(prendas) : null,
                    incidencia_confeccion: incidencia || null,
                    completar,
                }),
            });
            if (!res.ok) throw new Error();
            if (completar) {
                toast.success("Confección completada — avanzando a Remallado");
                onComplete();
            } else {
                toast.success("Avance guardado");
            }
        } catch {
            toast.error("No se pudo guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SectionCard>
            {/* Header */}
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                    <Shirt className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800">Confección — Taller Externo</p>
                    <p className="text-xs text-slate-400">Actualiza el estado y registra el avance</p>
                </div>
            </div>

            {/* Estado confección */}
            <div>
                <FieldLabel required>Estado de confección</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                    {ESTADOS_CONFECCION.map(({ value, label, Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setEstadoConf(value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${estadoConf === value
                                    ? "border-rose-500 bg-rose-50 text-rose-700"
                                    : "border-slate-200 text-slate-400 hover:border-rose-200"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prendas completadas + barra */}
            <div>
                <FieldLabel>Prendas completadas</FieldLabel>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={0}
                        value={prendas}
                        onChange={(e) => setPrendas(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    {orden.cantidad && (
                        <span className="text-xs text-slate-400 whitespace-nowrap font-medium shrink-0">
                            de {orden.cantidad}
                        </span>
                    )}
                </div>
                {orden.cantidad && (
                    <div className="mt-2 space-y-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                style={{ width: `${progreso}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 text-right">{progreso}% completado</p>
                    </div>
                )}
            </div>

            {/* Incidencias */}
            <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <FieldLabel>Reportar incidencia</FieldLabel>
                </div>
                <textarea
                    value={incidencia}
                    onChange={(e) => setIncidencia(e.target.value)}
                    rows={3}
                    placeholder="Describe cualquier problema, rechazo o demora..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
            </div>

            {/* Dos botones */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => handleGuardar(false)}
                    disabled={loading}
                    className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    Guardar avance
                </button>
                <button
                    type="button"
                    onClick={() => handleGuardar(true)}
                    disabled={loading || estadoConf !== "completada"}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
                >
                    {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ChevronRight className="w-4 h-4" />}
                    Completar y avanzar
                </button>
            </div>

            {estadoConf !== "completada" && (
                <p className="text-[11px] text-slate-400 text-center -mt-2">
                    El estado debe ser "Completada" para avanzar a la siguiente etapa
                </p>
            )}
        </SectionCard>
    );
}