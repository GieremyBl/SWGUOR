"use client";

import { Eye, Calendar, User, Hash, XCircle } from "lucide-react"; // Eliminé Printer y Truck si no los usas
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PedidosTableProps {
  data: any[];
  onView: (pedido: any) => void;
  onCancel?: (pedido: any) => void;
}


export default function PedidosTable({ data, onView, onCancel }: PedidosTableProps) {
  const getStatusBadge = (status: string) => {
    const styles: any = {
      solicitud: "bg-blue-50 text-blue-600 border-blue-100",
      cotizado: "bg-purple-50 text-purple-600 border-purple-100",
      aprobado: "bg-orange-50 text-orange-600 border-orange-100",
      pagado: "bg-emerald-50 text-emerald-600 border-emerald-100",
      en_proceso: "bg-pink-50 text-pink-600 border-pink-100",
      finalizado: "bg-slate-50 text-slate-600 border-slate-100",
      cancelado: "bg-rose-50 text-rose-600 border-rose-100",
    };

    const label: any = {
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
        className={`rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase ${styles[status] || "bg-gray-50 text-gray-500"}`}
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
            {data.map((pedido) => (
              <tr key={pedido.id} className="group transition-all duration-200">
                <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm">
                  {/* ... contenido del ID ... */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                      <Hash size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-pink-600 text-sm">#{pedido.id.toString().padStart(4, '0')}</span>
                      <span className="text-slate-900 font-black text-sm uppercase">S/ {pedido.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </td>

                {/* Cliente */}
                <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <User size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-700 text-[13px] uppercase">{pedido.clientes?.razon_social}</span>
                  </div>
                </td>

                {/* Fecha */}
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                  <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-none uppercase text-[10px]">
                    {new Date(pedido.created_at).toLocaleDateString()}
                  </Badge>
                </td>

                {/* Estado */}
                <td className="bg-white border-y border-slate-100 text-center shadow-sm">
                  {getStatusBadge(pedido.estado)}
                </td>

                {/* ACCIONES - AQUÍ ESTÁ EL CAMBIO CLAVE */}
                <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm">
                  <div className="flex justify-end items-center gap-2">
                    {/* SOLO EL OJO */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onView(pedido)}
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                      title="Ver Detalles"
                    >
                      <Eye size={16} />
                    </Button>

                    {/* PRUEBA: Botón visible siempre */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        console.log("Estado del pedido:", pedido.estado);
                        console.log("¿Existe la función onCancel?:", !!onCancel);
                        onCancel?.(pedido); // El ?. evita que la página crashee si onCancel no existe
                      }}
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                      title="Anular Pedido"
                    >
                      <XCircle size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}