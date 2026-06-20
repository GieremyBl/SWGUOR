'use client';

import { useEffect, useState } from 'react';
import type { PedidoConDetalles } from '@/components/portal/pedidos/PedidoModalDetalle';
import type { EstadoPedido } from '@/components/portal/pedidos/types';

export function usePortalPedidoDetalle(pedidoId: string) {
  const [pedido, setPedido] = useState<PedidoConDetalles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pedidoId) return;

    const fetchPedido = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/portal/pedidos/${pedidoId}`, { cache: 'no-store' });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error ?? 'Pedido no encontrado');
        }

        const data = json.data;
        setPedido({
          id: Number(data.id),
          total: Number(data.total ?? 0),
          estado: (data.estado ?? 'pendiente') as EstadoPedido,
          estado_pago: data.estado_pago ?? 'pendiente',
          created_at: data.created_at,
          total_unidades: Number(data.total_unidades ?? 0),
          moneda: data.moneda ?? 'PEN',
          monto_pagado: Number(data.monto_pagado ?? 0),
          saldo_pendiente: Number(data.saldo_pendiente ?? 0),
          direccion_envio: data.direccion_despacho ?? null,
          notas: data.notas_cliente ?? data.notas_pedido ?? null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    void fetchPedido();
  }, [pedidoId]);

  return { pedido, loading, error };
}
