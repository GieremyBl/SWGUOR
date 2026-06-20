'use client';

import { LayoutList, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MIS_PAGOS_VISTAS,
  type MisPagosVista,
} from '@/lib/constants/portal-mis-pagos';

const VISTA_ICONOS: Record<MisPagosVista, typeof LayoutList> = {
  pedidos: LayoutList,
  historico: History,
};

interface Props {
  value: MisPagosVista;
  onChange: (vista: MisPagosVista) => void;
  disabled?: boolean;
  className?: string;
}

export function MisPagosVistaSelector({ value, onChange, disabled, className }: Props) {
  return (
    <div
      className={cn(
        'inline-flex w-full sm:w-auto p-1 rounded-xl bg-[#f5f0e8] border border-[#e4c28a]/20',
        className,
      )}
      role="tablist"
      aria-label="Vista de mis pagos"
    >
      {MIS_PAGOS_VISTAS.map((vista) => {
        const Icon = VISTA_ICONOS[vista.id];
        const selected = value === vista.id;

        return (
          <button
            key={vista.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(vista.id)}
            className={cn(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
              selected
                ? 'bg-white text-[#231e1d] shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {vista.label}
          </button>
        );
      })}
    </div>
  );
}
