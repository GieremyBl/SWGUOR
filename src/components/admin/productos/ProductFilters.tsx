// src/components/admin/productos/ProductFilters.tsx
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
  Maximize2,
  Tag
} from "lucide-react";

// Mapeo de colores destacados para los círculos visuales
const COLOR_MAP: Record<string, string> = {
  "Blanco": "#FFFFFF",
  "Negro": "#000000",
  "Gris": "#94a3b8",
  "Azul marino": "#1e3a8a",
  "Rojo": "#dc2626",
  "Beige": "#f5f5dc",
  "Rosa pastel": "#fbcfe8",
};

const DESTACADOS = Object.keys(COLOR_MAP);
const TALLAS_ORDEN = ["S", "M", "L", "XL"]; // Basado en tu catálogo

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
  categorias: any[];
  colors: string[];
}

export default function ProductFilters({ ...props }: ProductFiltersProps) {
  // Filtramos los colores que no están en la lista de destacados para el Popover
  const coloresRestantes = props.colors.filter(c => !DESTACADOS.includes(c));

  return (
    <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      
      {/* FILA 1: BÚSQUEDA, CATEGORÍA Y ORDENAMIENTO */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Buscador Dinámico */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-pink-500 w-4 h-4 transition-colors" />
          <Input 
            placeholder="Buscar por nombre o SKU..." 
            value={props.searchTerm}
            onChange={(e) => props.setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all rounded-xl"
          />
          {props.searchTerm && (
            <button 
              onClick={() => props.setSearchTerm("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selector de Categorías (Integrado) */}
        <div className="w-full lg:w-64">
          <Select value={props.selectedCategoria} onValueChange={props.setSelectedCategoria}>
            <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 rounded-xl focus:ring-pink-500">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Categorías" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {props.categorias.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Botón de Ordenar por Precio */}
        <Button 
          variant="outline" 
          onClick={() => props.setSortOrder(props.sortOrder === 'asc' ? 'desc' : 'asc')}
          className={`h-11 px-6 rounded-xl font-bold transition-all border-slate-200 ${
            props.sortOrder !== 'none' ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-white text-slate-600'
          }`}
        >
          <ArrowUpDown className={`w-4 h-4 mr-2 transition-transform ${props.sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          Precio: {props.sortOrder === 'asc' ? 'Menor a Mayor' : props.sortOrder === 'desc' ? 'Mayor a Menor' : 'Ordenar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
        
        {/* SECCIÓN DE COLORES (Círculos Swatches) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3 text-pink-500" /> Filtrar por Color
            </Label>
            {props.colorFilter && (
              <button 
                onClick={() => props.setColorFilter("")}
                className="text-[10px] font-bold text-pink-600 hover:underline uppercase"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => props.setColorFilter("")}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all ${
                props.colorFilter === "" 
                  ? "border-pink-600 bg-pink-600 text-white shadow-lg shadow-pink-100" 
                  : "border-slate-100 bg-slate-100 text-slate-400"
              }`}
            >
              ALL
            </button>

            {DESTACADOS.map((color) => (
              <button
                key={color}
                onClick={() => props.setColorFilter(color)}
                title={color}
                className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 active:scale-90 relative flex items-center justify-center ${
                  props.colorFilter === color 
                    ? "border-pink-600 ring-4 ring-pink-50" 
                    : "border-slate-200 shadow-sm"
                }`}
                style={{ backgroundColor: COLOR_MAP[color] }}
              >
                {props.colorFilter === color && (
                  <Check className={`w-4 h-4 ${color === "Blanco" || color === "Beige" || color === "Rosa pastel" ? "text-slate-900" : "text-white"}`} />
                )}
              </button>
            ))}

            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`h-9 w-9 rounded-full p-0 flex items-center justify-center transition-all ${
                    coloresRestantes.includes(props.colorFilter) ? "bg-pink-600 text-white shadow-lg" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-white p-3 rounded-2xl shadow-xl border-slate-100" align="start">
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {coloresRestantes.map((color) => (
                    <button
                      key={color}
                      onClick={() => props.setColorFilter(color)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                        props.colorFilter === color ? "bg-pink-50 text-pink-700" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* SECCIÓN DE TALLAS (NUEVO) */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Maximize2 className="w-3 h-3 text-pink-500" /> Filtrar por Talla
          </Label>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => props.setSizeFilter("")}
              className={`px-4 h-9 rounded-xl border-2 text-[10px] font-black transition-all ${
                props.sizeFilter === "" 
                  ? "border-pink-600 bg-pink-600 text-white shadow-lg shadow-pink-100" 
                  : "border-slate-100 bg-slate-100 text-slate-400 hover:border-slate-200"
              }`}
            >
              TODAS
            </button>

            {TALLAS_ORDEN.map((talla) => (
              <button
                key={talla}
                onClick={() => props.setSizeFilter(talla)}
                className={`w-9 h-9 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center ${
                  props.sizeFilter === talla 
                    ? "border-pink-600 bg-pink-50 text-pink-700 ring-4 ring-pink-50" 
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {talla}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}