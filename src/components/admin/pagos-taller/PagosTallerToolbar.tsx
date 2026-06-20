'use client';

import { Search } from 'lucide-react';
import {
  ESTADOS_PAGO_TALLER_FILTRO,
  ESTADO_PAGO_TALLER_LABELS,
  METODOS_PAGO_TALLER,
  METODO_PAGO_TALLER_LABELS,
} from '@/lib/constants/pagos-taller';
import type { EstadoPagoTaller, MetodoPago } from '@prisma/client';

export interface PagosTallerFiltros {
  busqueda: string;
  estado: string;
  metodo_pago: string;
  taller_id: string;
}

interface Props {
  filtros: PagosTallerFiltros;
  talleres: Array<{ id: string | number; nombre: string }>;
  onChange: (filtros: PagosTallerFiltros) => void;
}

export function PagosTallerToolbar({ filtros, talleres, onChange }: Props) {
  return (
    <div className="flex flex-col xl:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar por taller, operación o notas..."
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>
      <select
        value={filtros.taller_id}
        onChange={(e) => onChange({ ...filtros, taller_id: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
      >
        <option value="todos">Todos los talleres</option>
        {talleres.map((t) => (
          <option key={String(t.id)} value={String(t.id)}>
            {t.nombre}
          </option>
        ))}
      </select>
      <select
        value={filtros.estado}
        onChange={(e) => onChange({ ...filtros, estado: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
      >
        <option value="todos">Todos los estados</option>
        {ESTADOS_PAGO_TALLER_FILTRO.map((estado) => (
          <option key={estado} value={estado}>
            {ESTADO_PAGO_TALLER_LABELS[estado as EstadoPagoTaller]}
          </option>
        ))}
      </select>
      <select
        value={filtros.metodo_pago}
        onChange={(e) => onChange({ ...filtros, metodo_pago: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
      >
        <option value="todos">Todos los métodos</option>
        {METODOS_PAGO_TALLER.map((metodo) => (
          <option key={metodo} value={metodo}>
            {METODO_PAGO_TALLER_LABELS[metodo as MetodoPago]}
          </option>
        ))}
      </select>
    </div>
  );
}
