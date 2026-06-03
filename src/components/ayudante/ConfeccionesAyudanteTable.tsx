'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ESTADO_LABELS } from '@/lib/schemas/confecciones';
import type { ConfeccionListItem } from '@/lib/helpers/confecciones-list.helper';

interface Props {
  items: ConfeccionListItem[];
}

export function ConfeccionesAyudanteTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
        No hay confecciones registradas.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 text-left border-b border-stone-100">
            <th className="px-4 py-3 text-[10px] font-black uppercase text-stone-500">#</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase text-stone-500">Taller</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase text-stone-500">Cantidad</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase text-stone-500">Estado</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase text-stone-500 text-right">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
              <td className="px-4 py-3 font-bold text-stone-800">
                {item.id}
                {item.pedidoId && (
                  <span className="block text-[10px] font-medium text-stone-400">
                    Pedido #{item.pedidoId}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-stone-800">{item.tallerNombre}</td>
              <td className="px-4 py-3 text-stone-700">{item.cantidad} u.</td>
              <td className="px-4 py-3">
                <span className="inline-flex text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {ESTADO_LABELS[item.estado as keyof typeof ESTADO_LABELS] ?? item.estado}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/ayudante/confecciones/${item.id}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'h-8 text-[10px] font-black uppercase tracking-widest',
                  )}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
