"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit, FileText, Package, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ESTADOS_FICHA } from "@/lib/constants/fichas-tecnicas";
import type { EstadoFicha } from "@prisma/client";

// ─── Tipos ────────────────────────────────────────────────────
export interface FichaTecnicaRow {
  id:                    string;
  version:               string;
  estado:                string;
  descripcion_detallada: string | null;
  sam_total:             number | null;
  costo_estimado:        number | null;
  ficha_url:             string | null;
  created_at:            string;
  productos:             { id: string; nombre: string; sku: string; imagen: string | null } | null;
  ficha_medidas:         { id: string }[];
}

interface Props {
  data:      FichaTecnicaRow[];
  loading?:  boolean;
  onEdit?:   (f: FichaTecnicaRow) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const s = ESTADOS_FICHA[estado as EstadoFicha] ?? ESTADOS_FICHA.borrador;
  return (
    <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border ${s.color}`}>
      {s.label}
    </Badge>
  );
}

// ─── Componente ───────────────────────────────────────────────
function FichasTecnicasTable({ data, loading, onEdit }: Props) {
  const router = useRouter();
  const colSpan = onEdit ? 7 : 6;

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className={th}>Producto</TableHead>
          <TableHead className={`${th} text-center`}>Versión</TableHead>
          <TableHead className={`${th} text-center`}>Estado</TableHead>
          <TableHead className={`${th} text-center`}>Medidas</TableHead>
          <TableHead className={`${th} text-center`}>SAM total</TableHead>
          <TableHead className={`${th} text-center`}>Costo est.</TableHead>
          <TableHead className={`${th} text-right pr-6`}>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {/* Skeleton */}
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={`sk-${i}`} className={row}>
            <TableCell className="py-4 px-6 rounded-l-xl">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableCell>
            {[...Array(5)].map((_, j) => (
              <TableCell key={j} className="text-center">
                <Skeleton className="h-5 w-16 mx-auto rounded-full" />
              </TableCell>
            ))}
            <TableCell className="text-right px-6 rounded-r-xl">
              <div className="flex justify-end gap-1.5">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </TableCell>
          </TableRow>
        ))}

        {/* Sin datos */}
        {!loading && data.length === 0 && (
          <TableRow>
            <TableCell colSpan={colSpan} className="py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-slate-200" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  No hay fichas técnicas registradas
                </p>
              </div>
            </TableCell>
          </TableRow>
        )}

        {/* Filas */}
        {!loading && data.map((ficha) => {
          const iniciales = (ficha.productos?.nombre ?? "FT").substring(0, 2).toUpperCase();
          return (
            <TableRow key={ficha.id} className={`${row} group`}>

              {/* Producto */}
              <TableCell className="py-4 px-6 rounded-l-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {ficha.productos?.imagen
                      ? <img src={ficha.productos.imagen} alt="" className="h-10 w-10 object-cover rounded-xl" />
                      : iniciales}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {ficha.productos?.nombre ?? <span className="text-slate-400 text-xs">Sin producto</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {ficha.productos?.sku ?? "—"}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Versión */}
              <TableCell className="text-center">
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                  v{ficha.version}
                </span>
              </TableCell>

              {/* Estado */}
              <TableCell className="text-center">
                <EstadoBadge estado={ficha.estado} />
              </TableCell>

              {/* Nº medidas */}
              <TableCell className="text-center">
                <span className="flex items-center justify-center gap-1 text-xs text-slate-500">
                  <Ruler size={11} className="text-slate-300" />
                  {ficha.ficha_medidas.length}
                </span>
              </TableCell>

              {/* SAM */}
              <TableCell className="text-center">
                <span className="text-xs font-semibold text-slate-600">
                  {ficha.sam_total != null ? `${ficha.sam_total} min` : <span className="text-slate-300">—</span>}
                </span>
              </TableCell>

              {/* Costo estimado */}
              <TableCell className="text-center">
                <span className="text-xs font-semibold text-slate-600">
                  {ficha.costo_estimado != null
                    ? `S/ ${Number(ficha.costo_estimado).toFixed(2)}`
                    : <span className="text-slate-300">—</span>}
                </span>
              </TableCell>

              {/* Acciones */}
              <TableCell className="text-right px-6 rounded-r-xl">
                <div className="flex justify-end items-center gap-1.5">
                  <ActionBtn title="Ver detalle" color="pink"
                    onClick={() => router.push(`/admin/Panel-Administrativo/fichas-tecnicas/${ficha.id}`)}>
                    <Eye size={15} />
                  </ActionBtn>
                  {onEdit && (
                    <ActionBtn title="Editar" color="emerald" onClick={() => onEdit(ficha)}>
                      <Edit size={15} />
                    </ActionBtn>
                  )}
                </div>
              </TableCell>

            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Botón acción ─────────────────────────────────────────────
type ColorKey = "pink" | "emerald" | "blue";
const COLOR_MAP: Record<ColorKey, string> = {
  pink:    "hover:text-pink-600    hover:border-pink-200    hover:bg-pink-50",
  emerald: "hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50",
  blue:    "hover:text-blue-600    hover:border-blue-200    hover:bg-blue-50",
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

const th  = "font-bold text-[10px] tracking-widest text-slate-400 uppercase py-3 px-4";
const row = "bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-150";

export default memo(FichasTecnicasTable);