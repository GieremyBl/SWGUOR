"use client";

import { Edit2, Trash2, Mail, Phone, User, ShieldCheck, ShieldAlert, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClientesTableProps {
  data: any[];
  onEdit?: (c: any) => void;
  onDelete?: (c: any) => void;
  onToggleStatus?: (c: any) => void;
}

export default function ClientesTable({ 
  data, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: ClientesTableProps) {

  // Determinamos si debemos mostrar la columna de acciones
  const showActions = !!onEdit || !!onDelete || !!onToggleStatus;

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
                  <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 group-hover:scale-110 transition-transform duration-300">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none">
                          {c.razon_social}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            ID: {c.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-300"/> {c.email}
                      </span>
                      <span className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-300"/> {c.telefono || '---'}
                      </span>
                    </div>
                  </td>

                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Hash size={14} className="text-slate-400" />
                      <span className="font-mono text-[13px] font-bold text-slate-700">{c.ruc || "---"}</span>
                    </div>
                  </td>

                  <td className={`bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all ${!showActions ? 'rounded-r-2xl border-r' : ''}`}>
                    <Badge className={`rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase ${
                      c.activo 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`} variant="outline">
                      {c.activo ? "ACTIVO" : "INACTIVO"}
                    </Badge>
                  </td>

                  {showActions && (
                    <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                      <div className="flex justify-end items-center gap-2">
                        {onToggleStatus && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => onToggleStatus(c)}
                            className={`h-9 w-9 rounded-xl border-slate-200 transition-all ${
                              c.activo 
                                ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                            }`}
                            title={c.activo ? "Desactivar" : "Activar"}
                          >
                            {c.activo ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                          </Button>
                        )}
                        
                        {onEdit && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => onEdit(c)}
                            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                          >
                            <Edit2 size={16} />
                          </Button>
                        )}

                        {onDelete && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => onDelete(c)}
                            className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
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