"use client";

import { memo }        from "react";
import { useRouter }   from "next/navigation";
import { Eye, ChevronRight, Scissors, Calendar, Pencil, XCircle, ClipboardCheck } from "lucide-react";
import { Button }      from "@/components/ui/button";
import { Badge }       from "@/components/ui/badge";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { ESTADO_LABELS, PRIORIDAD_LABELS } from "@/lib/schemas/confecciones";
import { format } from "date-fns";
import { es }    from "date-fns/locale";
import type { ConfeccionRow_T } from "./ConfeccionesTable";

// ── Mapas de color ────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  pendiente:  "bg-slate-50  text-slate-600  border-slate-200",
  en_corte:   "bg-blue-50   text-blue-600   border-blue-200",
  en_costura: "bg-violet-50 text-violet-600 border-violet-200",
  acabados:   "bg-amber-50  text-amber-600  border-amber-200",
  completado: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelado:  "bg-rose-50   text-rose-600   border-rose-200",
};

const PRIORIDAD_BADGE: Record<string, string> = {
  baja:    "bg-slate-50  text-slate-500  border-slate-200",
  media:   "bg-sky-50    text-sky-600    border-sky-200",
  alta:    "bg-orange-50 text-orange-600 border-orange-200",
  urgente: "bg-red-50    text-red-600    border-red-200",
};

const PRIORIDAD_DOT: Record<string, string> = {
  baja:    "bg-slate-400",
  media:   "bg-sky-500",
  alta:    "bg-orange-500",
  urgente: "bg-red-500",
};

// Estados siguientes válidos para avanzar
const SIGUIENTE_ESTADO: Partial<Record<string, string[]>> = {
  pendiente:  ["en_corte",   "cancelado"],
  en_corte:   ["en_costura", "cancelado"],
  en_costura: ["acabados",   "cancelado"],
  acabados:   ["completado", "cancelado"],
};

// ── Componente ────────────────────────────────────────────────

interface ConfeccionRowProps {
  orden:          ConfeccionRow_T;
  onEstadoChange: (id: number, estado: ConfeccionRow_T["estado"]) => void;
}

const ConfeccionRow = memo(({ orden, onEstadoChange }: ConfeccionRowProps) => {
  const router     = useRouter();
  const { can, hasRole } = usePermissions();

  const puedeActualizar =
    hasRole(["administrador", "gerente", "representante_taller", "disenador"]) ||
    can("update_status", "confecciones");
  const puedeConformidad = hasRole(["ayudante", "administrador", "gerente"]);

  const siguientes = SIGUIENTE_ESTADO[orden.estado] ?? [];
  const iniciales  = (orden.prenda ?? "??").substring(0, 2).toUpperCase();

  return (
    <tr className="group transition-all duration-200">

      {/* ── Orden (prenda + pedido + costo) ── */}
      <td className="bg-white border-y border-l border-slate-100 py-4 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md group-hover:bg-slate-50 transition-all">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-11 w-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-black text-sm border border-pink-100 uppercase group-hover:scale-110 transition-transform shrink-0">
            {iniciales}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none">
                {orden.prenda}
              </span>
            </div>
            <div className="text-slate-400 text-[11px] font-medium mt-1">
              #{orden.id}
              {orden.pedido && (
                <span className="ml-1.5">· Pedido #{orden.pedido.id}</span>
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

      {/* ── Taller ── */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
          <Scissors size={10} />
          {orden.taller?.nombre ?? "—"}
        </div>
      </td>

      {/* ── Cantidad ── */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-slate-900">
            {orden.cantidad.toLocaleString("es-PE")}
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unidades</span>
        </div>
      </td>

      {/* ── Prioridad ── */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
        <Badge
          variant="outline"
          className={`rounded-full px-3 py-1 text-[9px] font-black border-2 uppercase inline-flex items-center gap-1.5 ${PRIORIDAD_BADGE[orden.prioridad]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORIDAD_DOT[orden.prioridad]}`} />
          {PRIORIDAD_LABELS[orden.prioridad]}
        </Badge>
      </td>

      {/* ── Estado ── */}
      <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:bg-slate-50 transition-all">
        <Badge
          variant="outline"
          className={`rounded-full px-3 py-1 text-[9px] font-black border-2 uppercase ${ESTADO_BADGE[orden.estado] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
        >
          {ESTADO_LABELS[orden.estado] ?? orden.estado}
        </Badge>
      </td>

      {/* ── Fecha entrega ── */}
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

      {/* ── Acciones ── */}
      <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:bg-slate-50 transition-all">
        <div className="flex justify-end items-center gap-2">

          {/* Ver detalle */}
          <Button
            variant="outline" size="icon"
            onClick={() => router.push(`/admin/Panel-Administrativo/confecciones/${orden.id}`)}
            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-pink-600 hover:bg-pink-50"
            title="Ver detalle"
          >
            <Eye size={16} />
          </Button>

          {puedeConformidad && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/ayudante/confecciones/${orden.id}`)}
              className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-teal-600 hover:bg-teal-50"
              title="Conformidad de taller"
            >
              <ClipboardCheck size={16} />
            </Button>
          )}

          {/* Editar: Solo si el usuario tiene permisos */} 
          {puedeActualizar && (
            <Button
            variant="outline" size="icon"
            onClick={() => router.push(`/admin/Panel-Administrativo/confecciones/${orden.id}/editar`)}
            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            title="Editar orden"
            >
            <Pencil size={16} />
            </Button>
        )}

          {/* Avanzar estado rápido — solo siguiente válido, no cancelado */}
          {puedeActualizar && siguientes.filter(s => s !== "cancelado").map((sig) => (
            <Button
              key={sig}
              variant="outline" size="icon"
              onClick={() => onEstadoChange(orden.id, sig as ConfeccionRow_T["estado"])}
              className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
              title={`Avanzar a ${ESTADO_LABELS[sig as keyof typeof ESTADO_LABELS]}`}
            >
              <ChevronRight size={16} />
            </Button>
          ))}

         {/* Cancelar: Solo si no está completada/cancelada y tiene permiso */}
         {puedeActualizar && !["completada", "cancelada"].includes(orden.estado) && (
            <Button
            variant="outline" size="icon"
            onClick={() => {
                if(confirm("¿Estás seguro de cancelar esta orden?")) {
                onEstadoChange(orden.id, "cancelada");
                }
            }}
            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Cancelar orden"
            >
            <XCircle size={16} />
            </Button>
         )}
        </div>
      </td>
    </tr>
  );
});

ConfeccionRow.displayName = "ConfeccionRow";
export default ConfeccionRow;