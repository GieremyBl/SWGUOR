"use client";

import { Lock, Eye } from "lucide-react";

interface Props {
    orden: any;
}

export function VistaLectura({ orden }: Props) {
    const etapaHumanizada = (orden.etapa || "diseño")
        .replace("_", " ")
        .replace("diseno", "diseño")
        .replace("confeccion", "confección")
        .replace("control_calidad", "control de calidad");

    return (
        <div className="w-full bg-gray-50 border border-gray-200/60 rounded-2xl p-6 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-200/50 text-gray-500">
                <Lock size={18} />
            </div>
            <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center justify-center gap-1.5">
                    <Eye size={14} className="text-gray-400" /> Vista de Solo Lectura
                </h4>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Esta orden se encuentra actualmente en la fase de <span className="font-bold text-gray-800 capitalize">"{etapaHumanizada}"</span>. Tu cuenta actual no posee permisos asignados para alterar este hito.
                </p>
            </div>
        </div>
    );
}