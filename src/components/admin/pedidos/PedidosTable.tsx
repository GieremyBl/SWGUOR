"use client";

import { useRouter } from "next/navigation";
import { Eye, Printer, Truck, Calendar, User, Hash, XCircle, Palette, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ESTADO_PEDIDO_LABELS,
} from "@/lib/schemas/pedidos";
import { ESTADO_VISUAL_PEDIDO_LABELS } from "@/lib/helpers/pedido-estado-visual.helper";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/hooks/usePermissions";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PedidosTableProps {
  data:            any[];
  onCancel?:       (pedido: any) => void;
  onUpdateStatus?: (pedido: any) => void;
}

// ── Badge de estado usando el schema como fuente de verdad ───────────────────

const STATUS_COLORS: Record<string, string> = {
  pendiente:           "bg-amber-50 text-amber-600 border-amber-200",
  en_produccion:       "bg-blue-50 text-blue-600 border-blue-200",
  listo_para_despacho: "bg-violet-50 text-violet-600 border-violet-200",
  preparando:          "bg-cyan-50 text-cyan-600 border-cyan-200",
  en_ruta:             "bg-sky-50 text-sky-700 border-sky-200",
  entregado:           "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelado:           "bg-rose-50 text-rose-500 border-rose-200",
  pagado:              "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function StatusBadge({
  estado,
  label,
}: {
  estado: string;
  label?: string;
}) {
  const displayLabel =
    label ??
    ESTADO_VISUAL_PEDIDO_LABELS[estado] ??
    ESTADO_PEDIDO_LABELS[estado as keyof typeof ESTADO_PEDIDO_LABELS] ??
    estado;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase",
        STATUS_COLORS[estado] ?? "bg-stone-50 text-stone-500 border-stone-200"
      )}
    >
      {displayLabel}
    </Badge>
  );
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PedidosTable({
  data,
  onCancel,
  onUpdateStatus,
}: PedidosTableProps) {
  const router = useRouter();
  const { hasRole } = usePermissions();
  const puedeCorte = hasRole(["cortador", "administrador", "gerente"]);
  const puedeDiseno = hasRole(["disenador", "administrador", "gerente"]);

  const handleView = (pedido: any) => {
    router.push(`/admin/Panel-Administrativo/pedidos/${pedido.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Orden</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Cliente</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Fecha</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay pedidos registrados</p>
                </td>
              </tr>
            ) : (
              data.map((pedido) => (
                <tr key={pedido.id} className="group transition-all duration-200">

                  {/* ID y Total */}
                  <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 shrink-0">
                        <Hash size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-pink-600 text-sm tracking-tight">
                          #{String(pedido.id).padStart(4, "0")}
                        </span>
                        <span className="text-slate-900 font-black text-sm uppercase">
                          S/ {Number(pedido.total ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-[13px] uppercase tracking-tight line-clamp-1">
                          {pedido.clientes?.razon_social || "Cliente no identificado"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          RUC: {pedido.clientes?.ruc || "---"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Fecha */}
                  <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all">
                    <div className="inline-flex items-center gap-2 text-slate-500 font-bold text-[11px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-tighter">
                      <Calendar size={13} className="text-slate-400" />
                      {new Date(pedido.created_at).toLocaleDateString("es-PE")}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all">
                    <StatusBadge
                      estado={pedido.estado_visual ?? pedido.estado ?? "pendiente"}
                      label={pedido.estado_label}
                    />
                  </td>

                  {/* Acciones */}
                  <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex justify-end items-center gap-2">

                      {/* Ver detalle → navega a /pedidos/[id] */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleView(pedido)}
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </Button>

                      {puedeDiseno && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/disenador/pedidos/${pedido.id}`)}
                          className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all"
                          title="Diseño y ficha técnica"
                        >
                          <Palette size={16} />
                        </Button>
                      )}

                      {puedeCorte && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/cortador/pedidos/${pedido.id}`)}
                          className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all"
                          title="Corte y registro"
                        >
                          <Scissors size={16} />
                        </Button>
                      )}

                      {/* Actualizar estado */}
                      {onUpdateStatus && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onUpdateStatus(pedido)}
                          className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all"
                          title="Actualizar Estado"
                        >
                          <Truck size={16} />
                        </Button>
                      )}

                      {/* Imprimir */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.print()}
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-all"
                        title="Imprimir"
                      >
                        <Printer size={16} />
                      </Button>

                      {/* Cancelar */}
                      {onCancel && pedido.estado !== "cancelado" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onCancel(pedido)}
                          className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                          title="Anular Pedido"
                        >
                          <XCircle size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}