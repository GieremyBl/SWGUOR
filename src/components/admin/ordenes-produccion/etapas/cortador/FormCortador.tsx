"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "../shared/SectionCard";
import { FieldLabel } from "../shared/FieldLabel";
import { SubmitButton } from "../shared/SubmitButton";

interface Props {
    orden: any;
    onComplete: () => void;
}

export function FormCortador({ orden, onComplete }: Props) {
    const [piezas, setPiezas] = useState<string>(orden.piezas_cortadas ?? "");
    const [merma, setMerma] = useState<string>(orden.merma_tela ?? "");
    const [obs, setObs] = useState<string>(orden.observaciones_corte ?? "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!piezas) {
            toast.error("Ingresa la cantidad de piezas cortadas");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/ordenes-produccion/${orden.id}/etapa`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    piezas_cortadas: Number(piezas),
                    merma_tela: merma ? Number(merma) : null,
                    observaciones_corte: obs,
                    completar: true,
                }),
            });
            if (!res.ok) throw new Error();
            toast.success("Etapa completada — avanzando a Confección");
            onComplete();
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
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800">Corte</p>
                    <p className="text-xs text-slate-400">Registra las piezas cortadas para avanzar a Confección</p>
                </div>
            </div>

            {/* Piezas + Merma */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <FieldLabel required>Piezas cortadas</FieldLabel>
                    <input
                        type="number"
                        min={1}
                        value={piezas}
                        onChange={(e) => setPiezas(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>
                <div>
                    <FieldLabel>Merma de tela (m)</FieldLabel>
                    <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={merma}
                        onChange={(e) => setMerma(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>
            </div>

            {/* Observaciones */}
            <div>
                <FieldLabel>Observaciones</FieldLabel>
                <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={3}
                    placeholder="Tallas, incidencias, notas del corte..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
            </div>

            <SubmitButton loading={loading} onClick={handleSubmit} label="Completar y avanzar a Confección" color="amber" />
        </SectionCard>
    );
}