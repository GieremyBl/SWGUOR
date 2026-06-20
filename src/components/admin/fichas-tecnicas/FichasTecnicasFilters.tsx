"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowUpDown,
  X,
  Filter,
  FileText,
  Tag,
} from "lucide-react";

import { ESTADOS_FICHA, LISTA_ESTADOS_FICHA } from "@/lib/constants/fichas-tecnicas";

export interface FichasTecnicasFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  estadoFilter: string;
  setEstadoFilter: (value: string) => void;
  sortOrder: "asc" | "desc" | "none";
  setSortOrder: (value: "asc" | "desc" | "none") => void;
  selectedCategoria: string;
  setSelectedCategoria: (value: string) => void;
  categorias: { id: string | number; nombre: string }[];
  onRefresh?: () => void;
}

export default function FichasTecnicasFilters({
  searchTerm,
  setSearchTerm,
  estadoFilter,
  setEstadoFilter,
  sortOrder,
  setSortOrder,
  selectedCategoria,
  setSelectedCategoria,
  categorias,
  onRefresh,
}: FichasTecnicasFiltersProps) {
  return (
    <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">

      {/* ── FILA 1: Buscar + Categoría + Ordenar ─────────────── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Buscador */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-pink-500 w-4 h-4 transition-colors" />
          <Input
            placeholder="Buscar por nombre, SKU, versión..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categoría */}
        <div className="w-full lg:w-64">
          <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ordenar por costo */}
        <Button
          variant="outline"
          onClick={() => {
            if (sortOrder === "none") setSortOrder("asc");
            else if (sortOrder === "asc") setSortOrder("desc");
            else setSortOrder("none");
          }}
          className={`h-11 px-6 rounded-xl font-bold ${
            sortOrder !== "none"
              ? "bg-pink-50 border-pink-200 text-pink-700"
              : ""
          }`}
        >
          <ArrowUpDown
            className={`w-4 h-4 mr-2 transition-transform ${
              sortOrder === "desc" ? "rotate-180" : ""
            }`}
          />
          {sortOrder === "none"
            ? "Ordenar Costo"
            : `Costo: ${sortOrder === "asc" ? "Menor a Mayor" : "Mayor a Menor"}`}
        </Button>
      </div>

      {/* ── FILA 2: Estados ──────────────────────────────────── */}
      <div>
        <Label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
          <Filter className="w-3 h-3 text-pink-500" /> Estado
        </Label>

        <div className="flex flex-wrap gap-2 mt-2">

          {/* Todos */}
          <button
            onClick={() => setEstadoFilter("")}
            className={`px-4 h-9 rounded-xl text-sm font-bold transition-all ${
              estadoFilter === ""
                ? "bg-pink-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos
          </button>

          {LISTA_ESTADOS_FICHA.map((value) => (
            <button
              key={value}
              onClick={() => setEstadoFilter(value)}
              className={`flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-bold transition-all ${
                estadoFilter === value
                  ? "bg-pink-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    estadoFilter === value ? "white" : ESTADOS_FICHA[value].dot,
                }}
              />
              {ESTADOS_FICHA[value].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FILA 3: Tipo de ficha ────────────────────────────── */}
      <div>
        <Label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
          <FileText className="w-3 h-3 text-pink-500" /> Tipo de ficha
        </Label>

        <div className="flex flex-wrap gap-2 mt-2">
          {["Todas", "Con PDF", "Sin PDF", "Con Medidas", "Con Materiales"].map(
            (tipo) => (
              <button
                key={tipo}
                className="px-3 h-9 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                {tipo}
              </button>
            )
          )}
        </div>
      </div>

    </div>
  );
}