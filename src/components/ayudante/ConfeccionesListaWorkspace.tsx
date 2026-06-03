'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import type {
  ConfeccionListItem,
  TallerSelectOption,
} from '@/lib/helpers/confecciones-list.helper';
import { ConfeccionesAyudanteTable } from './ConfeccionesAyudanteTable';

interface Props {
  items: ConfeccionListItem[];
  talleres: TallerSelectOption[];
  tallerActual: string | null;
}

export function ConfeccionesListaWorkspace({ items, talleres, tallerActual }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTallerChange = (value: string) => {
    if (value === 'todos') {
      router.push(pathname);
      return;
    }
    router.push(`${pathname}?taller=${encodeURIComponent(value)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-stone-600 shrink-0">
          <Building2 size={16} className="text-stone-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
            Filtrar por taller
          </span>
        </div>
        <select
          value={tallerActual ?? 'todos'}
          onChange={(e) => handleTallerChange(e.target.value)}
          className="h-10 w-full sm:max-w-xs rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <option value="todos">Todos los talleres</option>
          {talleres.map((taller) => (
            <option key={taller.id} value={taller.id}>
              {taller.nombre}
              {taller.especialidad ? ` · ${taller.especialidad.replace(/_/g, ' ')}` : ''}
            </option>
          ))}
        </select>
        {talleres.length === 0 && (
          <p className="text-xs text-amber-700">
            No hay talleres activos registrados. Créelos en Talleres.
          </p>
        )}
      </div>

      <ConfeccionesAyudanteTable items={items} />
    </div>
  );
}
