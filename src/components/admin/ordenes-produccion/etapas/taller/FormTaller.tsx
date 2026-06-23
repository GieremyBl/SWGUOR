"use client";

import { useState } from "react";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { EvidenciaUpload } from "../EvidenciaUpload";

interface FormProps {
    orden: any;
    onComplete: () => void;
}

export function FormRepresentanteTaller({ orden, onComplete }: FormProps) {
    const etapaActual = (orden.etapa || "confeccion").toLowerCase().trim();

    const [observaciones, setObservaciones] = useState("");
    const [evidenciaUrl, setEvidenciaUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar estrictamente la carga del archivo en el estado local de React
        if (!evidenciaUrl) {
            setError("Debe cargar una evidencia (foto/documento) antes de continuar con la confección");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/ordenes-produccion/${orden.id}/etapas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orden_id: String(orden.id),
                    etapa: etapaActual,
                    observaciones: observaciones.trim() || undefined,
                    evidencia_url: evidenciaUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al procesar la confección");

            onComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="border-b pb-2">
                <h4 className="text-sm font-black text-purple-700 uppercase tracking-wide">
                    Módulo de Confección en Línea
                </h4>
                <p className="text-xs text-gray-500">Unión de piezas, armado corporal de prendas y habilitación de costuras rectas.</p>
            </div>

            <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-xl">
                <p className="text-xs text-purple-900 leading-relaxed">
                    Al presionar el botón de abajo, cerrarás la fase de confección estándar y trasladarás los lotes hacia las estaciones de <strong>Remallado / Overlock</strong>.
                </p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reporte de Incidencias de Costura</label>
                <textarea
                    rows={3}
                    placeholder="Escribe si hubo rotura de agujas, desabastecimiento de avíos, hilos o demoras con los operarios asignados..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-purple-500"
                    disabled={loading}
                />
            </div>

            {/* Cargador integrado con parámetros dinámicos de ruta de Supabase */}
            <EvidenciaUpload
                label="Cargar Evidencia de Confección (Foto del lote en costura o primera muestra armada)"
                onUpload={(url) => setEvidenciaUrl(url)}
                required={true}
                disabled={loading}
                ordenId={orden.id}
                etapa="confeccion"
                bucketTarget="evidencias-ordenes-produccion"
            />

            {error && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !evidenciaUrl}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:bg-gray-200 disabled:text-gray-400"
            >
                {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <>
                        Finalizar Costura y Pasar a Remallado <ArrowRight size={14} />
                    </>
                )}
            </button>
        </form>
    );
}