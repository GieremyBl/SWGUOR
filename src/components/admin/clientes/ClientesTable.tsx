"use client";

import { memo } from "react";
import { Edit, ShieldOff, Eye, Building2, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import type { ClienteListItem } from "@/lib/services/clientes.service";

// ─── Tipo Extendido Seguro ────────────────────────────────────
// Extendemos el tipo del servicio para reflejar la columna real de la Base de Datos
type ClienteConEstado = ClienteListItem & {
  estado?: string | null;
};

interface Props {
  clientes: ClienteConEstado[]; // <-- Ahora usamos el tipo correcto con 'estado'
  loading?: boolean;
  onEdit?: (user: ClienteListItem) => void;
  onSuspender?: (user: ClienteListItem) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string | null | undefined }) {
  const estadoLimpio = (estado ?? "activo").toLowerCase();
  const isActivo = estadoLimpio === "activo";

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider border transition-colors ${
        isActivo
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-[var(--guor-cream-deep)] text-[var(--guor-soft)] border-[var(--guor-stone-mid)]"
      }`}
    >
      {estadoLimpio}
    </Badge>
  );
}

// ─── Componente Principal ─────────────────────────────────────
function ClientesTable({ clientes, loading, onEdit, onSuspender }: Props) {
  const router = useRouter();
  const showActions = !!onEdit || !!onSuspender;
  const colSpan = 5 + (showActions ? 1 : 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className={thCls}>Empresa</TableHead>
          <TableHead className={`${thCls} text-center`}>RUC</TableHead>
          <TableHead className={`${thCls} text-center`}>Email</TableHead>
          <TableHead className={`${thCls} text-center`}>Dirección Fiscal</TableHead>
          <TableHead className={`${thCls} text-center`}>Estado</TableHead>
          {showActions && (
            <TableHead className={`${thCls} text-right pr-6`}>Acciones</TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>

        {/* ── Skeleton Loaders ── */}
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={`sk-${i}`} className={rowCls}>
            <TableCell className="py-4 px-6 rounded-l-xl">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-28 mx-auto" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-36 mx-auto" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-44 mx-auto" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
            {showActions && (
              <TableCell className="text-right px-6 rounded-r-xl">
                <div className="flex justify-end gap-1.5">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}

        {/* ── Sin Datos en la Lista ── */}
        {!loading && clientes.length === 0 && (
          <TableRow>
            <TableCell colSpan={colSpan} className="py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <Building2 className="w-10 h-10 text-slate-200" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  No hay clientes registrados
                </p>
              </div>
            </TableCell>
          </TableRow>
        )}

        {/* ── Renderizado de Filas ── */}
        {!loading && clientes.map((c) => {
          // TypeScript ahora reconoce perfectamente c.estado gracias al tipo extendido
          const estadoLimpio = (c.estado ?? "activo").toLowerCase();
          const isActivo = estadoLimpio === "activo";

          const iniciales = (c.razon_social ?? c.email ?? "??")
            .substring(0, 2).toUpperCase();

          return (
            <TableRow key={c.id} className={`${rowCls} group`}>

              {/* Empresa */}
              <TableCell className="py-4 px-6 rounded-l-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-xs uppercase shrink-0 group-hover:scale-105 transition-transform">
                    {iniciales}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {c.razon_social ?? (
                        <span className="text-slate-400 font-medium text-xs">Sin razón social</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 size={9} className="text-slate-300 shrink-0" />
                      Cliente {c.tipo_cliente ? `(${c.tipo_cliente})` : ""}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* RUC */}
              <TableCell className="text-center">
                <span className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider">
                  {c.ruc ?? <span className="text-slate-300">—</span>}
                </span>
              </TableCell>

              {/* Email */}
              <TableCell className="text-center">
                <span className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <Mail size={11} className="text-slate-300 shrink-0" />
                  {c.email || <span className="text-slate-300">—</span>}
                </span>
              </TableCell>

              {/* Dirección Fiscal */}
              <TableCell className="text-center">
                <span className="text-xs text-slate-600 flex items-center justify-center gap-1.5 max-w-[200px] truncate mx-auto">
                  <MapPin size={11} className="text-slate-300 shrink-0" />
                  {c.direccion_fiscal || <span className="text-slate-300">No registrada</span>}
                </span>
              </TableCell>

              {/* Estado */}
              <TableCell className="text-center">
                <EstadoBadge estado={c.estado} />
              </TableCell>

              {/* Acciones */}
              {showActions && (
                <TableCell className="text-right px-6 rounded-r-xl">
                  <div className="flex justify-end items-center gap-1.5">
                    <ActionBtn
                      title="Ver detalle"
                      color="pink"
                      onClick={() => router.push(`/admin/Panel-Administrativo/usuarios/clientes/${c.id}`)}
                    >
                      <Eye size={15} />
                    </ActionBtn>

                    {onEdit && (
                      <ActionBtn title="Editar" color="emerald" onClick={() => onEdit(c)}>
                        <Edit size={15} />
                      </ActionBtn>
                    )}

                    {onSuspender && (
                      <ActionBtn
                        title={isActivo ? "Suspender" : "Reactivar"}
                        color={isActivo ? "amber" : "blue"}
                        onClick={() => onSuspender(c)}
                      >
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

// ─── Micro-componente botón de acción ─────────────────────────
type ColorKey = "pink" | "emerald" | "amber" | "blue";

const COLOR_MAP: Record<ColorKey, string> = {
  pink: "hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50",
  emerald: "hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50",
  amber: "hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50",
  blue: "hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50",
};

function ActionBtn({ children, onClick, title, color }: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  color: ColorKey;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      title={title}
      className={`h-8 w-8 rounded-lg border-slate-200 text-slate-400 transition-all ${COLOR_MAP[color]}`}
    >
      {children}
    </Button>
  );
}

const thCls = "font-bold text-[10px] tracking-widest text-slate-400 uppercase py-3 px-4";
const rowCls = "bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-150";

export default memo(ClientesTable);