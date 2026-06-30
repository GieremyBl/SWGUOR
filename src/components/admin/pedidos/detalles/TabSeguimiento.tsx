// components/admin/pedidos/detalles/TabSeguimiento.tsx
'use client';

import React from 'react';
import { PedidoTimeline } from './PedidoTimeline';
import type { DetallePedidoData } from './types';

interface TabSeguimientoProps {
  pedido: DetallePedidoData;
}

export function TabSeguimiento({ pedido }: TabSeguimientoProps) {
  return (
    <div className="space-y-4">
      <PedidoTimeline pedidoId={pedido.id} />
    </div>
  );
}