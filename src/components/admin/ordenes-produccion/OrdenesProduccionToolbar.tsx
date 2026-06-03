'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ETAPAS_PRODUCCION, ETAPA_LABELS } from '@/lib/schemas/ordenes-produccion';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface OrdenesProduccionToolbarProps {
  searchTerm:     string;
  etapaFilter:    string;
  onSearchChange: (v: string) => void;
  onEtapaChange:  (v: string) => void;
  onClear:        () => void;
}

export function OrdenesProduccionToolbar({
  searchTerm, etapaFilter,
  onSearchChange, onEtapaChange, onClear,
}: OrdenesProduccionToolbarProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white/50 p-2 rounded-2xl border border-slate-100">

        {/* Buscador */}
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <Input
            placeholder="Buscar por producto, taller o ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Selector de etapa */}
          <div className="w-full md:w-56">
            <Select value={etapaFilter} onValueChange={onEtapaChange}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white hover:border-slate-300 transition-all focus:ring-4 focus:ring-rose-500/10">
                <div className="flex items-center gap-2 text-slate-600">
                  <SlidersHorizontal size={14} className="text-slate-400" />
                  <SelectValue placeholder="Estado: Todos" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="all" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Todos los estados
                </SelectItem>
                {ETAPAS_PRODUCCION.map((etapa) => (
                  <SelectItem
                    key={etapa}
                    value={etapa}
                    className="text-xs font-medium focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
                  >
                    {ETAPA_LABELS[etapa]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limpiar */}
          {(searchTerm || etapaFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={onClear}
              className="h-10 px-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group"
            >
              <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}