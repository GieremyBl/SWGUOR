"use client";

import { Mail, ShieldCheck, Edit, Trash2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// 1. Definimos la interfaz para los props
interface UsuariosTableProps {
  usuarios: any[];
  onEdit?: (user: any) => void;
  onDelete?: (user: any) => void;
  onToggleStatus?: (user: any) => void;
}

export function UsuariosTable({ usuarios, onEdit, onDelete, onToggleStatus }: UsuariosTableProps) {
  
  // 2. Verificamos si hay alguna acción permitida para mostrar la columna
  const showActions = !!onEdit || !!onDelete || !!onToggleStatus;

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader className="bg-transparent border-none">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="font-black text-[11px] tracking-widest text-slate-400 uppercase py-4 px-6">Usuario</TableHead>
            <TableHead className="font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Rol / Cargo</TableHead>
            <TableHead className="font-black text-[11px] tracking-widest text-slate-400 uppercase text-center">Estado</TableHead>
            {showActions && (
              <TableHead className="font-black text-[11px] tracking-widest text-slate-400 uppercase text-right px-8">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="space-y-3">
          {usuarios.map((user: any) => (
            <TableRow 
              key={user.id} 
              className="group bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
              style={{ display: 'table-row', marginBottom: '10px' }}
            >
              <TableCell className="py-5 px-6 rounded-l-2xl">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-black text-sm border border-pink-100 uppercase group-hover:scale-110 transition-transform">
                    {user.nombre_completo?.substring(0, 2)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{user.nombre_completo}</span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <Mail size={13} className="text-slate-300"/> {user.email}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center">
                <span className="text-[13px] font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 capitalize">
                  {user.rol}
                </span>
              </TableCell>

              <TableCell className="text-center">
                <Badge className={`rounded-full px-4 py-1 text-[10px] font-black border-2 uppercase ${
                    String(user.estado).toUpperCase() === 'ACTIVO' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`} variant="outline">
                  {user.estado}
                </Badge>
              </TableCell>

              {/* 3. Renderizado condicional de la celda de acciones */}
              {showActions && (
                <TableCell className="text-right px-6 rounded-r-2xl">
                  <div className="flex justify-end items-center gap-2">
                    {onToggleStatus && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onToggleStatus(user)}
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        title="Cambiar Estado"
                      >
                        <ShieldAlert size={16} />
                      </Button>
                    )}
                    {onEdit && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onEdit(user)}
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </Button>
                    )}
                    {onDelete && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onDelete(user)}
                        className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}