"use client";

import React, { memo, useState } from "react";
import { Scissors } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ESTADO_CONFECCION } from "@/lib/schemas/confecciones";
import ConfeccionRow from "@/components/admin/confecciones/ConfeccionesRow";
import type { EtapaConfeccion } from "@prisma/client";
import ConfeccionStepper from "./ConfeccionStepper";
import FormularioAvance from "./etapa/FormularioAvance";

const LABELS_TRADUCCION = {
  "recepcion_cortes": "Recepción de Cortes",
  "confeccion_y_remalle": "Confección y Remalle",
  "acabado_y_limpieza": "Acabado y Limpieza",
  "planchado_y_empaque": "Planchado y Empaque",
  "entregado_a_guor": "Entregado a GUOR",
};

export type ConfeccionRow_T = {
  id: number;
  talleres?: { id: number; nombre: string } | null;
  prenda: string;
  cantidad: number;
  costo_unitario: number | null;
  fecha_entrega: string | null;
  prioridad: "baja" | "media" | "alta" | "urgente";
  estado: typeof ESTADO_CONFECCION[number];
  created_at: string;
  ordenes_produccion?: {
    id: number;
    estado: string;
    cantidad_solicitada: number;
    pedidos?: {
      id: number;
      estado: string;
      clientes?: {
        id: number;
        razon_social: string;
        nombre_comercial: string;
      };
    };
  };
};

interface ConfeccionesTableProps {
  data: ConfeccionRow_T[];
  isLoading: boolean;
  talleres: { id: string | number; nombre: string }[];
  onRefresh: () => void;
}

function ConfeccionesTable({
  data,
  isLoading,
  talleres,
  onRefresh,
}: ConfeccionesTableProps) {
  // Estado para controlar qué fila expandir
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Estados para el Modal Interceptor de notas
  const [modalOpen, setModalOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<ConfeccionRow_T | null>(null);
  const [proximaEtapa, setProximaEtapa] = useState<EtapaConfeccion | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Intercepta el evento "onCambiarEtapa" del Stepper para abrir el formulario primero
  const handleIntentarCambioEtapa = (orden: ConfeccionRow_T, nuevaEtapa: EtapaConfeccion) => {
    setOrdenSeleccionada(orden);
    setProximaEtapa(nuevaEtapa);
    setModalOpen(true);
  };

  const handleConfirmarServidor = async (notas: string) => {
    if (!ordenSeleccionada || !proximaEtapa) return;

    try {
      const res = await fetch(`/api/admin/confecciones/${ordenSeleccionada.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: proximaEtapa,
          notas: notas
        }),
      });

      if (!res.ok) throw new Error();

      setModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error(error);
      throw new Error("No se pudo procesar el avance del taller.");
    }
  };

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Orden</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Taller</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Cantidad</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Prioridad</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Entrega</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="bg-white border-y border-slate-100 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-6 w-24 mx-auto rounded-lg" />
                  </td>
                  <td className="bg-white border-y border-slate-100 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-5 w-12 mx-auto rounded-md" />
                  </td>
                  <td className="bg-white border-y border-slate-100 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                  </td>
                  <td className="bg-white border-y border-slate-100 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </td>
                  <td className="bg-white border-y border-slate-100 py-5 px-6 text-center shadow-sm">
                    <Skeleton className="h-4 w-24 mx-auto rounded-md" />
                  </td>
                  <td className="bg-white border-y border-r border-slate-100 py-5 px-6 rounded-r-2xl text-right shadow-sm">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Scissors className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                      No hay órdenes de confección
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((orden) => {
                const isExpanded = expandedRowId === orden.id;

                // Conversión/Casteo seguro para que coincida con el tipado estricto del taller físico
                const estadoTallerValido = (
                  orden.estado === "pendiente" || orden.estado === "en_proceso"
                    ? "1_recepcion_cortes"
                    : orden.estado === "completada"
                      ? "5_entregado_a_guor"
                      : orden.estado
                ) as EtapaConfeccion;

                return (
                  <React.Fragment key={orden.id}>
                    {/* Fila Maestra de Datos */}
                    <tr
                      onClick={() => toggleRow(orden.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      <ConfeccionRow
                        orden={orden}
                        talleres={talleres}
                        onRefresh={onRefresh}
                      />
                    </tr>

                    {/* Fila Desplegable: Aloja el Stepper que nos compartiste */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-white border-x border-b border-slate-100/70 rounded-b-2xl p-6 shadow-inner transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-w-4xl mx-auto">
                            <ConfeccionStepper
                              etapaActual={estadoTallerValido}
                              prendaNombre={orden.prenda}
                              cantidadPrendas={orden.cantidad}
                              onCambiarEtapa={(proxima) => handleIntentarCambioEtapa(orden, proxima)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal interceptor global */}
      <FormularioAvance
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        etapaAnteriorLabel={
          ordenSeleccionada
            ? LABELS_TRADUCCION[
            (ordenSeleccionada.estado === "pendiente" || ordenSeleccionada.estado === "en_proceso"
              ? "recepcion_cortes"
              : ordenSeleccionada.estado === "completada"
                ? "entregado_a_guor"
                : ordenSeleccionada.estado) as EtapaConfeccion
            ] || ordenSeleccionada.estado
            : ""
        }
        etapaNuevaLabel={proximaEtapa ? LABELS_TRADUCCION[proximaEtapa] : ""}
        onConfirmar={handleConfirmarServidor}
      />
    </>
  );
}

export default memo(ConfeccionesTable);