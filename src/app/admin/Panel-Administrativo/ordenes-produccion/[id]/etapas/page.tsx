"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useOrdenesProduccion } from "@/lib/hooks/useOrdenProduccion";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ETAPAS_PRODUCCION, ETAPA_LABELS } from "@/lib/schemas/ordenes-produccion";
import OrdenStepper from "@/components/admin/ordenes-produccion/OrdenStepper";
import { FormSelector, Badge } from "@/components/admin/ordenes-produccion/etapas";

type Rol =
    | "gerente" | "administrador" | "recepcionista"
    | "disenador" | "cortador" | "ayudante"
    | "representante_taller" | "cliente" | "almacenero";

export default function OrdenEtapasPage() {
    const params = useParams();
    const router = useRouter();
    const targetId = params?.id ? String(params.id) : "";

    const { ordenes, isLoading, refetch } = useOrdenesProduccion({ page: 1, limit: 100 });
    const orden = ordenes?.find((o: any) => o.id.toString() === targetId);

    const [rolActual, setRolActual] = useState<Rol | null>(null);

    useEffect(() => {
        const fetchRol = async () => {
            const supabase = getSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("usuarios")
                .select("rol")
                .eq("auth_id", user.id)
                .single();
            if (data?.rol) setRolActual(data.rol as Rol);
        };
        fetchRol();
    }, []);

    if (isLoading || !rolActual) return (
        <div className="p-8 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="animate-spin w-5 h-5" />
            <span className="text-sm">Cargando...</span>
        </div>
    );

    if (!orden) return (
        <div className="p-8 text-center text-sm text-slate-500">Orden no encontrada</div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/admin/Panel-Administrativo/ordenes-produccion")}
                    className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 hover:text-slate-700 transition-colors hover:gap-3"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a producción
                </button>

                {/* Header Section */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
                                Control de Etapas
                            </h1>
                            <p className="text-slate-500 mt-2 flex items-center gap-2">
                                <span className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg">Orden #{orden.id}</span>
                                <span>•</span>
                                <span className="font-semibold">{orden.productos?.nombre || "Producto no especificado"}</span>
                            </p>
                        </div>
                        <Badge
                            label={ETAPA_LABELS[orden.seguimiento_produccion?.[0]?.etapa as keyof typeof ETAPA_LABELS] ?? "Pendiente"}
                            color="bg-rose-50 text-rose-600 border border-rose-100"
                        />
                    </div>
                </div>

                {/* Stepper */}
                <OrdenStepper etapas={ETAPAS_PRODUCCION} etapaActual={orden.seguimiento_produccion?.[0]?.etapa || "diseno"} />

                {/* Formulario según rol activo */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    <FormSelector
                        orden={orden}
                        rol={rolActual}
                        onComplete={() => refetch?.()}
                    />
                </div>
            </div>
        </div>
    );
}