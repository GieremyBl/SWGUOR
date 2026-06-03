'use client';

import Link from 'next/link';
import { ArrowLeft, Scissors } from 'lucide-react';
import type { DetallePedidoData } from '@/components/admin/pedidos/detalles/types';
import type { ItemCorteConFicha } from '@/lib/helpers/registrar-corte-pedido.helper';
import { PedidoDetalleLectura } from '@/components/disenador/PedidoDetalleLectura';
import { CortadorItemsFichasSection } from './CortadorItemsFichasSection';
import { FormRegistroCorte } from './FormRegistroCorte';

interface Props {
  pedido: DetallePedidoData;
  itemsConFicha: ItemCorteConFicha[];
  corteCompletado: boolean;
  ordenId: string | null;
  puedeRegistrarCorte: boolean;
}

export function CortadorPedidoWorkspace({
  pedido,
  itemsConFicha,
  corteCompletado,
  ordenId,
  puedeRegistrarCorte,
}: Props) {
  return (
    <div className="max-w-[96rem] mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/admin/Panel-Administrativo/pedidos"
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-orange-600 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver a pedidos
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-sm">
            <Scissors size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Corte — Pedido #{pedido.id}
            </h1>
            <p className="text-sm text-stone-500 font-medium">
              Pedido en{' '}
              <span className="font-bold text-blue-700">
                {pedido.estado?.replace(/_/g, ' ') ?? '—'}
              </span>
              — revise las fichas por ítem y registre el corte al terminar
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">
          Pedido y cliente
        </h2>
        <PedidoDetalleLectura pedido={pedido} />
      </section>

      <section className="space-y-3">
        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          Ítems y fichas técnicas (solo lectura)
        </h2>
        <CortadorItemsFichasSection items={itemsConFicha} />
      </section>

      <section>
        <FormRegistroCorte
          pedidoId={pedido.id}
          corteCompletado={corteCompletado}
          ordenId={ordenId}
          puedeRegistrarCorte={puedeRegistrarCorte}
          pedidoEstado={pedido.estado ?? 'pendiente'}
        />
      </section>
    </div>
  );
}
