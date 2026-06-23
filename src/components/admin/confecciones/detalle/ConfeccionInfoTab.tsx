"use client";

import { Loader2, ChevronRight } from "lucide-react";
import { ESTADO_LABELS } from "@/lib/schemas/confecciones";

// MATRIZ ÚNICA DE LOGICA DE NEGOCIO (Sincronizada con el Historial)
const SIGUIENTE_ESTADO: Record<string, string[]> = {
  pendiente: ["en_proceso", "cancelada"],
  en_proceso: ["completada", "rechazada", "cancelada"],
  completada: ["cancelada"],
  rechazada: ["pendiente", "cancelada"],
  cancelada: [],
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-slate-100  text-slate-700  border-slate-200",
  en_proceso: "bg-blue-100   text-blue-700   border-blue-200",
  completada: "bg-emerald-100 text-emerald-700 border-emerald-200", // Uniformado a emerald
  rechazada: "bg-amber-100  text-amber-700  border-amber-200",
  cancelada: "bg-red-100    text-red-700    border-red-200",    // Corregido: cancelado -> cancelada
};

interface Props {
  confeccion: any;
  estadoActual: string;
  puedeActualizar: boolean;
  isLoading?: boolean;
  onEstadoChange: (nuevoEstado: string) => void;
}

export function ConfeccionInfoTab({ confeccion, estadoActual, puedeActualizar, isLoading = false, onEstadoChange }: Props) {
  const siguientes = SIGUIENTE_ESTADO[estadoActual] ?? [];

  return (
    <div className="space-y-4">
      {/* Avance de estado */}
      {puedeActualizar && siguientes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Avanzar estado
          </p>
          <div className="flex flex-wrap gap-2">
            {siguientes.map(sig => (
              <button
                key={sig}
                onClick={() => onEstadoChange(sig)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border transition-all disabled:opacity-60 ${sig === "cancelada" // Corregido: cancelado -> cancelada
                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    : "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100"
                  }`}
              >
                {isLoading
                  ? <Loader2 size={12} className="animate-spin" />
                  : <ChevronRight size={12} />
                }
                {ESTADO_LABELS[sig as keyof typeof ESTADO_LABELS] ?? sig}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detalles */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 border-b border-gray-100">
          Detalles de la confección
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prenda</p>
            <p className="font-bold text-gray-800">{confeccion.prenda}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prioridad</p>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${confeccion.prioridad === "urgente" ? "bg-red-100 text-red-600" :
                confeccion.prioridad === "alta" ? "bg-orange-100 text-orange-600" :
                  confeccion.prioridad === "media" ? "bg-sky-100 text-sky-600" :
                    "bg-gray-100 text-gray-500"
              }`}>
              {confeccion.prioridad}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado actual</p>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${ESTADO_COLORS[estadoActual] ?? "bg-gray-100 text-gray-600"}`}>
              {ESTADO_LABELS[estadoActual as keyof typeof ESTADO_LABELS] ?? estadoActual}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cantidad</p>
            <p className="font-bold text-gray-800">{confeccion.cantidad?.toLocaleString("es-PE") ?? 0} uds.</p>
          </div>
        </div>

        {confeccion.notas && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notas</p>
            <p className="text-sm text-gray-600 leading-relaxed">{confeccion.notas}</p>
          </div>
        )}
      </div>
    </div>
  );
}