"use client";

import { memo } from "react";
import { Edit, ShieldOff, Eye, User, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { PersonalRow } from "@/lib/services/personal-interno.service";

interface Props {
  data: PersonalRow[];
  loading?: boolean;
  onEdit?: (p: PersonalRow) => void;
  onSuspender?: (p: PersonalRow) => void;
  onDetalle?: (p: PersonalRow) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
const CARGO_LABELS: Record<string, string> = {
  gerente: "Gerente",
  disenador: "Diseñador",
  cortador: "Cortador",
  recepcionista: "Recepcionista",
  administrador: "Administrador",
  ayudante: "Ayudante",
  representante_taller: "Rep. Taller",
};

const CARGO_COLORS: Record<string, string> = {
  gerente: "bg-pink-50 text-pink-700 border-pink-200",
  administrador: "bg-purple-50 text-purple-700 border-purple-200",
  disenador: "bg-teal-50 text-teal-700 border-teal-200",
  cortador: "bg-slate-100 text-slate-600 border-slate-200",
  recepcionista: "bg-blue-50 text-blue-700 border-blue-200",
  ayudante: "bg-amber-50 text-amber-700 border-amber-200",
  representante_taller: "bg-orange-50 text-orange-700 border-orange-200",
};

// ─── Componente ───────────────────────────────────────────────
function PersonalTable({ data, loading, onEdit, onSuspender, onDetalle }: Props) {
  const showActions = !!onEdit || !!onSuspender;
  const colSpan = 5 + (showActions ? 1 : 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className={thCls}>personal</TableHead>
          <TableHead className={`${thCls} text-center`}>Cargo</TableHead>
          <TableHead className={`${thCls} text-center`}>DNI</TableHead>
          <TableHead className={`${thCls} text-center`}>Teléfono</TableHead>
          <TableHead className={`${thCls} text-center`}>Estado</TableHead>
          {showActions && (
            <TableHead className={`${thCls} text-right pr-6`}>Acciones</TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {/* ── Skeleton ── */}
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={`sk-${i}`} className={rowCls}>
            <TableCell className="py-4 px-6 rounded-l-xl">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto rounded-full" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
            {showActions && (
              <TableCell className="text-right px-6 rounded-r-xl">
                <div className="flex justify-end gap-1.5">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}

        {/* ── Sin datos ── */}
        {!loading && data.length === 0 && (
          <TableRow>
            <TableCell colSpan={colSpan} className="py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <User className="w-10 h-10 text-slate-200" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  No hay personal registrado
                </p>
              </div>
            </TableCell>
          </TableRow>
        )}

        {/* ── Filas ── */}
        {!loading && data.map((p) => {
          const iniciales = (p.nombre_completo ?? p.usuarios?.email ?? "??")
            .substring(0, 2).toUpperCase();
          const activo = p.estado;
          const cargo = p.cargo ?? "";

          return (
            <TableRow key={p.id} className={`${rowCls} group`}>

              {/* personal */}
              <TableCell className="py-4 px-6 rounded-l-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs uppercase shrink-0 group-hover:scale-105 transition-transform">
                    {iniciales}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {p.nombre_completo ?? (
                        <span className="text-slate-400 font-medium text-xs">Sin nombre</span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 truncate mt-0.5">
                      {p.usuarios?.email ?? "—"}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Cargo */}
              <TableCell className="text-center">
                <Badge variant="outline"
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${CARGO_COLORS[cargo] ?? "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                  <Briefcase size={9} className="mr-1" />
                  {CARGO_LABELS[cargo] ?? cargo ?? "—"}
                </Badge>
              </TableCell>

              {/* DNI */}
              <TableCell className="text-center">
                <span className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                  {p.dni ?? <span className="text-slate-300">—</span>}
                </span>
              </TableCell>

              {/* Teléfono */}
              <TableCell className="text-center">
                <span className="text-xs text-slate-500">
                  {p.telefono ?? <span className="text-slate-300">—</span>}
                </span>
              </TableCell>

              {/* Estado */}
              <TableCell className="text-center">
                <Badge variant="outline"
                  className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border ${activo
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-orange-50 text-orange-600 border-orange-200"
                    }`}>
                  {activo ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>

              {/* Acciones */}
              {showActions && (
                <TableCell className="text-right px-6 rounded-r-xl">
                  <div className="flex justify-end items-center gap-1.5">
                    {onDetalle && (
                      <ActionBtn title="Ver detalle" color="pink" onClick={() => onDetalle(p)}>
                        <Eye size={15} />
                      </ActionBtn>
                    )}

                    {onEdit && (
                      <ActionBtn title="Editar" color="emerald" onClick={() => onEdit(p)}>
                        <Edit size={15} />
                      </ActionBtn>
                    )}
                    {onSuspender && (
                      <ActionBtn title={activo ? "Desactivar" : "Reactivar"}
                        color={activo ? "amber" : "blue"} onClick={() => onSuspender(p)}>
                        <ShieldOff size={15} />
                      </ActionBtn>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Micro-componente botón ───────────────────────────────────
type ColorKey = "pink" | "emerald" | "amber" | "blue";
const COLOR_MAP: Record<ColorKey, string> = {
  pink: "hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50",
  emerald: "hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50",
  amber: "hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50",
  blue: "hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50",
};

function ActionBtn({ children, onClick, title, color }: {
  children: React.ReactNode; onClick: () => void; title: string; color: ColorKey;
}) {
  return (
    <Button variant="outline" size="icon" onClick={onClick} title={title}
      className={`h-8 w-8 rounded-lg border-slate-200 text-slate-400 transition-all ${COLOR_MAP[color]}`}>
      {children}
    </Button>
  );
}

const thCls = "font-bold text-[10px] tracking-widest text-slate-400 uppercase py-3 px-4";
const rowCls = "bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-150";

export default memo(PersonalTable);