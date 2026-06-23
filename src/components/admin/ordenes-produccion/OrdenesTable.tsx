"use client";

import { Eye, Factory, User, Layers, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ETAPA_LABELS } from "@/lib/schemas/ordenes-produccion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrdenesTableProps {
  data: any[];
  onView: (id: string | number) => void;
  onEtapas: (id: string | number) => void;
  onEdit: (orden: any) => void;
}

export default function OrdenesTable({ data, onView, onEtapas, onEdit }: OrdenesTableProps) {

  function getEtapaColor(etapa?: string) {
    if (!etapa) return "bg-stone-50 text-stone-400 border-stone-200/60";

    const colors: Record<string, string> = {
      diseno: "bg-teal-50 text-teal-700 border-teal-100",
      patronaje: "bg-cyan-50 text-cyan-700 border-cyan-100",
      corte: "bg-indigo-50 text-indigo-700 border-indigo-100",
      confeccion: "bg-amber-50 text-amber-700 border-amber-100",
      remallado: "bg-orange-50 text-orange-700 border-orange-100",
      bordado_estampado: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
      control_calidad: "bg-rose-50 text-rose-700 border-rose-100",
      acabado: "bg-violet-50 text-violet-700 border-violet-100",
      listo_entrega: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
    return colors[etapa.toLowerCase()] || "bg-stone-50 text-stone-400 border-stone-200/60";
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="bg-white border rounded-2xl overflow-hidden shadow-sm"
        style={{ borderColor: 'var(--guor-stone)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead
              className="border-b text-[10px] font-black uppercase tracking-widest"
              style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
            >
              <tr>
                <th className="px-6 py-3.5 opacity-60">ID</th>
                <th className="px-6 py-3.5 opacity-60">Producto / Ficha</th>
                <th className="px-6 py-3.5 opacity-60">Taller Asignado</th>
                <th className="px-6 py-3.5 opacity-60 text-center">Cant.</th>
                <th className="px-6 py-3.5 opacity-60">Estado / Etapa</th>
                <th className="px-6 py-3.5 opacity-60 text-center w-[140px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-neutral-700" style={{ borderColor: 'var(--guor-stone)' }}>
              {(!data || data.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">
                    No se encontraron órdenes de producción.
                  </td>
                </tr>
              ) : (
                data.map((orden) => {
                  const nombreProducto = orden.productos?.nombre || orden.producto?.nombre || orden.nombre_producto || "Producto sin nombre";
                  const versionFicha = orden.fichas_tecnicas?.version || orden.ficha_tecnica?.version || "1.0";
                  const nombreTaller = orden.talleres?.nombre || orden.taller?.nombre || "No asignado";
                  const etapaActual = orden.etapa || orden.etapa_actual || orden.seguimiento_produccion?.[0]?.etapa;

                  return (
                    <tr
                      key={orden.id}
                      className="group hover:bg-neutral-50/60 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-stone-400">
                        #{orden.id}
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="font-bold text-neutral-900 text-sm tracking-tight">
                          {nombreProducto}
                        </div>
                        <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Factory size={11} className="opacity-70" />
                          Ficha Técnica v{versionFicha}
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center border shrink-0 text-stone-500"
                            style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
                          >
                            <User size={12} />
                          </div>
                          <span className="font-semibold text-neutral-700">{nombreTaller}</span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-center">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-md font-black tabular-nums border text-neutral-800"
                          style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
                        >
                          {orden.cantidad_solicitada || orden.cantidad || 0}
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getEtapaColor(etapaActual)}`}>
                          {ETAPA_LABELS[etapaActual as keyof typeof ETAPA_LABELS] || etapaActual || 'Pendiente'}
                        </span>
                        {/* Pequeño tag secundario para el estado comercial */}
                        {orden.estado && orden.estado !== 'borrador' && (
                          <div className="text-[9px] text-stone-400 mt-1 font-medium italic lowercase">
                            ({orden.estado})
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(orden.id)}
                                className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                              >
                                <Eye size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-neutral-900 border-none rounded-md text-white font-semibold text-[10px] px-2 py-1 shadow-md">
                              Ver detalle completo
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEtapas(orden.id)}
                                className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <Layers size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-neutral-900 border-none rounded-md text-white font-semibold text-[10px] px-2 py-1 shadow-md">
                              Gestionar etapas
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(orden)}
                                className="h-7 w-7 p-0 rounded-lg text-stone-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                              >
                                <Pencil size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-neutral-900 border-none rounded-md text-white font-semibold text-[10px] px-2 py-1 shadow-md">
                              Editar información
                            </TooltipContent>
                          </Tooltip>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}