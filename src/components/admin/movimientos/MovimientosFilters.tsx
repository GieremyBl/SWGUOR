"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";

export interface MovimientosFiltersState {
  tipoMovimiento?: string;
  referenciaMovimiento?: string;
  tipoItem?: "producto" | "insumo" | "material";
  busqueda?: string;
  desde?: string;
  hasta?: string;
}

interface MovimientosFiltersProps {
  onFilterChange: (filters: MovimientosFiltersState) => void;
}

// Sentinel para "sin filtro"
const ALL = "todos";

const TIPOS_MOVIMIENTO = [
  { grupo: "Básicos", items: [
    { value: "entrada",  label: "Entrada" },
    { value: "salida",   label: "Salida" },
    { value: "ajuste",   label: "Ajuste" },
  ]},
  { grupo: "Producción", items: [
    { value: "consumo_orden_produccion",       label: "Consumo O/P" },
    { value: "consumo_orden_produccion_item",  label: "Consumo O/P (ítem)" },
    { value: "produccion_entrada",             label: "Entrada de Producción" },
  ]},
  { grupo: "Devoluciones", items: [
    { value: "devolucion_consumo",               label: "Dev. Consumo" },
    { value: "devolucion_a_proveedor",           label: "Dev. a Proveedor" },
    { value: "recepcion_devolucion_proveedor",   label: "Recep. Dev. Proveedor" },
    { value: "devolucion_a_cliente",             label: "Dev. a Cliente" },
    { value: "recepcion_devolucion_cliente",     label: "Recep. Dev. Cliente" },
  ]},
  { grupo: "Incidencias", items: [
    { value: "incidencia_taller", label: "Incidencia en Taller" },
  ]},
];

const REFERENCIAS = [
  { value: "ORDEN_COMPRA",       label: "Orden de Compra" },
  { value: "ORDEN_PRODUCCION",   label: "Orden de Producción" },
  { value: "PEDIDO_CLIENTE",     label: "Pedido de Cliente" },
  { value: "DEVOLUCION",         label: "Devolución" },
  { value: "AJUSTE_MANUAL",      label: "Ajuste Manual" },
  { value: "MERMA_INCIDENCIA",   label: "Merma / Incidencia" },
  { value: "INVENTARIO_INICIAL", label: "Inventario Inicial" },
];

export function MovimientosFilters({ onFilterChange }: MovimientosFiltersProps) {
  const [filters, setFilters] = useState<MovimientosFiltersState>({});
  const [busquedaInput, setBusquedaInput] = useState("");
  const [uiValues, setUiValues] = useState({
    tipoMovimiento: ALL,
    referenciaMovimiento: ALL,
    tipoItem: ALL,
  });

  // Debounce sobre el campo de búsqueda — se dispara sólo 400ms después de que el usuario deja de escribir
  const busquedaDebounced = useDebounce(busquedaInput, 400);

  useEffect(() => {
    const updated = { ...filters, busqueda: busquedaDebounced || undefined };
    setFilters(updated);
    onFilterChange(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaDebounced]);

  const handleSelectChange = (key: keyof typeof uiValues, value: string) => {
    setUiValues((prev) => ({ ...prev, [key]: value }));
    const realValue = value === ALL ? undefined : (value as never);
    const updated = { ...filters, [key]: realValue };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleDateChange = (key: "desde" | "hasta", value: string) => {
    const updated = { ...filters, [key]: value || undefined };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    setBusquedaInput("");
    setFilters({});
    setUiValues({ tipoMovimiento: ALL, referenciaMovimiento: ALL, tipoItem: ALL });
    onFilterChange({});
  };

  const hasFilters =
    !!busquedaInput ||
    uiValues.tipoMovimiento !== ALL ||
    uiValues.referenciaMovimiento !== ALL ||
    uiValues.tipoItem !== ALL ||
    !!filters.desde ||
    !!filters.hasta;

  return (
    <div className="space-y-4">
      {/* Encabezado de filtros */}
      <div className="flex items-center gap-2 pb-1">
        <SlidersHorizontal className="w-4 h-4 text-pink-500" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filtros</span>
        {hasFilters && (
          <span className="ml-1 px-2 py-0.5 bg-pink-100 text-pink-600 text-[10px] font-black uppercase rounded-full tracking-wider">
            Activos
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Búsqueda con debounce */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Buscar artículo</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Nombre de producto, insumo..."
              className="pl-9 h-10 rounded-xl border-slate-200 text-sm bg-slate-50 focus:bg-white transition-colors"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
            />
          </div>
        </div>

        {/* Tipo de Movimiento — 12 tipos agrupados */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de Movimiento</label>
          <Select value={uiValues.tipoMovimiento} onValueChange={(v) => handleSelectChange("tipoMovimiento", v)}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:bg-white transition-colors">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value={ALL}>Todos los tipos</SelectItem>
              {TIPOS_MOVIMIENTO.map((grupo) => (
                <SelectGroup key={grupo.grupo}>
                  <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                    {grupo.grupo}
                  </SelectLabel>
                  {grupo.items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Artículo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de Artículo</label>
          <Select value={uiValues.tipoItem} onValueChange={(v) => handleSelectChange("tipoItem", v)}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:bg-white transition-colors">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="producto">Productos</SelectItem>
              <SelectItem value="insumo">Insumos</SelectItem>
              <SelectItem value="material">Materiales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Referencia */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Referencia</label>
          <Select value={uiValues.referenciaMovimiento} onValueChange={(v) => handleSelectChange("referenciaMovimiento", v)}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:bg-white transition-colors">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value={ALL}>Todas</SelectItem>
              {REFERENCIAS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha desde */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desde</label>
          <Input
            type="date"
            value={filters.desde || ""}
            onChange={(e) => handleDateChange("desde", e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:bg-white transition-colors"
          />
        </div>

        {/* Fecha hasta */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasta</label>
          <Input
            type="date"
            value={filters.hasta || ""}
            onChange={(e) => handleDateChange("hasta", e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:bg-white transition-colors"
          />
        </div>

        {/* Botón limpiar */}
        <div className="flex items-end col-span-1 sm:col-span-2 lg:col-span-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasFilters}
            className="h-10 px-4 rounded-xl border-slate-200 text-slate-500 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition-all gap-2 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}