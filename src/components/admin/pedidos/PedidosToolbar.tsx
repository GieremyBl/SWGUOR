"use client";

import SearchInput from "../common/SearchInput";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DateFilter = "todas" | "hoy" | "semana" | "mes";

interface FilterOption {
  label: string;
  value: DateFilter;
}

interface FilterSelectProps {
  value: DateFilter;
  onValueChange: (v: DateFilter) => void;
  options: FilterOption[];
}

function FilterSelect({ value, onValueChange, options }: FilterSelectProps) {

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value as DateFilter)}
        className={cn(
          "h-11 appearance-none pl-4 pr-10 rounded-xl border border-gray-200 bg-white",
          "text-xs font-bold text-slate-600 uppercase tracking-wide",
          "focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300",
          "hover:border-gray-300 transition-all cursor-pointer"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

interface PedidosToolbarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (v: DateFilter) => void;
  onPageReset: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function PedidosToolbar({
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  onPageReset,
  isLoading,
  onRefresh,
}: PedidosToolbarProps) {
  const handleSearchChange = (v: string) => {
    setSearchTerm(v);
    onPageReset();
  };

  const handleDateChange = (v: DateFilter) => {
    setDateFilter(v);
    onPageReset();
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <SearchInput
        placeholder="Buscar por cliente o N° de pedido..."
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <div className="flex items-center gap-3 w-full md:w-auto">
        <FilterSelect
          value={dateFilter}
          onValueChange={handleDateChange}
          options={[
            { label: "Todas las fechas", value: "todas" },
            { label: "Hoy", value: "hoy" },
            { label: "Últimos 7 días", value: "semana" },
            { label: "Este mes", value: "mes" },
          ]}
        />

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