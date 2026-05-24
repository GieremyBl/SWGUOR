import { Clock, Eye, Info } from "lucide-react";
import { ETAPA_LABELS } from "@/lib/schemas/ordenes-produccion";
import { SectionCard } from "./shared/SectionCard";
import { Badge } from "./shared/Badge";

interface Props {
    orden: any;
}

export function VistaLectura({ orden }: Props) {
    return (
        <SectionCard>
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                {/* Icon */}
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl flex items-center justify-center border-2 border-amber-200">
                        <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
                    </div>
                </div>

                {/* Title */}
                <div>
                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        Etapa en Progreso
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        Asignada a otro equipo
                    </p>
                </div>

                {/* Current Stage Badge */}
                <Badge
                    label={ETAPA_LABELS[orden.seguimiento_produccion?.[0]?.etapa as keyof typeof ETAPA_LABELS] ?? "Pendiente"}
                    color="bg-amber-50 text-amber-700 border border-amber-200 font-semibold"
                />

                {/* Description */}
                <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-md">
                    <div className="flex items-start gap-3">
                        <Eye className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-slate-700">
                                Puedes monitorear el progreso
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Observa el avance en la barra de seguimiento principal
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 bg-blue-50 rounded-xl p-4 border border-blue-100 max-w-md">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-blue-900">
                                Actualizaciones automáticas
                            </p>
                            <p className="text-xs text-blue-700 mt-0.5">
                                La orden se actualiza cuando el equipo responsable completa la etapa
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Footer */}
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Si esperas cambios, recarga la página o vuelve al listado de órdenes para ver actualizaciones
                </p>
            </div>
        </SectionCard>
    );
}