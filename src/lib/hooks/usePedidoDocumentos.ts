'use client';

import { useQuery } from '@tanstack/react-query';
import { pedidoDocumentosApi } from '@/lib/constants/pedido-documentos';
import type { DocumentoPedido } from '@/lib/services/documentos.service';

export const PEDIDO_DOCUMENTOS_KEY = 'pedido-documentos';

export function usePedidoDocumentos(pedidoId: number | string | null, enabled = true) {
  return useQuery({
    queryKey: [PEDIDO_DOCUMENTOS_KEY, pedidoId],
    queryFn: async (): Promise<DocumentoPedido[]> => {
      const res = await fetch(pedidoDocumentosApi(pedidoId!), { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'No se pudieron cargar los documentos');
      }

      return json.data ?? [];
    },
    enabled: enabled && pedidoId != null && String(pedidoId).length > 0,
    refetchOnWindowFocus: false,
  });
}
