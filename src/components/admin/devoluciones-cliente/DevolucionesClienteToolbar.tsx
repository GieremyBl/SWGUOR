'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESTADO_DEVOLUCION_LABELS } from '@/lib/constants/devoluciones-cliente';
import { Search } from 'lucide-react';

export interface DevolucionesClienteFiltros {
  busqueda: string;
  estado: string;
}

interface Props {
  filtros: DevolucionesClienteFiltros;
  onChange: (filtros: DevolucionesClienteFiltros) => void;
}

export function DevolucionesClienteToolbar({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por cliente, pedido, producto..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className="pl-9"
        />
      </div>
      <Select
        value={filtros.estado}
        onValueChange={(estado) => onChange({ ...filtros, estado })}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          {Object.entries(ESTADO_DEVOLUCION_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
