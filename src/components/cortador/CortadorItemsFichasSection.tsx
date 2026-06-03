'use client';

import type { ItemCorteConFicha } from '@/lib/helpers/registrar-corte-pedido.helper';
import { CortadorItemFichaCard } from './CortadorItemFichaCard';

interface Props {
  items: ItemCorteConFicha[];
}

export function CortadorItemsFichasSection({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-sm text-stone-500">
        Este pedido no tiene ítems con productos asociados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <CortadorItemFichaCard key={item.itemId} item={item} defaultOpen={index === 0} />
      ))}
    </div>
  );
}
