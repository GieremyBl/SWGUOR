"use client";

import { ETAPAS_PRODUCCION } from "@/lib/schemas/ordenes-produccion";
import { FormDisenador } from "./disenador/FormDisenador";
import { FormCortador } from "./cortador/FormCortador";
import { FormRepresentanteTaller } from "./taller/FormTaller";
import { FormAyudante } from "./ayudante/FormAyudante";
import { VistaLectura } from "./VistaLectura";

type Rol =
    | "gerente" | "administrador" | "recepcionista"
    | "disenador" | "cortador" | "ayudante"
    | "representante_taller" | "cliente" | "almacenero";

// Mapeo exacto de qué fases puede editar cada rol operativo
const ROL_ETAPAS: Partial<Record<Rol, string[]>> = {
    disenador: ["diseno", "patronaje"],
    cortador: ["corte"],
    representante_taller: ["confeccion"],
    ayudante: ["remallado", "bordado_estampado", "acabado", "listo_entrega"],
    administrador: ["control_calidad", ...ETAPAS_PRODUCCION],
    gerente: ["control_calidad", ...ETAPAS_PRODUCCION],
};

interface Props {
    orden: any;
    rol: Rol;
    onComplete: () => void;
}

export function FormSelector({ orden, rol, onComplete }: Props) {
    const permitidas = ROL_ETAPAS[rol] ?? [];

    const etapa = (orden.etapa || "diseno").toLowerCase().trim();

    if (!permitidas.includes(etapa)) return <VistaLectura orden={orden} />;

    if (rol === "administrador" || rol === "gerente") {
        if (["diseno", "patronaje"].includes(etapa)) {
            return <FormDisenador orden={orden} onComplete={onComplete} />;
        }
        if (etapa === "corte") {
            return <FormCortador orden={orden} onComplete={onComplete} />;
        }
        if (etapa === "confeccion") {
            return <FormRepresentanteTaller orden={orden} onComplete={onComplete} />;
        }
        if (["remallado", "bordado_estampado", "control_calidad", "acabado", "listo_entrega"].includes(etapa)) {
            return <FormAyudante orden={orden} onComplete={onComplete} />;
        }
    }

    if (rol === "disenador") return <FormDisenador orden={orden} onComplete={onComplete} />;
    if (rol === "cortador") return <FormCortador orden={orden} onComplete={onComplete} />;
    if (rol === "representante_taller") return <FormRepresentanteTaller orden={orden} onComplete={onComplete} />;
    if (rol === "ayudante") return <FormAyudante orden={orden} onComplete={onComplete} />;

    return <VistaLectura orden={orden} />;
}