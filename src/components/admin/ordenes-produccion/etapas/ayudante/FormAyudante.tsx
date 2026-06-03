"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { ETAPA_LABELS } from "@/lib/schemas/ordenes-produccion";
import { SectionCard } from "../shared/SectionCard";
import { FieldLabel } from "../shared/FieldLabel";
import { SubmitButton } from "../shared/SubmitButton";

interface Props {
    orden: any;
    onComplete: () => void;
}

export function FormAyudante({ orden, onComplete }: Props) {
    const [obs, setObs] = useState<string>(orden.observaciones_acabado ?? "");
    const [loading, setLoading] = useState(false);

    const etapaLabel = ETAPA_LABELS[orden.etapa as keyof typeof ETAPA_LABELS] ?? orden.etapa;
    const isUltima = orden.etapa === "acabado";

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/ordenes-produccion/${orden.id}/etapa`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    observaciones_acabado: obs,
                    completar: true,
                }),
            });
            if (!res.ok) throw new Error();
            toast.success(
                isUltima
                    ? "¡Orden lista para entrega!"
                    : `${etapaLabel} completado — avanzando a la siguiente etapa`
            );
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
                <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800">{etapaLabel}</p>
                    <p className="text-xs text-slate-400">Registra el avance y completa la etapa</p>
                </div>
            </div>

            {/* Observaciones */}
            <div>
                <FieldLabel>Observaciones</FieldLabel>
                <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={4}
                    placeholder={`Notas sobre ${etapaLabel.toLowerCase()}, calidad, incidencias...`}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
            </div>

            <SubmitButton
                loading={loading}
                onClick={handleSubmit}
                color="teal"
                label={isUltima ? "Marcar como lista para entrega" : `Completar ${etapaLabel} y avanzar`}
            />
        </SectionCard>
    );
}