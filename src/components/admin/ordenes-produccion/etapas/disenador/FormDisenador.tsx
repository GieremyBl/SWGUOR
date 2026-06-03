"use client";

import { useState } from "react";
import { FileText, Upload, CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "../shared/SectionCard";
import { FieldLabel } from "../shared/FieldLabel";
import { SubmitButton } from "../shared/SubmitButton";

interface Props {
    orden: any;
    onComplete: () => void;
}

export function FormDisenador({ orden, onComplete }: Props) {
    const [obs, setObs] = useState<string>(orden.observaciones_diseno ?? "");
    const [fechaEntrega, setFecha] = useState<string>(orden.fecha_entrega_corte ?? "");
    const [patronaje, setPatronaje] = useState<"aprobado" | "rechazado" | "">(orden.estado_patronaje ?? "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!patronaje) {
            toast.error("Indica si el patronaje está aprobado o rechazado");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/ordenes-produccion/${orden.id}/etapa`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    observaciones_diseno: obs,
                    fecha_entrega_corte: fechaEntrega || null,
                    estado_patronaje: patronaje,
                    completar: true,
                }),
            });
            if (!res.ok) throw new Error();
            toast.success("Etapa completada — avanzando a Corte");
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
                <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-800">Diseño & Patronaje</p>
                    <p className="text-xs text-slate-400">Completa todos los campos para avanzar a Corte</p>
                </div>
            </div>

            {/* Ficha técnica */}
            <div>
                <FieldLabel>Ficha técnica</FieldLabel>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-colors group">
                    <Upload className="w-7 h-7 text-slate-300 group-hover:text-violet-500 mb-2 transition-colors" />
                    <span className="text-xs text-slate-400 group-hover:text-violet-500 font-medium transition-colors">
                        Arrastra o haz clic para subir PDF / imagen
                    </span>
                    <input type="file" accept=".pdf,image/*" className="hidden" />
                </label>
            </div>

            {/* Estado patronaje */}
            <div>
                <FieldLabel required>Estado del patronaje</FieldLabel>
                <div className="flex gap-3">
                    {(["aprobado", "rechazado"] as const).map((val) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => setPatronaje(val)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all capitalize ${patronaje === val
                                    ? val === "aprobado"
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-rose-500 bg-rose-50 text-rose-700"
                                    : "border-slate-200 text-slate-400 hover:border-slate-300"
                                }`}
                        >
                            {val === "aprobado"
                                ? <CheckCircle2 className="w-4 h-4" />
                                : <XCircle className="w-4 h-4" />}
                            {val.charAt(0).toUpperCase() + val.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fecha entrega al cortador */}
            <div>
                <FieldLabel>Fecha de entrega al cortador</FieldLabel>
                <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                        type="date"
                        value={fechaEntrega}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
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
                    placeholder="Notas sobre el diseño, materiales, instrucciones especiales..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
            </div>

            <SubmitButton loading={loading} onClick={handleSubmit} label="Completar y avanzar a Corte" color="violet" />
        </SectionCard>
    );
}