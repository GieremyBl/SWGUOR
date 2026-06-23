"use client";

import { useState } from "react";
import { ArrowLeft, Scissors, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { ConfeccionHeader } from "./ConfeccionHeader";
import ConfeccionSeguimientoTab from "./ConfeccionSeguimientoTab";
import { ConfeccionInfoTab } from "./ConfeccionInfoTab";
import { useConfeccionDetalle } from "@/lib/hooks/useConfecciones";
import { useSeguimientoConfeccion } from "@/lib/hooks/useSeguimientoConfeccion";

const TABS = [
  { id: "info", label: "Información Básica", icon: FileText },
  { id: "seguimiento", label: "Seguimiento y Taller", icon: Clock },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ConfeccionDetalle({ confeccion }: { confeccion: any }) {
  const [activeTab, setActiveTab] = useState<TabId>("info");

  // Este estado local controla de forma reactiva en qué fase de taller está la prenda
  const [etapaActual, setEtapaActual] = useState<string>(confeccion.estado || "1_recepcion_cortes");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const { can, hasRole } = usePermissions();
  const confeccionId = confeccion.id.toString();

  const { updateEstado } = useConfeccionDetalle(confeccionId);
  const { seguimientos } = useSeguimientoConfeccion(confeccionId);

  const puedeActualizar =
    hasRole(["administrador", "gerente", "representante_taller"]) ||
    can("update_status", "confecciones");

  const handleEstadoFromInfo = async (nuevoEstado: string) => {
    setIsUpdating(true);
    try {
      await updateEstado(nuevoEstado);
      setEtapaActual(nuevoEstado);
    } catch (error) {
      console.error("Error al mutar estado:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

        {/* Header Superior Navegación */}
        <div>
          <Link
            href="/admin/Panel-Administrative/confecciones"
            className="inline-flex items-center gap-1.5 text-pink-600 hover:text-pink-700 text-xs font-bold uppercase tracking-widest mb-3 transition-colors"
          >
            <ArrowLeft size={13} />
            Volver a Confecciones
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-600 rounded-xl">
                <Scissors className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{confeccion.prenda}</h1>
                <p className="text-xs text-gray-400 mt-0.5">Orden de Confección <span className="font-mono font-bold">#{confeccion.id}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas informativas superiores (Taller asignado, fechas, cantidades) */}
        <ConfeccionHeader confeccion={confeccion} />

        {/* Botones selectores de Pestañas (Tabs) */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === id
                ? "bg-pink-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Icon size={13} />
              {label}
              {id === "seguimiento" && seguimientos.length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                  {seguimientos.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pestaña 1: Información General */}
        {activeTab === "info" && (
          <ConfeccionInfoTab
            confeccion={confeccion}
            estadoActual={etapaActual}
            puedeActualizar={puedeActualizar}
            isLoading={isUpdating}
            onEstadoChange={handleEstadoFromInfo}
          />
        )}

        {/* Pestaña 2: Mapeo por Etapas y Stepper (Seguimiento Centralizado) */}
        {activeTab === "seguimiento" && (
          <ConfeccionSeguimientoTab
            confeccion={confeccion}
            etapaActual={etapaActual}
            puedeActualizar={puedeActualizar}
            onEtapaChanged={setEtapaActual}
          />
        )}
      </div>
    </div>
  );
}