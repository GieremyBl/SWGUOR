'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, MapPin } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { PedidoHistorialAbonos } from '@/components/portal/pedidos/PedidoHistorialAbonos';
import { PedidoProgresoPago } from '@/components/portal/pedidos/PedidoProgresoPago';
import type { PedidoConDetalles } from '@/components/portal/pedidos/PedidoModalDetalle';
import type { AbonoPedido, PedidoPagosResumen } from '@/lib/schemas/portal-pedido-pagos';

interface PedidoItemDB {
  id: number;
  cantidad: number;
  especificaciones: Record<string, unknown> | null;
  productos: { sku: string; nombre: string } | null;
  variantes_producto: { talla: string; color: string } | null;
}

function ItemSkeleton() {
  return (
    <div className="grid grid-cols-12 p-3 items-center gap-2 animate-pulse">
      <div className="col-span-7 space-y-1.5">
        <div className="h-2 w-14 bg-neutral-200 rounded" />
        <div className="h-3 w-40 bg-neutral-200 rounded" />
        <div className="h-4 w-24 bg-amber-100 rounded" />
      </div>
      <div className="col-span-2 flex justify-center">
        <div className="h-3 w-8 bg-neutral-200 rounded" />
      </div>
      <div className="col-span-3 flex justify-end">
        <div className="h-3 w-16 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

interface PedidoDetalleResumenProps {
  pedido: PedidoConDetalles;
  onVerComprobante?: (pedidoId: number, comprobanteId: string) => void;
}

export function PedidoDetalleResumen({ pedido, onVerComprobante }: PedidoDetalleResumenProps) {
  const [items, setItems] = useState<PedidoItemDB[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [resumenPagos, setResumenPagos] = useState<PedidoPagosResumen | null>(null);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [errorPagos, setErrorPagos] = useState<string | null>(null);

  useEffect(() => {
    if (!pedido?.id) {
      setItems([]);
      return;
    }

    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from('pedido_items')
          .select(`
            id,
            cantidad,
            especificaciones,
            productos ( sku, nombre ),
            variantes_producto ( talla, color )
          `)
          .eq('pedido_id', pedido.id)
          .order('id');

        setItems((data as PedidoItemDB[]) ?? []);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [pedido?.id]);

  useEffect(() => {
    if (!pedido?.id) {
      setResumenPagos(null);
      setErrorPagos(null);
      return;
    }

    const fetchPagos = async () => {
      setLoadingPagos(true);
      setErrorPagos(null);
      try {
        const res = await fetch(`/api/portal/pedidos/${pedido.id}/pagos`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error ?? 'No se pudo cargar el historial de abonos');
        }

        setResumenPagos(json.data as PedidoPagosResumen);
      } catch (err) {
        setResumenPagos(null);
        setErrorPagos(err instanceof Error ? err.message : 'Error al cargar abonos');
      } finally {
        setLoadingPagos(false);
      }
    };

    fetchPagos();
  }, [pedido?.id]);

  const handleVerComprobanteAbono = useCallback(
    (abono: AbonoPedido) => {
      if (!pedido?.id || !abono.comprobante?.id || !onVerComprobante) return;
      onVerComprobante(pedido.id, abono.comprobante.id);
    },
    [pedido?.id, onVerComprobante],
  );

  const montoPagado = resumenPagos?.monto_pagado ?? Number(pedido.monto_pagado ?? 0);
  const saldoPendiente =
    resumenPagos?.saldo_pendiente ??
    Number(pedido.saldo_pendiente ?? Math.max(pedido.total - montoPagado, 0));
  const monedaPagos = resumenPagos?.moneda ?? pedido.moneda ?? 'PEN';
  const abonos = resumenPagos?.abonos ?? [];

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: pedido.moneda || 'PEN',
    }).format(amount);

  const subtotalNeto = pedido.total / 1.18;
  const igvCalculado = pedido.total - subtotalNeto;

  return (
    <div className="space-y-6 text-xs">
      <PedidoProgresoPago
        total={pedido.total}
        montoPagado={montoPagado}
        saldoPendiente={saldoPendiente}
        moneda={monedaPagos}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-3.5 rounded-xl border bg-neutral-50/50 space-y-1"
          style={{ borderColor: 'var(--guor-stone)' }}
        >
          <span
            className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1"
            style={{ color: 'var(--guor-dark)' }}
          >
            <MapPin size={11} /> Dirección de Envío
          </span>
          <p className="font-bold opacity-80 uppercase text-[11px]" style={{ color: 'var(--guor-dark)' }}>
            {pedido.direccion_envio || 'Retiro en Almacén Central GUOR'}
          </p>
        </div>

        <div
          className="p-3.5 rounded-xl border bg-neutral-50/50 space-y-1"
          style={{ borderColor: 'var(--guor-stone)' }}
        >
          <span
            className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1"
            style={{ color: 'var(--guor-dark)' }}
          >
            <FileText size={11} /> Notas del Pedido
          </span>
          <p className="font-medium opacity-70 italic text-[11px]" style={{ color: 'var(--guor-dark)' }}>
            {pedido.notas || 'Sin notas adicionales.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <span
          className="text-[9px] font-black uppercase tracking-widest opacity-50 block"
          style={{ color: 'var(--guor-dark)' }}
        >
          Artículos del Pedido
        </span>

        <div className="border rounded-xl overflow-hidden bg-white" style={{ borderColor: 'var(--guor-stone)' }}>
          <div
            className="grid grid-cols-12 bg-neutral-50 p-2.5 border-b font-black text-[9px] uppercase tracking-widest opacity-60"
            style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
          >
            <div className="col-span-7">Producto</div>
            <div className="col-span-2 text-center">Cant.</div>
            <div className="col-span-3 text-right">P. Unitario</div>
          </div>

          <div className="divide-y divide-neutral-100 max-h-52 overflow-y-auto">
            {loadingItems ? (
              <>
                <ItemSkeleton />
                <ItemSkeleton />
              </>
            ) : items.length > 0 ? (
              items.map((item) => {
                const precioUnitario = item.especificaciones?.precio_unitario as number | undefined;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 p-3 items-center font-medium"
                    style={{ color: 'var(--guor-dark)' }}
                  >
                    <div className="col-span-7 space-y-0.5">
                      <span className="text-[9px] font-mono opacity-40 uppercase tracking-tight block">
                        {item.productos?.sku ?? '—'}
                      </span>
                      <p className="font-black uppercase text-[11px] truncate">
                        {item.productos?.nombre ?? 'Producto sin nombre'}
                      </p>
                      {item.variantes_producto && (
                        <span className="inline-flex items-center text-[10px] text-amber-600 font-bold uppercase tracking-wide bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          Talla {item.variantes_producto.talla} · {item.variantes_producto.color}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-black tabular-nums">
                      {item.cantidad}
                      <span className="text-[9px] font-normal opacity-40"> uds</span>
                    </div>
                    <div className="col-span-3 text-right tabular-nums opacity-70">
                      {precioUnitario != null ? formatMoney(precioUnitario) : '—'}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center" style={{ color: 'var(--guor-dark)' }}>
                <p className="text-[10px] opacity-40">No se encontraron artículos para este pedido.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PedidoHistorialAbonos
        abonos={abonos}
        loading={loadingPagos}
        error={errorPagos}
        moneda={monedaPagos}
        onVerComprobante={onVerComprobante ? handleVerComprobanteAbono : undefined}
      />

      <div
        className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
      >
        <div className="space-y-1">
          <span
            className="text-[9px] font-black uppercase tracking-widest opacity-50 block"
            style={{ color: 'var(--guor-dark)' }}
          >
            Resumen fiscal
          </span>
          <p className="text-[10px] opacity-50" style={{ color: 'var(--guor-dark)' }}>
            Desglose del total del pedido (incluye IGV).
          </p>
        </div>

        <div
          className="space-y-1.5 text-right min-w-[180px] border-t md:border-t-0 pt-2 md:pt-0"
          style={{ borderColor: 'var(--guor-stone)' }}
        >
          <div className="flex justify-between text-[10px] opacity-60 font-bold" style={{ color: 'var(--guor-dark)' }}>
            <span>Subtotal neto:</span>
            <span className="tabular-nums">{formatMoney(subtotalNeto)}</span>
          </div>
          <div className="flex justify-between text-[10px] opacity-60 font-bold" style={{ color: 'var(--guor-dark)' }}>
            <span>IGV (18%):</span>
            <span className="tabular-nums">{formatMoney(igvCalculado)}</span>
          </div>
          <div
            className="flex justify-between items-baseline font-black border-t pt-1"
            style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
          >
            <span className="text-[9px] uppercase tracking-wider opacity-60">Total:</span>
            <span className="text-sm font-black" style={{ color: 'var(--guor-gold)' }}>
              {formatMoney(pedido.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
