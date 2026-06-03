import { ETAPAS_PRODUCCION } from "@/lib/schemas/ordenes-produccion";
import { FormDisenador } from "./disenador/FormDisenador";
import { FormCortador } from "./cortador/FormCortador";
import { FormTaller } from "./taller/FormTaller";
import { FormAyudante } from "./ayudante/FormAyudante";
import { VistaLectura } from "./VistaLectura";

type Rol =
    | "gerente" | "administrador" | "recepcionista"
    | "disenador" | "cortador" | "ayudante"
    | "representante_taller" | "cliente" | "almacenero";

// Qué etapas puede operar cada rol
const ROL_ETAPAS: Partial<Record<Rol, string[]>> = {
    disenador: ["diseno", "patronaje"],
    cortador: ["corte"],
    representante_taller: ["confeccion"],
    ayudante: ["remallado", "bordado_estampado", "acabado"],
    administrador: [...ETAPAS_PRODUCCION],
    gerente: [...ETAPAS_PRODUCCION],
};

interface Props {
    orden: any;
    rol: Rol;
    onComplete: () => void;
}

export function FormSelector({ orden, rol, onComplete }: Props) {
    const permitidas = ROL_ETAPAS[rol] ?? [];
    const etapa = (orden.seguimiento_produccion?.[0]?.etapa || "diseno") as string;

    // Sin acceso a la etapa actual
    if (!permitidas.includes(etapa)) return <VistaLectura orden={orden} />;

    // Formularios por rol específico
    if (rol === "disenador") return <FormDisenador orden={orden} onComplete={onComplete} />;
    if (rol === "cortador") return <FormCortador orden={orden} onComplete={onComplete} />;
    if (rol === "representante_taller") return <FormTaller orden={orden} onComplete={onComplete} />;
    if (rol === "ayudante") return <FormAyudante orden={orden} onComplete={onComplete} />;

    // Admin / Gerente: ven el formulario correspondiente a la etapa activa
    if (["diseno", "patronaje"].includes(etapa)) return <FormDisenador orden={orden} onComplete={onComplete} />;
    if (etapa === "corte") return <FormCortador orden={orden} onComplete={onComplete} />;
    if (etapa === "confeccion") return <FormTaller orden={orden} onComplete={onComplete} />;
    if (["remallado", "bordado_estampado", "acabado"].includes(etapa)) return <FormAyudante orden={orden} onComplete={onComplete} />;

    return <VistaLectura orden={orden} />;
}