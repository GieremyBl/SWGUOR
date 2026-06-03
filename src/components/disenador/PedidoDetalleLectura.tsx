'use client';

import Link from 'next/link';
import { ExternalLink, Hash, Mail, Phone } from 'lucide-react';
import { SectionCard } from '@/components/admin/pedidos/detalles/PedidoDetalleUI';
import { Badge } from '@/components/admin/pedidos/detalles/PedidoDetalleUI';
import {
  ESTADO_CONFIG,
  PRIORIDAD_CONFIG,
  METODO_PAGO_LABELS,
  fmt,
  fmtDate,
  type DetallePedidoData,
} from '@/components/admin/pedidos/detalles/types';
import { ESTADOS_PEDIDO, TIPOS_CLIENTE } from '@/lib/constants/estados';
import type { TipoCliente } from '@prisma/client';

interface Props {
  pedido: DetallePedidoData;
}

function EspecificacionesLista({
  espec,
}: {
  espec: Record<string, unknown> | null;
}) {
  if (!espec || Object.keys(espec).length === 0) {
    return <span className="text-stone-400 text-xs">—</span>;
  }
  return (
    <ul className="text-[11px] text-stone-600 space-y-0.5">
      {Object.entries(espec).map(([key, value]) => (
        <li key={key}>
          <span className="font-bold text-stone-500">{key}:</span> {String(value)}
        </li>
      ))}
    </ul>
  );
}

export function PedidoDetalleLectura({ pedido }: Props) {
  const estadoCfg = ESTADO_CONFIG[pedido.estado];
  const estadoPedidoInfo = ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO];
  const estadoLabel = estadoCfg?.label ?? estadoPedidoInfo?.label ?? pedido.estado;
  const estadoColor =
    estadoCfg?.color ??
    (estadoPedidoInfo
      ? `${estadoPedidoInfo.bgColor} ${estadoPedidoInfo.color} border-stone-200`
      : 'bg-stone-100 text-stone-600 border-stone-200');
  const EstadoIcon = estadoCfg?.icon;
  const prioridadCfg = PRIORIDAD_CONFIG[pedido.prioridad] ?? PRIORIDAD_CONFIG.normal;
  const tipoCliente = pedido.clientes?.tipo_cliente as TipoCliente | undefined;
  const tipoClienteInfo = tipoCliente ? TIPOS_CLIENTE[tipoCliente] : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Cliente">
          {pedido.clientes ? (
            <div className="space-y-3 text-stone-800">
              <p className="text-base font-black text-stone-900">
                {pedido.clientes.razon_social || pedido.clientes.nombre_comercial}
              </p>
              {tipoClienteInfo && (
                <span
                  className={`inline-flex text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${tipoClienteInfo.bgColor} ${tipoClienteInfo.color}`}
                >
                  {tipoClienteInfo.label}
                </span>
              )}
              <div className="space-y-2 text-sm">
                {pedido.clientes.ruc != null && (
                  <p className="flex items-center gap-2">
                    <Hash size={14} className="text-stone-400" />
                    RUC: {String(pedido.clientes.ruc)}
                  </p>
                )}
                {pedido.clientes.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-stone-400" />
                    {pedido.clientes.email}
                  </p>
                )}
                {pedido.clientes.telefono != null && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-stone-400" />
                    {String(pedido.clientes.telefono)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Sin cliente</p>
          )}
        </SectionCard>

        <SectionCard title="Resumen del pedido">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {EstadoIcon && (
                <Badge label={estadoLabel} color={estadoColor} icon={EstadoIcon} />
              )}
              <Badge label={prioridadCfg.label} color={prioridadCfg.color} />
            </div>
            <p className="text-sm text-stone-700">
              <span className="font-bold">Creado:</span> {fmtDate(pedido.created_at)}
            </p>
            {pedido.metodo_pago && (
              <p className="text-sm text-stone-700">
                <span className="font-bold">Pago:</span>{' '}
                {METODO_PAGO_LABELS[pedido.metodo_pago] ?? pedido.metodo_pago}
              </p>
            )}
            {pedido.direccion_despacho && (
              <p className="text-sm text-stone-700">
                <span className="font-bold">Despacho:</span> {pedido.direccion_despacho}
              </p>
            )}
            <div className="border-t border-stone-100 pt-2 text-sm space-y-1">
              <p>Subtotal: {fmt(pedido.subtotal, 'PEN')}</p>
              {pedido.monto_descuento > 0 && (
                <p>Descuento: {fmt(-pedido.monto_descuento, 'PEN')}</p>
              )}
              <p>IGV: {fmt(pedido.igv, 'PEN')}</p>
              {pedido.costo_envio > 0 && (
                <p>Envío: {fmt(pedido.costo_envio, 'PEN')}</p>
              )}
              <p className="font-black text-stone-900">Total: {fmt(pedido.total, 'PEN')}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Ítems del pedido">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                {['Producto', 'SKU', 'Color', 'Talla', 'Cant.', 'Especificaciones'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-2 text-[10px] font-black text-stone-500 uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(pedido.pedido_items ?? []).map((item) => (
                <tr key={item.id} className="border-b border-stone-50">
                  <td className="py-2 px-2 font-semibold text-stone-900">
                    {item.productos?.nombre ?? '—'}
                  </td>
                  <td className="py-2 px-2 text-xs font-mono text-stone-600">
                    {item.variantes_producto?.sku ?? item.productos?.sku ?? '—'}
                  </td>
                  <td className="py-2 px-2">{item.variantes_producto?.color ?? '—'}</td>
                  <td className="py-2 px-2">{item.variantes_producto?.talla ?? '—'}</td>
                  <td className="py-2 px-2 font-bold text-center">{item.cantidad}</td>
                  <td className="py-2 px-2 max-w-[180px]">
                    <EspecificacionesLista
                      espec={item.especificaciones as Record<string, unknown> | null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {pedido.cotizacion && (
        <SectionCard title="Cotización origen">
          <p className="text-sm font-bold text-stone-800">{pedido.cotizacion.numero}</p>
          <Link
            href="/admin/Panel-Administrativo/cotizaciones"
            className="text-[10px] font-black uppercase text-violet-600 hover:underline inline-flex items-center gap-1 mt-2"
          >
            Ver módulo de cotizaciones <ExternalLink size={11} />
          </Link>
        </SectionCard>
      )}
    </div>
  );
}
