"use client";

import { useState } from "react";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { EvidenciaUpload } from "../EvidenciaUpload";

interface FormProps {
    orden: any;
    onComplete: () => void;
}

export function FormCortador({ orden, onComplete }: FormProps) {
    const etapaActual = (orden.etapa || "corte").toLowerCase().trim();

    const [piezasCortadas, setPiezasCortadas] = useState("");
    const [mermaTela, setMermaTela] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [evidenciaUrl, setEvidenciaUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar estrictamente los campos requeridos en la UI
        if (!piezasCortadas) {
            setError("Debe ingresar el total de piezas cortadas.");
            return;
        }
        if (!evidenciaUrl) {
            setError("Debe cargar una foto de evidencia del tendido o bloque de corte antes de continuar.");
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
                    piezas_cortadas: piezasCortadas ? Number(piezasCortadas) : null,
                    merma_tela: mermaTela ? Number(mermaTela) : null,
                    evidencia_url: evidenciaUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al registrar el reporte de corte");

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
                <h4 className="text-sm font-black text-orange-700 uppercase tracking-wide">
                    Mesa de Tendido y Corte Textil
                </h4>
                <p className="text-xs text-gray-500">Reporta los materiales consumidos e ingresa las unidades netas listas para costura.</p>
            </div>

            {/* Campos cuantitativos de la estación de corte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Total Piezas Cortadas (Unidades) *</label>
                    <input
                        type="number"
                        required
                        min="1"
                        placeholder="Ej: 150"
                        value={piezasCortadas}
                        onChange={(e) => setPiezasCortadas(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none font-semibold tabular-nums"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Merma de Tela Estimada (Metros/Kilos)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ej: 1.45"
                        value={mermaTela}
                        onChange={(e) => setMermaTela(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none tabular-nums"
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Notas operacionales del cortador */}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas del Cortador</label>
                <textarea
                    rows={2}
                    placeholder="Reporta fallas de origen en el rollo de tela, diferencias con la moldería, paños defectuosos o mermas inusuales..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-orange-500"
                    disabled={loading}
                />
            </div>

            {/* Cargador adaptado con la estructura de carpetas dinámica */}
            <EvidenciaUpload
                label="Cargar Foto del Tendido, Trazado o Bloque de Corte Terminado"
                onUpload={(url) => setEvidenciaUrl(url)}
                required={true}
                disabled={loading}
                ordenId={orden.id}
                etapa="corte"
                bucketTarget="evidencias-ordenes-produccion"
            />

            {error && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Botón de envío con deshabilitado reactivo */}
            <button
                type="submit"
                disabled={loading || !piezasCortadas || !evidenciaUrl}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:bg-gray-200 disabled:text-gray-400"
            >
                {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <>
                        Liberar Bloques a Confección <ArrowRight size={14} />
                    </>
                )}
            </button>
        </form>
    );
}