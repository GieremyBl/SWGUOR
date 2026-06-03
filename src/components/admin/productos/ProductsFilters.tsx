"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  ArrowUpDown, 
  Plus, 
  X, 
  Filter,
  Check,
  Maximize2
} from "lucide-react";
import { TallaProductos, ColorPrenda } from '@prisma/client';

const DESTACADOS = Object.keys(ColorPrenda);

const COLOR_MAP: Record<string, string> = {
  azul: "#3B82F6",
  azulino: "#1E40AF",
  beige: "#F5F5DC",
  blanco: "#FFFFFF",
  camel: "#C19A6B",
  celeste: "#93C5FD",
  cemento: "#A0A0A0",
  chocolate: "#4B2C20",
  coral: "#FF7F50",
  crema: "#FFFDD0",
  fucsia: "#FF00FF",
  grafito: "#383838",
  gris: "#808080",
  guinda: "#800000",
  lila: "#C8A2C8",
 marron: "#5C4033",
  melange: "#BFC1C2",
  melon: "#FEB236",
  negro: "#000000",
  nude: "#E3BC9A",
  palo_rosa: "#D19292",
  perla: "#EAE0C8",
  piton: "#8B8C7A",
  rojo: "#EF4444",
  rosa: "#FFC0CB",
  rose: "#FF007F",
  verde: "#10B981",
  vino: "#722F37",
  animal_print: "#D2B48C"
};

// ── Definición de Interfaces Estrictas ──────────────────────────────────

export interface CategoriaBaseFiltro {
  id: string | number;
  nombre: string;
}

export interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  colorFilter: string;
  setColorFilter: (value: string) => void;
  sizeFilter: string;
  setSizeFilter: (value: string) => void;
  sortOrder: 'asc' | 'desc' | 'none';
  setSortOrder: (value: 'asc' | 'desc' | 'none') => void;
  selectedCategoria: string;
  setSelectedCategoria: (value: string) => void;
  categorias: CategoriaBaseFiltro[];
  colors: string[];
}

export default function ProductFilters({
  searchTerm,
  setSearchTerm,
  colorFilter,
  setColorFilter,
  sizeFilter,
  setSizeFilter,
  sortOrder,
  setSortOrder,
  selectedCategoria,
  setSelectedCategoria,
  categorias,
  colors
}: ProductFiltersProps) {

  const coloresRestantes = colors.filter(c => !DESTACADOS.includes(c));

  return (
    <div className="space-y-5 bg-guor-cream p-5 rounded-2xl border border-guor-peach shadow-sm">
      
      {/* FILA 1 */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* BUSCADOR */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-3 text-guor-gold/70 group-focus-within:text-guor-brown/70 w-4 h-4 transition-colors" />
          <Input 
            placeholder="Buscar por nombre o SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-guor-peach bg-guor-cream/60 focus:bg-guor-cream rounded-xl"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm("")} className="absolute right-3 top-3 text-guor-gold/70">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* CATEGORIAS */}
        <div className="w-full lg:w-64">
          <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
            <SelectTrigger className="h-11 rounded-xl border-guor-peach bg-guor-cream/60">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>

            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todas las categorías</SelectItem>

              {categorias?.map((cat) => (
                <SelectItem key={String(cat.id)} value={String(cat.id)}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ORDEN */}
        <Button 
          type="button"
          variant="outline" 
          onClick={() => {
            if (sortOrder === 'none') setSortOrder('asc');
            else if (sortOrder === 'asc') setSortOrder('desc');
            else setSortOrder('none');
          }}
          className={`h-11 px-6 rounded-xl font-bold ${
            sortOrder !== 'none' ? 'bg-guor-peach/50 border-guor-gold/50 text-guor-brown/90' : ''
          }`}
        >
          <ArrowUpDown className={`w-4 h-4 mr-2 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          {sortOrder === 'none'
            ? 'Ordenar Precio'
            : `Precio: ${sortOrder === 'asc' ? 'Menor a Mayor' : 'Mayor a Menor'}`}
        </Button>
      </div>

      {/* COLORES */}
      <div>
        <Label className="text-xs font-black uppercase text-guor-gold/70 flex items-center gap-2">
          <Filter className="w-3 h-3 text-guor-brown/70" /> Colores
        </Label>

        <div className="flex flex-wrap gap-2 mt-2 items-center">

          <button
            type="button"
            onClick={() => setColorFilter("")}
            className={`w-9 h-9 rounded-full relative border border-guor-peach ${
              colorFilter === "" ? "bg-guor-brown" : "bg-guor-peach/40"
            }`}
            title="Todos los colores"
          />

          {DESTACADOS.map((color) => {
            const c = color.toLowerCase();
            const backgroundColor = COLOR_MAP[c] || "#ccc";
            const isWhite = backgroundColor.toUpperCase() === "#FFFFFF";
            
            return (
              <button
                key={color}
                type="button"
                onClick={() => setColorFilter(c)}
                className={`w-9 h-9 rounded-full border border-guor-peach/50 flex items-center justify-center transition-all ${
                  colorFilter === c ? "ring-2 ring-guor-brown scale-105" : "hover:scale-105"
                }`}
                style={{ backgroundColor }}
              >
                {colorFilter === c && (
                  <Check className={`w-4 h-4 ${isWhite ? "text-slate-900" : "text-white"}`} />
                )}
              </button>
            );
          })}

          {/* MÁS COLORES */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" className="h-9 w-9 rounded-full border border-dashed border-guor-peach/80">
                <Plus className="w-4 h-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-64 p-3 rounded-2xl bg-white max-h-60 overflow-y-auto">
              {coloresRestantes.length === 0 ? (
                <p className="text-xs text-center text-guor-gold/60 py-2">No hay colores adicionales</p>
              ) : (
                coloresRestantes.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorFilter(color.toLowerCase())}
                    className="block w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-guor-cream/60 text-guor-dark font-medium transition-colors"
                  >
                    {color}
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>

        </div>
      </div>

      {/* TALLAS */}
      <div>
        <Label className="text-xs font-black uppercase text-guor-gold/70 flex items-center gap-2">
          <Maximize2 className="w-3 h-3 text-guor-brown/70" /> Tallas
        </Label>

        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={() => setSizeFilter("")}
            className={`px-3 h-9 rounded-xl font-bold text-xs tracking-wider transition-all ${
              sizeFilter === "" ? "bg-guor-brown text-white shadow-sm" : "bg-guor-peach/40 text-guor-brown hover:bg-guor-peach/60"
            }`}
          >
            TODAS
          </button>

          {Object.values(TallaProductos).map((talla) => (
            <button
              key={talla}
              type="button"
              onClick={() => setSizeFilter(talla)}
              className={`px-3 h-9 rounded-xl font-bold text-xs transition-all ${
                sizeFilter === talla ? "bg-guor-brown text-white shadow-sm" : "bg-guor-peach/40 text-guor-brown hover:bg-guor-peach/60"
              }`}
            >
              {talla}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}