"use client";

import { Eye, Printer, Truck, Calendar, User, Hash, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 1. Interfaces tipadas
interface PedidosTableProps {
  data: any[];
  onView: (pedido: any) => void;
  onCancel?: (pedido: any) => void;
  onUpdateStatus?: (pedido: any) => void;
}

export default function PedidosTable({ 
  data, 
  onView, 
  onCancel, 
  onUpdateStatus 
}: PedidosTableProps) {

  // Helper para los Badges de estado
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      solicitud: "bg-blue-50 text-blue-600 border-blue-100",
      cotizado: "bg-purple-50 text-purple-600 border-purple-100",
      aprobado: "bg-orange-50 text-orange-600 border-orange-100",
      pagado: "bg-emerald-50 text-emerald-600 border-emerald-100",
      en_proceso: "bg-pink-50 text-pink-600 border-pink-100",
      finalizado: "bg-slate-50 text-slate-600 border-slate-100",
      cancelado: "bg-rose-50 text-rose-600 border-rose-100",
      };
    const label: Record<string, string> = {
      solicitud: "Solicitud",
      cotizado: "Cotizado",
      aprobado: "Aprobado",
      pagado: "Pagado",
      en_proceso: "En Taller",
      finalizado: "Completado",
      cancelado: "Anulado",

    };

    return (
      <Badge
        className={`rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase transition-colors ${
          styles[status] || "bg-gray-50 text-gray-500 border-gray-100"
        }`}
        variant="outline"
      >
        {label[status] || status}
      </Badge>
    );
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
                          #{pedido.id.toString().padStart(4, '0')}
                        </span>
                        <span className="text-slate-900 font-black text-sm uppercase">
                          S/ {pedido.total?.toFixed(2)}
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
                          {pedido.clientes?.razon_social || "CLIENTE NO IDENTIFICADO"}
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
                      {new Date(pedido.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all">
                    {getStatusBadge(pedido.estado)}
                  </td>

                  {/* Acciones */}
                  <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex justify-end items-center gap-2">
                      {/* Ver Detalles */}
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onView(pedido)}
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </Button>

                      {/* Actualizar Estado (Logística/Envío) */}
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
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-all"
                        title="Imprimir"
                      >
                        <Printer size={16} />
                      </Button>

                      {/* Cancelar / Anular */}
                      {onCancel && pedido.estado !== 'cancelado' && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => {
                            console.log("Iniciando anulación pedido:", pedido.id);
                            onCancel(pedido);
                          }}
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