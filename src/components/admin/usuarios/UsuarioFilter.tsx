"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, RefreshCw } from "lucide-react";
import type { Rol, EstadoUsuario } from "@prisma/client";

// ─── Arrays locales ───────────────────────────────────────────
const ESTADOS: { value: EstadoUsuario; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "suspendido", label: "Suspendido" },
];

const ROLES: { value: Rol; label: string }[] = [
  { value: "gerente", label: "Gerente" },
  { value: "administrador", label: "Administrador" },
  { value: "disenador", label: "Diseñador" },
  { value: "cortador", label: "Cortador" },
  { value: "ayudante", label: "Ayudante" },
  { value: "recepcionista", label: "Recepcionista" },
  { value: "representante_taller", label: "Rep. de Taller" },
  { value: "cliente", label: "Cliente" },
  { value: "almacenero", label: "Almacenero" }
];

// ─── Chips ────────────────────────────────────────────────────
const CHIP_CLASS: Record<string, string> = {
  estado_activo: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  estado_inactivo: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
  estado_suspendido: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
  rol_gerente: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  rol_administrador: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
  rol_recepcionista: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
  rol_disenador: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100",
  rol_cortador: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
  rol_representante_taller: "bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100",
  rol_ayudante: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
  rol_cliente: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  rol_almacenero: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
  q: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
};

function getChipClass(field: string, value: string): string {
  return CHIP_CLASS[`${field}_${value}`] ?? CHIP_CLASS.q;
}

// ─── Tipos ────────────────────────────────────────────────────
export interface UsuarioFiltrosState {
  q: string;
  estado: string;
  rol: string;
}

export const EMPTY_FILTERS: UsuarioFiltrosState = {
  q: "", estado: "", rol: "",
};

interface UsuarioFiltersProps {
  filters: UsuarioFiltrosState;
  onChange: (filters: UsuarioFiltrosState) => void;
  totalCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function hasActiveFilters(f: UsuarioFiltrosState) {
  return f.q !== "" || f.estado !== "" || f.rol !== "";
}

function getLabel(field: "estado" | "rol", value: string): string {
  const map = { estado: ESTADOS, rol: ROLES } as const;
  return map[field].find((x) => x.value === value)?.label ?? value;
}

// ─── Componente ───────────────────────────────────────────────
export default function UsuarioFilters({
  filters, onChange, onRefresh, isRefreshing,
}: UsuarioFiltersProps) {

  const set = useCallback(
    (key: keyof UsuarioFiltrosState, value: string) =>
      onChange({ ...filters, [key]: value }),
    [filters, onChange],
  );

  const clear = useCallback(
    (key: keyof UsuarioFiltrosState) => onChange({ ...filters, [key]: "" }),
    [filters, onChange],
  );

  const reset = () => onChange(EMPTY_FILTERS);

  const activeChips: {
    key: keyof UsuarioFiltrosState;
    label: string;
    chipClass: string;
  }[] = [];

  if (filters.q)
    activeChips.push({ key: "q", label: `"${filters.q}"`, chipClass: CHIP_CLASS.q });
  if (filters.estado)
    activeChips.push({ key: "estado", label: getLabel("estado", filters.estado), chipClass: getChipClass("estado", filters.estado) });
  if (filters.rol)
    activeChips.push({ key: "rol", label: getLabel("rol", filters.rol), chipClass: getChipClass("rol", filters.rol) });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">

      {/* ── Fila principal ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={filters.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Buscar por email…"
            className="pl-8 h-9 bg-slate-50 border-slate-200 focus:bg-white text-sm transition-colors"
          />
        </div>

        {/* Estado */}
        <Select value={filters.estado || "all"} onValueChange={(v) => set("estado", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-[145px] bg-slate-50 border-slate-200 text-sm">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Rol */}
        <Select value={filters.rol || "all"} onValueChange={(v) => set("rol", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-[145px] bg-slate-50 border-slate-200 text-sm">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Separador + Limpiar */}
        {hasActiveFilters(filters) && (
          <>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm px-3"
            >
              Limpiar
            </Button>
          </>
        )}

        {/* Separador + Refresh */}
        {onRefresh && (
          <>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Actualizar tabla"
              className="h-9 w-9 rounded-lg border-slate-200 bg-slate-50 hover:bg-white text-slate-400 hover:text-slate-600 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </>
        )}
      </div>

      {/* ── Chips activos ── */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap min-h-[24px]">
          {activeChips.map(({ key, label, chipClass }) => (
            <span
              key={key}
              onClick={() => clear(key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${chipClass}`}
            >
              {label}
              <X className="w-3 h-3 opacity-60" />
            </span>
          ))}
        </div>
      )}

    </div>
  );
}