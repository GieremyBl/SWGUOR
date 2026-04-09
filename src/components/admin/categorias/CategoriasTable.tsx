"use client";

import { Edit, Trash2, CheckCircle, XCircle, Tag, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";
type Categoria = Database['public']['Tables']['categorias']['Row'];

interface Props {
  data: Categoria[];
  onEdit: (categoria: Categoria) => void;
  onDelete: (categoria: Categoria) => void;
}

export default function CategoriasTable({ data, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Categoría</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase">Descripción</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</th>
              <th className="px-6 py-2 font-black text-[11px] tracking-widest text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Layers className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay categorías configuradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((categoria) => (
                <tr key={categoria.id} className="group transition-all duration-200">
                  {/* Nombre de la Categoría */}
                  <td className="bg-white border-y border-l border-slate-100 py-5 px-6 rounded-l-2xl shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 group-hover:scale-110 transition-transform duration-300">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 text-sm tracking-tight uppercase leading-none">
                          {categoria.nombre}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                          Ref: CAT-{categoria.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Descripción */}
                  <td className="bg-white border-y border-slate-100 py-5 px-6 shadow-sm group-hover:shadow-md transition-all">
                    <p className="text-[13px] text-slate-500 font-medium max-w-xs truncate">
                      {categoria.descripcion || <span className="text-slate-300 italic">Sin descripción detallada</span>}
                    </p>
                  </td>

                  {/* Estado — usa "activo" (boolean) */}
                  <td className="bg-white border-y border-slate-100 text-center shadow-sm group-hover:shadow-md transition-all">
                    <Badge 
                      className={
                        categoria.activo === true 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50" 
                          : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-50"
                      }
                      variant="outline"
                    >
                      {categoria.activo === true ? (
                        <span className="flex items-center gap-1.5"><CheckCircle size={10}/> Activo</span>
                      ) : (
                        <span className="flex items-center gap-1.5"><XCircle size={10}/> Inactivo</span>
                      )}
                    </Badge>
                  </td>

                  {/* Acciones */}
                  <td className="bg-white border-y border-r border-slate-100 px-6 rounded-r-2xl text-right shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        onClick={() => onEdit(categoria)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                        onClick={() => onDelete(categoria)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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