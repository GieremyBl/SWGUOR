'use client';

import { PedidoDetalleHeader } from './PedidoDetalleHeader';
import { PedidoDetalleSecciones } from './PedidoDetalleSecciones';
import type { DetallePedidoData, TallerOption } from './types';

export type { DetallePedidoData, TallerOption };

interface PedidoDetalleProps {
  pedido: DetallePedidoData;
  puedeCambiarEstado: boolean;
}

export default function PedidoDetalle({
  pedido,
  puedeCambiarEstado,
}: PedidoDetalleProps) {
  return (
    <div className="max-w-[96rem] mx-auto px-4 py-6 space-y-5">
      <PedidoDetalleHeader pedido={pedido} />
      <PedidoDetalleSecciones
        pedido={pedido}
        puedeCambiarEstado={puedeCambiarEstado}
      />
    </div>
  );
}
