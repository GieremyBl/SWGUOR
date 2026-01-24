"use client";

import { Eye, Calendar, User, Receipt, UserCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function VentasTable({ data, onViewDetail }: any) {
  
  const getEstadoBadge = (estado: string) => {
    const styles: any = {
      pendiente: "bg-orange-50 text-orange-600 border-orange-100",
      en_produccion: "bg-blue-50 text-blue-600 border-blue-100",
      entregado: "bg-emerald-50 text-emerald-600 border-emerald-100",
      cancelado: "bg-rose-50 text-rose-600 border-rose-100",
    };
    
    return (
      <Badge className={`rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase tracking-tighter shadow-none ${styles[estado] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
        {estado.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Documento / Venta</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Cliente</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Responsable</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Monto Total</th>
              <th className="px-6 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-2">
                    {/* Se eliminó el ícono de ShoppingBag y se reemplazó por un texto más limpio */}
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                      No hay registros para mostrar
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((v: any) => (
                <tr key={v.id} className="group transition-all duration-200">
                  {/* Código y Fecha */}
                  <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 group-hover:rotate-6 transition-transform">
                        <Receipt size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-pink-600 text-sm tracking-tight uppercase">
                          {v.codigo_pedido || `#${v.id.toString().padStart(5, '0')}`}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] mt-1">
                          <Calendar size={12} />
                          {format(new Date(v.created_at), "dd MMM, yyyy", { locale: es })}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <User size={14} />
                      </div>
                      <span className="font-bold text-slate-700 text-[13px] uppercase tracking-tight">
                        {v.cliente?.nombre || "Venta Directa"}
                      </span>
                    </div>
                  </td>

                  {/* Vendedor */}
                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                      <UserCheck size={14} className="text-slate-400" />
                      {v.vendedor?.nombre || "Admin"}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all">
                    {getEstadoBadge(v.estado_pedido)}
                  </td>

                  {/* Total */}
                  <td className="bg-white border-y border-slate-100 px-8 text-right shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-900 text-base">
                        S/ {Number(v.total).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagado</span>
                    </div>
                  </td>

                  {/* Acciones Directas */}
                  <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onViewDetail(v)}
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition-all shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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