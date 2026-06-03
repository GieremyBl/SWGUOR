'use client';

import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Definimos los estados reales del Admin basados en tu base de datos (image_b828c8.png)
export type EstadoCotizacionFiltro =
  | 'borrador'
  | 'enviada'
  | 'aprobada'
  | 'rechazada'
  | 'expirada'
  | 'convertida';

interface CotizacionesToolbarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  // Usamos el tipo limpio y local del admin
  estadoFiltro: EstadoCotizacionFiltro | null;
  onEstadoChange: (v: EstadoCotizacionFiltro | null) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function CotizacionesToolbar({
  searchTerm, onSearchChange,
  estadoFiltro, onEstadoChange,
  loading, onRefresh,
}: CotizacionesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por número, cliente o descripción..."
          className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        value={estadoFiltro ?? 'todos'}
        onChange={(e) =>
          onEstadoChange(e.target.value === 'todos' ? null : (e.target.value as EstadoCotizacionFiltro))
        }
        className="h-11 px-4 border border-gray-200 rounded-xl text-xs font-bold uppercase bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <option value="todos">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="enviada">Enviada</option>
        <option value="aprobada">Aprobada</option>
        <option value="convertida">Convertida</option>
        <option value="rechazada">Rechazada</option>
        <option value="expirada">Expirada</option>
      </select>

      <Button variant="outline" className="h-11 rounded-xl border-gray-200 hover:bg-gray-50" onClick={onRefresh}>
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}