"use client";

import { useState } from "react";
import { ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { EvidenciaUpload } from "../EvidenciaUpload";

interface FormProps {
    orden: any;
    onComplete: () => void;
}

export function FormAyudante({ orden, onComplete }: FormProps) {
    const etapaActual = (orden.etapa || "remallado").toLowerCase().trim();

    const [observaciones, setObservaciones] = useState("");
    const [evidenciaUrl, setEvidenciaUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados para sub-fórmulas dinámicas (Mapeados a datos_etapa JSONB)
    const [operarioRemalladora, setOperarioRemalladora] = useState("");
    const [tipoDecorado, setTipoDecorado] = useState("ninguno");
    const [piezasAprobadas, setPiezasAprobadas] = useState("");
    const [piezasSegunda, setPiezasSegunda] = useState("");
    const [piezasRechazadas, setPiezasRechazadas] = useState("");

    // Datos específicos para la entrega final
    const [fechaEntrega, setFechaEntrega] = useState("");
    const [horaEntrega, setHoraEntrega] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación estricta de evidencia por etapa
        if (!evidenciaUrl) {
            setError("Debe cargar la evidencia fotográfica/documento requerida para validar esta operación.");
            return;
        }

        setLoading(true);
        setError(null);

        // Construcción del payload base obligatorio con la evidencia y observaciones de la fase activa
        const payload: Record<string, any> = {
            orden_id: String(orden.id),
            etapa: etapaActual,
            observaciones: observaciones.trim() || undefined,
            evidencia_url: evidenciaUrl,
        };

        // Inyección estructural de parámetros según la fase activa para guardar en JSONB
        if (etapaActual === "remallado") {
            payload.operario_remalladora = operarioRemalladora.trim() || "Asignado en Planta";
        }
        if (etapaActual === "bordado_estampado") {
            payload.tipo_decorado = tipoDecorado;
        }
        if (etapaActual === "control_calidad") {
            payload.piezas_aprobadas = piezasAprobadas ? Number(piezasAprobadas) : 0;
            payload.piezas_segunda = piezasSegunda ? Number(piezasSegunda) : 0;
            payload.piezas_rechazadas = piezasRechazadas ? Number(piezasRechazadas) : 0;
        }
        if (etapaActual === "listo_entrega") {
            payload.fecha_esperada_entrega = `${fechaEntrega}T${horaEntrega}`;
            payload.piezas_a_empaquetar = piezasAprobadas ? Number(piezasAprobadas) : 0;
        }

        try {
            const res = await fetch(`/api/admin/ordenes-produccion/${orden.id}/etapas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar el avance");

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
                <h4 className="text-sm font-black text-teal-800 uppercase tracking-wide">
                    Estación de Operación: {
                        etapaActual === "remallado" ? "Remallado de Seguridad" :
                            etapaActual === "bordado_estampado" ? "Decoración (Bordado / Estampado)" :
                                etapaActual === "control_calidad" ? "Mesa de Control de Calidad" :
                                    etapaActual === "acabado" ? "Acabados Finales" : "Almacén de Despacho"
                    }
                </h4>
                <p className="text-xs text-gray-500">Reporte operacional para ayudantes del taller y personal de mesa de apoyo.</p>
            </div>

            {/* --- 1. FORMULARIO DE REMALLADO --- */}
            {etapaActual === "remallado" && (
                <>
                    <div className="space-y-3 rounded-2xl bg-teal-50/40 p-4 border border-teal-100/70">
                        <h5 className="text-xs font-black uppercase tracking-wider text-teal-900">Control de Ensamblado (Overlock)</h5>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Operario o Máquina de Remallado Asignada</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: María Choque / Remalladora #2"
                                value={operarioRemalladora}
                                onChange={(e) => setOperarioRemalladora(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:border-teal-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones del Remallado</label>
                        <textarea
                            rows={2}
                            placeholder="Anota si hubo problemas con la tensión del hilo, roturas o demoras en agujas..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-teal-600"
                        />
                    </div>

                    <EvidenciaUpload
                        label="Cargar foto de costuras / remallado overlock terminado"
                        onUpload={(url) => setEvidenciaUrl(url)}
                        required={true}
                        disabled={loading}
                        ordenId={orden.id}
                        etapa="remallado"
                        bucketTarget="evidencias-ordenes-produccion"
                    />
                </>
            )}

            {/* --- 2. FORMULARIO DE BORDADO O ESTAMPADO --- */}
            {etapaActual === "bordado_estampado" && (
                <>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Decoración Realizada</label>
                        <select
                            value={tipoDecorado}
                            onChange={(e) => setTipoDecorado(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-teal-500"
                        >
                            <option value="ninguno">Ninguno / Básico</option>
                            <option value="bordado">Bordado Industrial</option>
                            <option value="estampado">Estampado Textil / Serigrafía</option>
                            <option value="ambos">Ambos Procesos</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones de la Decoración</label>
                        <textarea
                            rows={2}
                            placeholder="Detalles sobre hilos de color, mallas utilizadas o secado..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-teal-600"
                        />
                    </div>

                    <EvidenciaUpload
                        label="Cargar foto de muestra del bordado o estampado del lote"
                        onUpload={(url) => setEvidenciaUrl(url)}
                        required={true}
                        disabled={loading}
                        ordenId={orden.id}
                        etapa="bordado_estampado"
                        bucketTarget="evidencias-ordenes-produccion"
                    />
                </>
            )}

            {/* --- 3. FORMULARIO DE CONTROL DE CALIDAD --- */}
            {etapaActual === "control_calidad" && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                        <div>
                            <label className="block text-xs font-bold text-emerald-900 mb-1">Aprobadas (1ra Calidad)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                placeholder="0"
                                value={piezasAprobadas}
                                onChange={(e) => setPiezasAprobadas(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-bold text-emerald-600 focus:outline-none bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-amber-900 mb-1">Segunda (Detalles leves)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={piezasSegunda}
                                onChange={(e) => setPiezasSegunda(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-bold text-amber-600 focus:outline-none bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-900 mb-1">Rechazadas (Merma total)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={piezasRechazadas}
                                onChange={(e) => setPiezasRechazadas(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-bold text-red-500 focus:outline-none bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Reporte o Notas de Auditoría de Calidad</label>
                        <textarea
                            rows={2}
                            placeholder="Detalla los motivos si se encontraron prendas defectuosas o mermas..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-teal-600"
                        />
                    </div>

                    <EvidenciaUpload
                        label="Cargar foto de la mesa de control o reporte físico firmado"
                        onUpload={(url) => setEvidenciaUrl(url)}
                        required={true}
                        disabled={loading}
                        ordenId={orden.id}
                        etapa="control_calidad"
                        bucketTarget="evidencias-ordenes-produccion"
                    />
                </>
            )}

            {/* --- 4. FORMULARIO DE ACABADO --- */}
            {etapaActual === "acabado" && (
                <>
                    <div className="p-3 bg-cyan-50 border border-cyan-100 text-cyan-800 rounded-xl text-xs font-medium">
                        ¡Estás a un paso de terminar: Planchado industrial, vaporizado, embolsado y etiquetado comercial del lote de prendas!
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones de Acabados</label>
                        <textarea
                            rows={2}
                            placeholder="Detalles sobre el empaque, colocación de etiquetas de precio, hangtags, etc..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-teal-600"
                        />
                    </div>

                    <EvidenciaUpload
                        label="Cargar foto de prendas planchadas y embolsadas en lote"
                        onUpload={(url) => setEvidenciaUrl(url)}
                        required={true}
                        disabled={loading}
                        ordenId={orden.id}
                        etapa="acabado"
                        bucketTarget="evidencias-ordenes-produccion"
                    />
                </>
            )}

            {/* --- 5. FORMULARIO LISTO PARA ENTREGA --- */}
            {etapaActual === "listo_entrega" && (
                <>
                    <div className="p-3 bg-cyan-50 border border-cyan-100 text-cyan-800 rounded-xl text-xs font-medium">
                        ¡Estás en el paso final: Los productos están listos para ser despachados!
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Esperada de Entrega</label>
                            <input
                                type="date"
                                required
                                value={fechaEntrega}
                                onChange={(e) => setFechaEntrega(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Hora Esperada de Entrega</label>
                            <input
                                type="time"
                                required
                                value={horaEntrega}
                                onChange={(e) => setHoraEntrega(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones de la Entrega / Despacho</label>
                        <textarea
                            rows={2}
                            placeholder="Especificaciones sobre transporte, bultos embalados o persona que recibe..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-teal-600"
                        />
                    </div>

                    <EvidenciaUpload
                        label="Cargar foto del lote final listo en almacén de despacho"
                        onUpload={(url) => setEvidenciaUrl(url)}
                        required={true}
                        disabled={loading}
                        ordenId={orden.id}
                        etapa="listo_entrega"
                        bucketTarget="evidencias-ordenes-produccion"
                    />
                </>
            )}

            {error && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Botón Global Estructurado */}
            <button
                type="submit"
                disabled={loading || !evidenciaUrl}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:bg-gray-200 disabled:text-gray-400"
            >
                {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : etapaActual === "acabado" || etapaActual === "listo_entrega" ? (
                    <>
                        <CheckCircle size={14} /> Finalizar Completamente y Enviar a Despacho
                    </>
                ) : (
                    <>
                        Completar Operación de {etapaActual.replace("_", " ")} <ArrowRight size={14} />
                    </>
                )}
            </button>
        </form>
    );
}