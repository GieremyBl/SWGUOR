import { getSupabaseBrowserClient } from '@/lib/supabase';

export type {
  EstadoPedido,
  SeguimientoPedido,
  PedidoConSeguimiento,
} from '@/lib/services/portal-seguimiento-pedido.service';

export {
  getPedidosActivos,
  actualizarDireccionDespacho,
} from '@/lib/services/portal-seguimiento-pedido.service';

import type { SeguimientoPedido } from '@/lib/services/portal-seguimiento-pedido.service';

export function subscribeSeguimiento(
  pedidoId: number,
  onInsert: (row: SeguimientoPedido) => void,
) {
  const supabase = getSupabaseBrowserClient();
  const channel = supabase
    .channel(`seguimiento-${pedidoId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'seguimiento_pedido',
        filter: `pedido_id=eq.${pedidoId}`,
      },
      (payload) => onInsert(payload.new as SeguimientoPedido),
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
