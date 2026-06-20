"use client";

import { memo, useState } from "react";
import { Eye, Scissors, Calendar, Pencil, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ESTADO_LABELS, PRIORIDAD_LABELS } from "@/lib/schemas/confecciones";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ConfeccionRow_T } from "./ConfeccionesTable";
import { useRouter } from "next/navigation";
import { CerrarConfeccionModal } from "./CerrarConfeccionModal";
import { EditarConfeccionModal } from "./EditarConfeccionModal";

export const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-slate-50  text-slate-600  border-slate-200",
  en_proceso: "bg-blue-50   text-blue-600   border-blue-200",
  completada: "bg-emerald-50 text-emerald-600 border-emerald-200",
  rechazada: "bg-rose-50   text-rose-600   border-rose-200",
  cancelada: "bg-zinc-50   text-zinc-500   border-zinc-200",
};

export const PRIORIDAD_BADGE: Record<string, string> = {
  baja: "bg-slate-50 text-slate-500 border-slate-200",
  media: "bg-sky-50   text-sky-600   border-sky-200",
  alta: "bg-orange-50 text-orange-600 border-orange-200",
  urgente: "bg-red-50   text-red-600   border-red-200",
};

const PRIORIDAD_DOT: Record<string, string> = {
  baja: "bg-slate-400",
  media: "bg-sky-500",
  alta: "bg-orange-500",
  urgente: "bg-red-500",
};

const PUEDE_CERRAR = ["pendiente", "en_proceso"];

interface ConfeccionRowProps {
  orden: ConfeccionRow_T;
  talleres: { id: string | number; nombre: string }[];
  onRefresh: () => void;
}

const ConfeccionRow = memo(({ orden, talleres, onRefresh }: ConfeccionRowProps) => {
  const [editarOpen, setEditarOpen] = useState(false);
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const router = useRouter();
  const iniciales = (orden.prenda ?? "??").substring(0, 2).toUpperCase();
  const puedeCerrar = PUEDE_CERRAR.includes(orden.estado);

  return (
    <>
      <tr className="group transition-all duration-200">
        {/* Prenda */}
        <td className="bg-white border-y border-l border-slate-100 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md group-hover:bg-slate-50 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-black text-sm border border-pink-100 uppercase group-hover:scale-110 transition-transform shrink-0">
              {iniciales}
            </div>
            <div className="min-w-0">
              <span className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none">
                {orden.prenda}
              </span>
              <div className="text-slate-400 text-[11px] font-medium mt-1">
                #{orden.id}
                {orden.ordenes_produccion?.pedidos?.id && (
                  <span className="ml-1.5">· Pedido #{orden.ordenes_produccion.pedidos.id}</span>
                )}
              </div>
              {orden.costo_unitario != null && (
                <div className="text-pink-600 font-black text-sm mt-1">
                  S/ {orden.costo_unitario.toFixed(2)}
                  <span className="text-slate-400 font-medium text-[10px] ml-1">/ unidad</span>
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Taller */}
        <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
          <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
            <Scissors size={10} />
            {orden.talleres?.nombre ?? "—"}
          </div>
        </td>

        {/* Cantidad */}
        <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-slate-900">
              {orden.cantidad.toLocaleString("es-PE")}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unidades</span>
          </div>
        </td>

        {/* Prioridad */}
        <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
          <Badge
            variant="outline"
            className={`rounded-full px-3 py-1 text-[9px] font-black border-2 uppercase inline-flex items-center gap-1.5 ${PRIORIDAD_BADGE[orden.prioridad]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORIDAD_DOT[orden.prioridad]}`} />
            {PRIORIDAD_LABELS[orden.prioridad]}
          </Badge>
        </td>

        {/* Estado */}
        <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
          <Badge
            variant="outline"
            className={`rounded-full px-3 py-1 text-[9px] font-black border-2 uppercase ${ESTADO_BADGE[orden.estado] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
          >
            {ESTADO_LABELS[orden.estado] ?? orden.estado}
          </Badge>
        </td>

        {/* Fecha entrega */}
        <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
          {orden.fecha_entrega ? (
            <div className="inline-flex items-center gap-1.5 text-slate-600 text-[11px] font-semibold">
              <Calendar size={11} className="text-slate-400" />
              {format(new Date(orden.fecha_entrega), "d MMM yyyy", { locale: es })}
            </div>
          ) : (
            <span className="text-slate-300 text-xs">—</span>
          )}
        </td>

        {/* Acciones */}
        <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:bg-slate-50 transition-all">
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/admin/Panel-Administrativo/confecciones/${orden.id}`)}
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditarOpen(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Pencil size={16} />
            </Button>
            {puedeCerrar && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCerrarOpen(true)}
                className="text-rose-500 hover:text-rose-700"
                title="Rechazar o cancelar orden"
              >
                <XCircle size={16} />
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Los Dialog usan portales → se montan en document.body, no rompen el DOM de la tabla */}
      <EditarConfeccionModal
        open={editarOpen}
        onOpenChange={setEditarOpen}
        orden={orden}
        talleres={talleres}
        onSuccess={onRefresh}
      />
      <CerrarConfeccionModal
        open={cerrarOpen}
        onOpenChange={(v: boolean) => { if (!v) setCerrarOpen(false); }}
        orden={orden}
        onSuccess={() => {
          setCerrarOpen(false);
          onRefresh();
        }}
      />
    </>
  );
});

ConfeccionRow.displayName = "ConfeccionRow";
export default ConfeccionRow;