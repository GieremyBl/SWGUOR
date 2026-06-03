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
  return (
    <TooltipProvider delayDuration={150}>
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Producto / Ficha</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Taller Asignado</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Cant.</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center w-[160px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron órdenes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                data.map((orden) => (
                  <tr
                    key={orden.id}
                    className="group hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400">
                      #{orden.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {orden.productos?.nombre}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Factory size={10} />
                        Ficha Técnica v{orden.fichas_tecnicas?.version || '1.0'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <span className="font-medium text-slate-600">{orden.talleres?.nombre}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-slate-100 px-2 py-1 rounded-md font-black text-slate-700 min-w-[30px]">
                        {orden.cantidad_solicitada}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getEtapaColor(orden.seguimiento_produccion?.[0]?.etapa)}`}>
                        {ETAPA_LABELS[orden.seguimiento_produccion?.[0]?.etapa as keyof typeof ETAPA_LABELS] || 'Pendiente'}
                      </span>
                    </td>

                    {/* Fila de íconos de acción con Tooltips individuales */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(orden.id)}
                              className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Eye size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border-none rounded-lg text-white font-medium text-xs px-2.5 py-1.5 shadow-md">
                            Ver detalle completo
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEtapas(orden.id)}
                              className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Layers size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border-none rounded-lg text-white font-medium text-xs px-2.5 py-1.5 shadow-md">
                            Gestionar etapas de producción
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(orden)}
                              className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Pencil size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border-none rounded-lg text-white font-medium text-xs px-2.5 py-1.5 shadow-md">
                            Editar información general
                          </TooltipContent>
                        </Tooltip>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}

function getEtapaColor(etapa: string) {
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
  return colors[etapa] || "bg-slate-50 text-slate-400 border-slate-100";
}