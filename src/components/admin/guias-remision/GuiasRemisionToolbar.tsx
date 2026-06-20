'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ESTADO_GUIA_LABELS,
  TIPO_GUIA_LABELS,
} from '@/lib/constants/guias-remision-ui';
import type { EstadoGuiaRemision, TipoGuiaRemision } from '@/lib/schemas/guias-remision';
import { Search } from 'lucide-react';

export interface GuiasRemisionFiltros {
  busqueda: string;
  tipo: 'todos' | TipoGuiaRemision;
  estado: 'todos' | EstadoGuiaRemision;
}

interface Props {
  filtros: GuiasRemisionFiltros;
  onChange: (filtros: GuiasRemisionFiltros) => void;
}

export function GuiasRemisionToolbar({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por número, origen o destino..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filtros.tipo}
        onValueChange={(value) =>
          onChange({ ...filtros, tipo: value as GuiasRemisionFiltros['tipo'] })
        }
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los tipos</SelectItem>
          {Object.entries(TIPO_GUIA_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.estado}
        onValueChange={(value) =>
          onChange({ ...filtros, estado: value as GuiasRemisionFiltros['estado'] })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          {Object.entries(ESTADO_GUIA_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
