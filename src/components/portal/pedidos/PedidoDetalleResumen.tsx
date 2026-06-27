'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, MapPin } from 'lucide-react';
import { PedidoHistorialAbonos } from '@/components/portal/pedidos/PedidoHistorialAbonos';
import { PedidoProgresoPago } from '@/components/portal/pedidos/PedidoProgresoPago';
import type { PedidoConDetalles } from '@/components/portal/pedidos/PedidoModalDetalle';
import type { AbonoPedido } from '@/lib/schemas/portal-pedido-pagos';

interface PedidoItemDB {
  id: number;
  cantidad: number;
  especificaciones: Record<string, any> | null;
  productos: {
    id: number;
    nombre: string;
    categoria?: string | null;
    precio_base?: number | null;
  } | null;
  variantes_producto: {
    id: number;
    talla?: string | null;
    color?: string | null;
    precio?: number | null;
  } | null;
}

function ItemSkeleton() {
  return (
    <div className="grid grid-cols-12 p-3 items-center gap-2 animate-pulse">
      <div className="col-span-7 space-y-1.5">
        <div className="h-2 w-14 bg-neutral-200 rounded" />
        <div className="h-3 w-40 bg-neutral-200 rounded" />
        <div className="h-4 w-24 bg-amber-100 rounded" />
      </div>
      <div className="col-span-2 flex flex-col items-center space-y-1">
        <div className="h-2 w-8 bg-neutral-200 rounded" />
        <div className="h-3 w-6 bg-neutral-200 rounded" />
      </div>
      <div className="col-span-3 flex flex-col items-end space-y-1">
        <div className="h-2 w-12 bg-neutral-200 rounded" />
        <div className="h-3 w-16 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

interface PedidoDetalleResumenProps {
  pedido: PedidoConDetalles;
}

export function PedidoDetalleResumen({ pedido }: PedidoDetalleResumenProps) {
  const pedidoId = pedido.id;

  const [items, setItems] = useState<PedidoItemDB[]>([]);
  const [loading, setLoading] = useState(true);

  const [abonos, setAbonos] = useState<AbonoPedido[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(true);

  const cargarItemsPedido = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/pedidos/${pedidoId}/items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PedidoItemDB[] = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Error al cargar items del pedido:', err);
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  const cargarDatosPagos = useCallback(async () => {
    try {
      setLoadingPagos(true);
      const res = await fetch(`/api/portal/pedidos/${pedidoId}/abonos`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AbonoPedido[] = await res.json();
      setAbonos(data);
    } catch (err) {
      console.error('Error al cargar datos de pagos:', err);
    } finally {
      setLoadingPagos(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    cargarItemsPedido();
    cargarDatosPagos();
  }, [cargarItemsPedido, cargarDatosPagos]);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const totalPedido = Number(pedido.total ?? 0);
  const montoPagado = Number(pedido.monto_pagado ?? 0);
  const saldoPendiente = Math.max(totalPedido - montoPagado, 0);

  const subtotalNeto = totalPedido / 1.18;
  const igvCalculado = totalPedido - subtotalNeto;

  return (
    <div className="space-y-6">
      {/* SECCIÓN A: Estado de Pago */}
      <div>
        <span
          className="text-[10px] font-black uppercase tracking-wider block mb-2"
          style={{ color: 'var(--guor-dark)' }}
        >
          Estado financiero del pedido
        </span>
        <PedidoProgresoPago
          total={totalPedido}
          montoPagado={montoPagado}
          saldoPendiente={saldoPendiente}
          moneda="PEN"
        />
      </div>

      {/* SECCIÓN B: Ítems del pedido */}
      <div className="space-y-2">
        <span
          className="text-[10px] font-black uppercase tracking-wider block"
          style={{ color: 'var(--guor-dark)' }}
        >
          Artículos y Productos Solicitados
        </span>

        {loading ? (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            {Array.from({ length: 2 }).map((_, idx) => (
              <ItemSkeleton key={idx} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-xl bg-slate-50/50 text-xs text-slate-400 italic">
            No se encontraron productos registrados en este pedido.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            {items.map((item) => {
              const esp = item.especificaciones || {};

              // Datos reales de la BD > fallback a especificaciones JSON
              const nombreProducto = item.productos?.nombre || esp.modelo || 'Prenda sin especificar';
              const tipoPrenda = item.productos?.categoria || esp.prenda_tipo || 'General';
              const talla = item.variantes_producto?.talla || esp.talla || '-';
              const color = item.variantes_producto?.color || esp.color || '-';
              const cantidad = item.cantidad || 0;
              const precioUnitario =
                Number(item.variantes_producto?.precio ?? item.productos?.precio_base ?? esp.precio_unitario ?? 0);
              const subtotalItem = cantidad * precioUnitario;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 p-3.5 items-center gap-2 hover:bg-slate-50/40 transition-colors"
                >
                  <div className="col-span-7 space-y-0.5">
                    <span className="text-[9px] font-black text-pink-600 tracking-wider uppercase bg-pink-50 px-1.5 py-0.5 rounded">
                      {tipoPrenda}
                    </span>
                    <h4 className="text-xs font-black text-slate-800 pt-1 leading-tight">
                      {nombreProducto}
                    </h4>
                    <div className="flex gap-2 text-[10px] font-bold text-slate-500 pt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        Talla: <strong className="text-slate-700">{talla}</strong>
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        Color: <strong className="text-slate-700">{color}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                      Cant.
                    </span>
                    <p className="text-xs font-black text-slate-700 tabular-nums bg-slate-50 px-2 py-1 rounded-lg border mt-0.5">
                      {cantidad} u.
                    </p>
                  </div>

                  <div className="col-span-3 text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">
                      Monto
                    </span>
                    <p className="text-xs font-black text-slate-800 tabular-nums mt-0.5">
                      {formatMoney(subtotalItem)}
                    </p>
                    {cantidad > 1 && precioUnitario > 0 && (
                      <span className="text-[9px] text-slate-400 font-medium block tabular-nums">
                        ({formatMoney(precioUnitario)} c/u)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN C: Resumen Fiscal */}
      <div
        className="rounded-xl border p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
        style={{ backgroundColor: 'var(--guor-cream-light)', borderColor: 'var(--guor-stone)' }}
      >
        <div className="space-y-0.5 max-w-md">
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: 'var(--guor-dark)' }} />
            <span
              className="text-xs font-black uppercase tracking-wider block"
              style={{ color: 'var(--guor-dark)' }}
            >
              Resumen fiscal
            </span>
          </div>
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
            <span className="text-base tabular-nums font-black" style={{ color: 'var(--guor-dark)' }}>
              {formatMoney(totalPedido)}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN D: Dirección de Despacho */}
      <div className="rounded-xl border p-4 bg-white space-y-3 shadow-sm border-slate-100">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
          <MapPin size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
            Información del Destino de Despacho
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-slate-400 font-bold text-[10px] uppercase">Dirección física:</p>
            <p className="font-black text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {pedido.direccion_envio || 'Retiro en almacén central / Sin especificar'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 font-bold text-[10px] uppercase">Ubigeo / Región:</p>
            <p className="font-black text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {pedido.ubigeo_envio || 'Lima Metropolitana'}
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN E: Historial de Abonos */}
      <PedidoHistorialAbonos
        abonos={abonos}
        loading={loadingPagos}
        error={null}
        moneda="PEN"
      />
    </div>
  );
}