"use client";

import { Eye, Printer, Truck, Calendar, User, Hash, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 1. Interfaces tipadas y opcionales según permisos
interface PedidosTableProps {
  data: any[];
  onView: (pedido: any) => void;
  onCancel?: (pedido: any) => void; // Opcional: Solo si tiene permiso 'delete'
  onUpdateStatus?: (pedido: any) => void; // Opcional: Solo si tiene permiso 'edit'
}

export default function PedidosTable({ data, onView, onCancel, onUpdateStatus }: PedidosTableProps) {
  
  const getStatusBadge = (status: string) => {
    const styles: any = {
      pendiente: "bg-orange-50 text-orange-600 border-orange-100",
      completado: "bg-emerald-50 text-emerald-600 border-emerald-100",
      cancelado: "bg-rose-50 text-rose-600 border-rose-100",
      en_envio: "bg-blue-50 text-blue-600 border-blue-100",
    };

    const label: any = {
      pendiente: "Pendiente",
      completado: "Entregado",
      cancelado: "Cancelado",
      en_envio: "En Camino",
    };

    return (
      <Badge 
        className={`rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase ${styles[status] || styles.pendiente}`}
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
                  {/* ID del Pedido y Total */}
                  <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
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

                  {/* Información del Cliente */}
                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-[13px] uppercase tracking-tight">
                          {pedido.clientes?.nombre} {pedido.clientes?.apellido}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          DNI/RUC: {pedido.clientes?.dni_ruc || 'Sin Identificación'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Fecha */}
                  <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all">
                    <div className="inline-flex items-center gap-2 text-slate-500 font-bold text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(pedido.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all">
                    {getStatusBadge(pedido.estado)}
                  </td>

                  {/* Acciones Condicionales */}
                  <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex justify-end items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onView(pedido)}
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </Button>

                      {/* Botón de Envío: Solo si tiene permiso de editar */}
                      {onUpdateStatus && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => onUpdateStatus(pedido)}
                          className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all"
                          title="Actualizar Estado/Envío"
                        >
                          <Truck size={16} />
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-all"
                        title="Imprimir Comprobante"
                      >
                        <Printer size={16} />
                      </Button>

                      {/* Botón de Cancelar: Solo si tiene permiso de eliminar */}
                      {onCancel && pedido.estado !== 'cancelado' && (
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