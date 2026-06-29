"use client";

import SearchInput from "../common/SearchInput"; // ← Mantiene el original
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlmacenesToolbarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function AlmacenesToolbar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  isLoading,
  onRefresh,
}: AlmacenesToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">

      {/* Búsqueda Original */}
      <SearchInput
        placeholder="Buscar almacén por nombre o dirección..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="flex items-center gap-3">
        {/* Selector de Estado — Integrado y Personalizado */}
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-10 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-gray-400 focus:bg-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <Button
          variant="outline"
          className="h-11 w-11 p-0 border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 text-gray-500", isLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}