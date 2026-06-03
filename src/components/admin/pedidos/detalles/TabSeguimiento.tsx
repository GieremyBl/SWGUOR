'use client';

import React from 'react';
import { PedidoTracker } from '@/components/pedidos/PedidoTracker';
import type { DetallePedidoData } from './types';

interface TabSeguimientoProps {
  pedido: DetallePedidoData;
}

export function TabSeguimiento({ pedido }: TabSeguimientoProps) {
  return (
    <div className="space-y-4">
      <PedidoTracker pedidoId={pedido.id} variant="admin" />
    </div>
  );
}
