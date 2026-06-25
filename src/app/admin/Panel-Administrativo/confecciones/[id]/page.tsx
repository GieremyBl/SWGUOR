"use client";

import { useState } from "react";
import { ArrowLeft, Scissors, Clock, FileText, TrendingUp, User, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { ConfeccionHeader } from "@/components/admin/confecciones/detalle/ConfeccionHeader";
import { ConfeccionInfoTab } from "@/components/admin/confecciones/detalle/ConfeccionInfoTab";

import { useConfeccionDetalle } from "@/lib/hooks/useConfecciones";
import { useSeguimientoConfeccion } from "@/lib/hooks/useSeguimientoConfeccion";
import ConfeccionSeguimientoTab from "@/components/admin/confecciones/ConfeccionSeguimientoTab";

const TABS = [
  { id: "info", label: "Ficha Técnica e Instrucciones", icon: FileText },
  { id: "seguimiento", label: "Historial de Cambios", icon: Clock },
] as const;

type TabId = typeof TABS[number]["id"];

interface Props {
  confeccion: any;
}

export default function ConfeccionDetalle({ confeccion }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("info");

  // Control reactivo del estado de la fase física del taller
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
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 1. HEADER NAVEGACIÓN Y ACCIONES */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/admin/Panel-Administrative/confecciones"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-pink-600 uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={14} />
              Volver a Confecciones
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-600 rounded-xl shadow-sm text-white">
                <Scissors size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {confeccion.prenda}
                  <span className={`text-[10px] px-2.5 py-0.5 font-bold uppercase rounded-full border ${
                    confeccion.prioridad === "urgente" ? "bg-red-50 text-red-700 border-red-100" :
                    confeccion.prioridad === "alta" ? "bg-orange-50 text-orange-700 border-orange-100" :
                    "bg-slate-50 text-slate-600 border-slate-100"
                  }`}>
                    {confeccion.prioridad || "Media"}
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Orden de Confección <span className="font-mono font-bold">#{confeccion.id}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas del Sistema */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Link
              href="/admin/confecciones/etapas"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
            >
              <TrendingUp size={14} /> Pipeline General
            </Link>
          </div>
        </div>

        {/* 2. COMPONENTE DE MÉTRICAS / RESUMEN */}
        <ConfeccionHeader confeccion={confeccion} />

        {/* 3. LAYOUT DOBLE COLUMNA (Contenido Principal vs Información Lateral Fija) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: Tabs Interactivos con Lógica de Negocio */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              
              {/* Selectores de Pestañas Estilizados */}
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                      activeTab === id
                        ? "border-pink-600 text-pink-600 bg-white"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                    {id === "seguimiento" && seguimientos.length > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        activeTab === id ? "bg-pink-100 text-pink-700" : "bg-slate-200/70 text-slate-600"
                      }`}>
                        {seguimientos.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Inyección de Sub-Componentes Dinámicos */}
              <div className="p-6">
                {activeTab === "info" ? (
                  <ConfeccionInfoTab
                    confeccion={confeccion}
                    estadoActual={etapaActual}
                    puedeActualizar={puedeActualizar}
                    isLoading={isUpdating}
                    onEstadoChange={handleEstadoFromInfo}
                  />
                ) : (
                  <ConfeccionSeguimientoTab
                    confeccion={confeccion}
                    etapaActual={etapaActual}
                    puedeActualizar={puedeActualizar}
                    onEtapaChanged={setEtapaActual}
                  />
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Datos del Taller Externo y Contexto del Pedido */}
          <div className="space-y-6">
            
            {/* Tarjeta de Contacto de Operaciones */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Contacto del Taller Asignado
              </h3>
              
              {confeccion.taller ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-100">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {confeccion.taller.contacto || "Sin contacto directo"}
                      </p>
                      <p className="text-xs text-slate-400">Encargado / Supervisor</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="font-bold text-slate-700">{confeccion.taller.telefono ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">E-mail:</span>
                      <span className="font-bold text-slate-700 text-right truncate max-w-[180px]">
                        {confeccion.taller.email ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No hay información de taller vinculada.</p>
              )}
            </div>

            {/* Tarjeta Comercial: Estado del Pedido en el ERP */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl text-white p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-start">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Vínculo Comercial
                </h3>
                <span className="text-[9px] bg-white/10 text-white/80 font-mono px-1.5 py-0.5 rounded">
                  ERP Sync
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Cliente Principal</p>
                  <p className="text-sm font-bold text-slate-100 mt-0.5">
                    {confeccion.pedido?.cliente?.nombre_comercial || 
                     confeccion.pedido?.cliente?.razon_social || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Fase del Pedido General</p>
                  <span className="inline-block mt-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-200">
                    {confeccion.pedido?.estado || "En Producción Lote"}
                  </span>
                </div>
              </div>
            </div>

            {/* Restricción de Roles / Informativo de seguridad */}
            {!puedeActualizar && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-2.5 text-amber-800">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Tu usuario actual no posee permisos de edición sobre esta orden de producción. Solo lectura.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}