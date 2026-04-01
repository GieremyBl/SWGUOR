"use client";

import { Edit2, Trash2, Mail, Phone, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientesTableProps {
  data: any[];
  onEdit?: (c: any) => void;
  onDelete?: (c: any) => void;
  onToggleStatus?: (c: any) => void;
}

export default function ClientesTable({ 
  data, 
  onEdit, 
  onDelete 
}: ClientesTableProps) {

  const showActions = !!onEdit || !!onDelete;

  // Función auxiliar para determinar el estilo del Badge según el Enum de tu DB
  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activo':
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'inactivo':
        return "bg-orange-50 text-orange-600 border-orange-100";
      case 'suspendido':
        return "bg-red-50 text-red-600 border-red-100";
      case 'potencial':
        return "bg-blue-50 text-blue-600 border-blue-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Cliente / Empresa</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Contacto</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Documento</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
              {showActions && (
                <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 5 : 4} className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <User className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay clientes registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="group transition-all duration-200">
                  {/* Cliente / Empresa */}
                  <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 
                        ${c.activo === 'activo' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none truncate max-w-50">
                          {c.razon_social}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium truncate max-w-45">
                          {c.direccion || 'Sin dirección'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contacto */}
                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-300"/> {c.email || '---'}
                      </span>
                      <span className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-300"/> {c.telefono || '---'}
                      </span>
                    </div>
                  </td>

                  {/* Documento (RUC) */}
                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Hash size={14} className="text-slate-400" />
                      <span className="font-mono text-[13px] font-bold text-slate-700">{c.ruc || "---"}</span>
                    </div>
                  </td>

                  {/* Estado (Badge Dinámico) */}
                  <td className={`bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all ${!showActions ? 'rounded-r-2xl border-r' : ''}`}>
                    <Badge className={`rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase transition-colors ${getStatusStyles(c.activo)}`} variant="outline">
                      {c.activo || "S/E"}
                    </Badge>
                  </td>

                  {/* Acciones */}
                  {showActions && (
                    <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                      <div className="flex justify-end items-center gap-2">
                        <TooltipProvider delayDuration={200}>
                          
                          {/* BOTÓN EDITAR */}
                          {onEdit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  onClick={() => onEdit(c)}
                                  className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                                >
                                  <Edit2 size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-900 text-white text-xs border-none">
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* BOTÓN ELIMINAR */}
                          {onDelete && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  onClick={() => onDelete(c)}
                                  className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-rose-600 text-white text-xs border-none">
                                <p>Eliminar</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                        </TooltipProvider>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}