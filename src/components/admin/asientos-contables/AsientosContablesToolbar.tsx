'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CUENTAS_CONTABLES_OPTIONS } from '@/lib/constants/asientos-contables-ui';
import type { CuentaContable } from '@/lib/schemas/asientos-contables';
import { Calendar } from 'lucide-react';

export interface AsientosContablesFiltros {
  fecha_desde: string;
  fecha_hasta: string;
  cuenta: 'todas' | CuentaContable;
  busqueda: string;
}

interface Props {
  filtros: AsientosContablesFiltros;
  onChange: (filtros: AsientosContablesFiltros) => void;
}

export function AsientosContablesToolbar({ filtros, onChange }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 flex-1">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => onChange({ ...filtros, fecha_desde: e.target.value })}
            className="pl-9"
            aria-label="Fecha desde"
          />
        </div>
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => onChange({ ...filtros, fecha_hasta: e.target.value })}
            className="pl-9"
            aria-label="Fecha hasta"
          />
        </div>
      </div>

      <Select
        value={filtros.cuenta}
        onValueChange={(value) =>
          onChange({ ...filtros, cuenta: value as AsientosContablesFiltros['cuenta'] })
        }
      >
        <SelectTrigger className="w-full lg:w-[220px]">
          <SelectValue placeholder="Cuenta contable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las cuentas</SelectItem>
          {CUENTAS_CONTABLES_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Buscar descripción, pedido o pago..."
        value={filtros.busqueda}
        onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
        className="lg:max-w-xs"
      />
    </div>
  );
}
