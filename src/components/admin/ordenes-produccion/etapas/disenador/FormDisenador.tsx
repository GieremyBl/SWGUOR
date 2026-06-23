"use client";

import { useState } from "react";
import { ArrowRight, Loader2, AlertCircle, Layers } from "lucide-react";
import { EvidenciaUpload } from "../EvidenciaUpload";

interface FormProps {
    orden: any;
    onComplete: () => void;
}

export function FormDisenador({ orden, onComplete }: FormProps) {
    const etapaActual = (orden.etapa || "diseno").toLowerCase().trim();

    const [observaciones, setObservaciones] = useState("");
    const [variantesColor, setVariantesColor] = useState("");
    const [evidenciaUrl, setEvidenciaUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 💡 EXTRACCIÓN DINÁMICA: Navegamos en la relación de la orden
    // Se adapta a nomenclaturas comunes: orden.pedido_detalles, orden.detalles o orden.items
    const detallesPedido = orden.pedido_detalles || orden.detalles || orden.items || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!evidenciaUrl) {
            setError("Debe cargar la evidencia (boceto/moldería) requerida antes de guardar el avance de esta fase.");
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
                    variantes_color: etapaActual === "diseno" ? variantesColor.trim() || undefined : undefined,
                    evidencia_url: evidenciaUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al procesar el flujo");

            onComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="border-b pb-3">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                    Área de Desarrollo: {etapaActual === "diseno" ? "Diseño Técnico" : "Patronaje y Moldes"}
                </h4>
                <p className="text-xs text-gray-500">Registra el avance de muestras y aprobación de moldería física o digital.</p>
            </div>
            {/* Solo en Diseño */}
            {etapaActual === "diseno" && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-900">
                        <Layers size={16} className="shrink-0 text-blue-600" />
                        <h5 className="text-xs font-black uppercase tracking-wider">Requerimientos del Pedido del Cliente</h5>
                    </div>

                    {detallesPedido.length > 0 ? (
                        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-3 py-2">Prenda / Producto</th>
                                        <th className="px-3 py-2">Color Solicitado</th>
                                        <th className="px-3 py-2 text-center">Talla</th>
                                        <th className="px-3 py-2 text-right">Cant.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs text-gray-700 font-medium">
                                    {detallesPedido.map((item: any, idx: number) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-3 py-2 font-bold text-gray-950">
                                                {item.productos?.nombre || item.producto_nombre || "Prenda Base"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px]">
                                                    {item.color || item.color_nombre || "No definido"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center font-mono font-bold text-gray-600">
                                                {item.talla || item.talla_nombre || "-"}
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-gray-900 tabular-nums">
                                                {item.cantidad || 0} unds.
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-3 text-center bg-white rounded-xl border border-dashed border-gray-200">
                            <p className="text-xs text-gray-400">
                                No se encontraron sub-prendas o desglose de tallas asignados a esta orden. Verifica el pedido original.
                            </p>
                        </div>
                    )}
                </div>
            )}
            {/* ====================================================================== */}

            {/* --- 1. FORMULARIO PERSONALIZADO PARA DISEÑO --- */}
            {etapaActual === "diseno" && (
                <>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Variantes de Color Aprobadas para Producción</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Negro/Gris, Azul Francia, Blanco"
                            value={variantesColor}
                            onChange={(e) => setVariantesColor(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Notas / Observaciones del Diseño Técnico</label>
                        <textarea
                            rows={3}
                            placeholder="Detalla especificaciones sobre la ficha técnica, tipos de hilos elegidos, paletas exactas de color o telas aprobadas..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <EvidenciaUpload
                        label="Cargar Boceto, Ficha Técnica o Muestra Virtual Aprobada"
                        onUpload={(url) => setEvidenciaUrl(url)}
                        required={true}
                        disabled={loading}
                        ordenId={orden.id}
                        etapa="diseno"
                        bucketTarget="evidencias-ordenes-produccion"
                    />
                </>
            )}

            {/* --- 2. FORMULARIO PERSONALIZADO PARA PATRONAJE --- */}
            {etapaActual === "patronaje" && (
                <>
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-100">
                        Al avanzar, confirmas que los escalados de tallas de la prenda se encuentran listos para el tendido en la mesa de corte.
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Notas / Observaciones de Patronaje y Moldes</label>
                        <textarea
                            rows={3}
                            placeholder="Anota detalles sobre holguras, encogimiento de la tela, cantidad de moldes físicos por prenda o escalado de tallas..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <EvidenciaUpload
                        label="Cargar Foto de Moldes Físicos o Archivo DXF de Escalados"
                        onUpload={(url) => setEvidenciaUrl(url)}
                        required={true}
                        disabled={loading}
                        ordenId={orden.id}
                        etapa="patronaje"
                        bucketTarget="evidencias-ordenes-produccion"
                    />
                </>
            )}

            {error && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !evidenciaUrl}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:bg-gray-200 disabled:text-gray-400"
            >
                {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <>
                        Completar y enviar a {etapaActual === "diseno" ? "Patronaje" : "Corte"}{" "}
                        <ArrowRight size={14} />
                    </>
                )}
            </button>
        </form>
    );
}