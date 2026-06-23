"use client";

import { useState, useId } from "react";
import SearchInput from "../common/SearchInput";
import FilterSelect from "../common/FilterSelect";
import { Button } from "@/components/ui/button";
import { Scale, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoriaOpcion {
  id: number | string;
  nombre: string;
}

interface InventarioToolbarProps {
  isInsumos: boolean;
  // Búsqueda
  searchTermIns: string;
  setSearchTermIns: (v: string) => void;
  searchTermMat: string;
  setSearchTermMat: (v: string) => void;
  // Tipo
  selectedTipoIns: string;
  setSelectedTipoIns: (v: string) => void;
  selectedTipoMat: string;
  setSelectedTipoMat: (v: string) => void;
  // Categoría (solo insumos por ahora — viene de categoria_insumo)
  selectedCategoriaIns: string;
  setSelectedCategoriaIns: (v: string) => void;
  categorias: CategoriaOpcion[];
  // Refresh
  cargando: boolean;
  onRefresh: () => void;
}

export default function InventarioToolbar({
  isInsumos,
  searchTermIns, setSearchTermIns,
  searchTermMat, setSearchTermMat,
  selectedTipoIns, setSelectedTipoIns,
  selectedTipoMat, setSelectedTipoMat,
  selectedCategoriaIns, setSelectedCategoriaIns,
  categorias,
  cargando,
  onRefresh,
}: InventarioToolbarProps) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [kilos, setKilos] = useState("");
  const [rendimiento, setRendimiento] = useState("");
  const kilosId = useId();
  const rendId = useId();

  const k = parseFloat(kilos) || 0;
  const r = parseFloat(rendimiento) || 0;
  const total = k * r;
  const hasResult = k > 0 && r > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* ── Fila principal ── */}
      <div className="flex flex-col md:flex-row gap-3 p-4">

        {/* Búsqueda */}
        <SearchInput
          placeholder={isInsumos ? "Buscar insumo por nombre..." : "Buscar tela, hilos, cierres o avíos..."}
          value={isInsumos ? searchTermIns : searchTermMat}
          onChange={isInsumos ? setSearchTermIns : setSearchTermMat}
        />

        {/* Tipo — valores deben matchear el enum de Postgres exactamente */}
        <FilterSelect
          value={isInsumos ? selectedTipoIns : selectedTipoMat}
          onValueChange={isInsumos ? setSelectedTipoIns : setSelectedTipoMat}
          options={[
            { label: "Todos los tipos", value: "todos" },
            ...(isInsumos ? [
              // TipoInsumo (Postgres): materia_prima, avio, empaque, suministro
              { label: "Materia Prima", value: "materia_prima" },
              { label: "Avíos (botones, cierres)", value: "avio" },
              { label: "Empaque", value: "empaque" },
              { label: "Suministros", value: "suministro" },
            ] : [
              // TipoMaterial (Postgres): punto, plano, no_tejido, especial
              { label: "Punto", value: "punto" },
              { label: "Plano", value: "plano" },
              { label: "No Tejido", value: "no_tejido" },
              { label: "Especial", value: "especial" },
            ])
          ]}
        />

        {/* Categoría — solo insumos, viene de categoria_insumo */}
        {isInsumos && (
          <FilterSelect
            value={selectedCategoriaIns}
            onValueChange={setSelectedCategoriaIns}
            options={[
              { label: "Todas las categorías", value: "todos" },
              ...categorias.map((c) => ({ label: c.nombre, value: String(c.id) })),
            ]}
          />
        )}

        {/* Botón calculadora — solo en materiales */}
        {!isInsumos && (
          <button
            onClick={() => setCalcOpen(v => !v)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 h-11 text-sm font-bold transition-all",
              calcOpen ? "bg-[#231e1d] text-[#e4c28a] border border-[rgba(228,194,138,0.35)] shadow-lg" : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
            )}
          >
            <Scale className="w-4 h-4" />
            <span>Calculadora</span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 transition-transform duration-200", calcOpen && "rotate-180")}
            />
          </button>
        )}

        {/* Refresh */}
        <Button variant="outline" className="h-11 border-gray-200 rounded-xl px-4" onClick={onRefresh} disabled={cargando}>
          <RefreshCw className={cn("w-4 h-4 text-gray-500", cargando && "animate-spin")} />
        </Button>
      </div>

      {/* ── Panel calculadora deslizante ── */}
      <div
        className="transition-[grid-template-rows] duration-300 ease-in-out"
        style={{
          display: "grid",
          gridTemplateRows: calcOpen ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden bg-[#1c1815] border-t border-[rgba(228,194,138,0.12)]">
          <div className="flex flex-wrap items-end gap-6 px-6 py-6">
            {/* Label */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(228,194,138,0.1)]">
                <Scale className="h-5 w-5 text-[#e4c28a]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#e4c28a]">Rendimiento</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#b5854b]">Calculadora de Tela</span>
              </div>
            </div>

            <div className="hidden h-10 w-px bg-[rgba(228,194,138,0.12)] sm:block" />

            {/* Kilos */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={kilosId} className="text-[9px] font-bold uppercase tracking-widest text-[#b5854b]">
                Peso del rollo
              </label>
              <div className="relative">
                <input
                  id={kilosId}
                  type="number" min="0" step="0.1" placeholder="0.0"
                  value={kilos}
                  onChange={e => setKilos(e.target.value)}
                  className="w-28 rounded-xl py-2 pl-4 text-sm font-bold outline-none bg-[#2e2623] border border-[#3d3028] text-[#fff4e2] focus:border-[rgba(228,194,138,0.5)] transition-all"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase text-[#b5854b]">
                  kg
                </span>
              </div>
            </div>

            <span className="mb-2 text-xl font-black text-[rgba(228,194,138,0.3)]">×</span>

            {/* Rendimiento */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={rendId} className="text-[9px] font-bold uppercase tracking-widest text-[#b5854b]">
                Rendimiento
              </label>
              <div className="relative">
                <input
                  id={rendId}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={rendimiento}
                  onChange={e => setRendimiento(e.target.value)}
                  className="w-28 rounded-xl py-2 pl-4 text-sm font-bold outline-none bg-[#2e2623] border border-[#3d3028] text-[#fff4e2] focus:border-[rgba(228,194,138,0.5)] transition-all"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase text-[#b5854b]">
                  m/kg
                </span>
              </div>
            </div>

            <span className="mb-2 text-xl font-black text-[rgba(228,194,138,0.3)]">=</span>

            {/* Resultado */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#b5854b]">
                Total disponible
              </span>
              <div
                className={cn(
                  "flex items-baseline gap-2 rounded-xl px-5 py-2 border transition-all min-w-[120px]",
                  hasResult ? "bg-[rgba(228,194,138,0.1)] border-[rgba(228,194,138,0.3)]" : "bg-[#2e2623] border-[#3d3028]"
                )}
              >
                <span className={cn("text-lg font-black tabular-nums transition-colors", hasResult ? "text-[#e4c28a]" : "text-[#4a3e38]")}>
                  {hasResult ? total.toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
                </span>
                {hasResult && <span className="text-[10px] font-black uppercase text-[#b5854b]">metros</span>}
              </div>
            </div>

            {/* Limpiar */}
            {hasResult && (
              <button
                onClick={() => { setKilos(""); setRendimiento(""); }}
                className="mb-0.5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#b5854b] border border-[#3d3028] hover:border-[rgba(228,194,138,0.4)] hover:text-[#e4c28a] transition-all active:scale-95"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}