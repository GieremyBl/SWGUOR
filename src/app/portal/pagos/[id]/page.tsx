'use client';

import { useCallback, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ComprobantePdfSimuladoModal } from '@/components/portal/pagos/metodos-pagos/ComprobantePdfSimuladoModal';
import { PedidoDetallePageView } from '@/components/portal/pedidos/PedidoDetallePageView';
import {
  buildMisPagosVolverUrl,
  parseMisPagosVistaParam,
} from '@/lib/constants/portal-pedido-detalle';
import { usePortalPedidoDetalle } from '@/lib/hooks/usePortalPedidoDetalle';
import type { PagoConfirmacionResumen } from '@/lib/schemas/pago-confirmacion';

export default function MisPagosPedidoDetallePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pedidoId = String(params.id ?? '');
  const vista = parseMisPagosVistaParam(searchParams.get('vista'));

  const { pedido, loading, error } = usePortalPedidoDetalle(pedidoId);

  const [resumenComprobante, setResumenComprobante] = useState<PagoConfirmacionResumen | null>(
    null,
  );
  const [modalComprobanteOpen, setModalComprobanteOpen] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState<string | null>(null);

  const abrirComprobante = useCallback(async (idPedido: number, comprobanteId: string) => {
    setErrorComprobante(null);

    try {
      const query = new URLSearchParams({
        pedido_id: String(idPedido),
        comprobante_id: comprobanteId,
      });
      const res = await fetch(`/api/portal/pago/confirmacion?${query.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'No se pudo cargar el comprobante');
      }

      setResumenComprobante(json.data as PagoConfirmacionResumen);
      setModalComprobanteOpen(true);
    } catch (err) {
      setErrorComprobante(
        err instanceof Error ? err.message : 'Error al abrir el comprobante',
      );
    }
  }, []);

  return (
    <>
      {errorComprobante && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorComprobante}
          </div>
        </div>
      )}

      <PedidoDetallePageView
        pedido={pedido}
        loading={loading}
        error={error}
        backHref={buildMisPagosVolverUrl(vista)}
        backLabel="Volver a mis pagos"
        defaultTab="resumen"
        maxWidthClass="max-w-7xl"
        onVerComprobante={abrirComprobante}
      />

      {resumenComprobante && (
        <ComprobantePdfSimuladoModal
          open={modalComprobanteOpen}
          onOpenChange={setModalComprobanteOpen}
          resumen={resumenComprobante}
        />
      )}
    </>
  );
}
