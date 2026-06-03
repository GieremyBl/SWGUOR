'use client';

import Link from 'next/link';
import {
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  Mail,
  MapPin,
  Phone,
  Clock,
} from 'lucide-react';
import { PedidoTracker } from '@/components/pedidos/PedidoTracker';
import { PedidoCambiarEstado } from './PedidoCambiarEstado';
import { Badge, SectionCard, FinRow } from './PedidoDetalleUI';
import { TabPagos } from './TabPagos';
import {
  ESTADO_CONFIG,
  PRIORIDAD_CONFIG,
  METODO_PAGO_LABELS,
  fmt,
  fmtDate,
  type DetallePedidoData,
} from './types';
import { ESTADOS_PEDIDO, TIPOS_CLIENTE } from '@/lib/constants/estados';
import type { TipoCliente } from '@prisma/client';

interface PedidoDetalleSeccionesProps {
  pedido: DetallePedidoData;
  puedeCambiarEstado: boolean;
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
    <ul className="text-[11px] text-stone-600 space-y-0.5 text-left">
      {Object.entries(espec).map(([key, value]) => (
        <li key={key}>
          <span className="font-bold text-stone-500">{key}:</span>{' '}
          {String(value)}
        </li>
      ))}
    </ul>
  );
}

export function PedidoDetalleSecciones({
  pedido,
  puedeCambiarEstado,
}: PedidoDetalleSeccionesProps) {
  const estadoCfg = ESTADO_CONFIG[pedido.estado];
  const estadoPedidoInfo = ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO];
  const estadoLabel = estadoCfg?.label ?? estadoPedidoInfo?.label ?? pedido.estado;
  const estadoColor =
    estadoCfg?.color ??
    (estadoPedidoInfo
      ? `${estadoPedidoInfo.bgColor} ${estadoPedidoInfo.color} border-stone-200`
      : 'bg-stone-100 text-stone-600 border-stone-200');
  const EstadoIcon = estadoCfg?.icon ?? Clock;

  const prioridadCfg =
    PRIORIDAD_CONFIG[pedido.prioridad] ?? PRIORIDAD_CONFIG.normal;

  const tipoCliente = pedido.clientes?.tipo_cliente as TipoCliente | undefined;
  const tipoClienteInfo = tipoCliente ? TIPOS_CLIENTE[tipoCliente] : null;

  const historial = [...(pedido.seguimiento_pedido ?? [])].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECCIÓN A — Cliente */}
        <SectionCard title="Información del cliente">
          {pedido.clientes ? (
            <div className="space-y-3 text-stone-800">
              <div>
                <p className="text-base font-black text-stone-900">
                  {pedido.clientes.razon_social ||
                    pedido.clientes.nombre_comercial ||
                    'Sin nombre'}
                </p>
                {pedido.clientes.nombre_comercial &&
                  pedido.clientes.nombre_comercial !==
                    pedido.clientes.razon_social && (
                    <p className="text-sm text-stone-500 font-medium">
                      {pedido.clientes.nombre_comercial}
                    </p>
                  )}
              </div>
              {tipoClienteInfo && (
                <span
                  className={`inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tipoClienteInfo.bgColor} ${tipoClienteInfo.color}`}
                >
                  {tipoClienteInfo.label}
                </span>
              )}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                {pedido.clientes.ruc != null && (
                  <p className="flex items-center gap-2 text-sm">
                    <Hash size={14} className="text-stone-400" />
                    RUC: {String(pedido.clientes.ruc)}
                  </p>
                )}
                {pedido.clientes.email && (
                  <p className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-stone-400" />
                    {pedido.clientes.email}
                  </p>
                )}
                {pedido.clientes.telefono != null && (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-stone-400" />
                    {String(pedido.clientes.telefono)}
                  </p>
                )}
              </div>
              <Link
                href={`/admin/Panel-Administrativo/clientes/${pedido.clientes.id}`}
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline"
              >
                Ver perfil del cliente
                <ExternalLink size={11} />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Sin cliente asignado</p>
          )}
        </SectionCard>

        {/* SECCIÓN B — Detalle del pedido */}
        <SectionCard title="Detalle del pedido">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                label={estadoLabel}
                color={estadoColor}
                icon={EstadoIcon}
              />
              <Badge
                label={prioridadCfg.label}
                color={prioridadCfg.color}
              />
              {puedeCambiarEstado && (
                <div className="ml-auto">
                  <PedidoCambiarEstado
                    pedidoId={pedido.id}
                    estadoActual={pedido.estado}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                  Fecha creación
                </p>
                <p className="font-semibold text-stone-900 flex items-center gap-1 mt-0.5">
                  <Calendar size={13} className="text-stone-400" />
                  {fmtDate(pedido.created_at)}
                </p>
              </div>
              {pedido.metodo_pago && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                    Método de pago
                  </p>
                  <p className="font-semibold text-stone-900 flex items-center gap-1 mt-0.5">
                    <CreditCard size={13} className="text-stone-400" />
                    {METODO_PAGO_LABELS[pedido.metodo_pago] ?? pedido.metodo_pago}
                  </p>
                </div>
              )}
            </div>

            {pedido.direccion_despacho && (
              <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <MapPin size={12} /> Dirección de despacho
                </p>
                <p className="text-sm text-stone-800">{pedido.direccion_despacho}</p>
              </div>
            )}

            <div className="border-t border-stone-100 pt-3 space-y-0.5">
              <FinRow label="Subtotal" value={pedido.subtotal} moneda="PEN" />
              {pedido.monto_descuento > 0 && (
                <FinRow
                  label="Descuento"
                  value={-pedido.monto_descuento}
                  moneda="PEN"
                />
              )}
              <FinRow label="IGV" value={pedido.igv} moneda="PEN" />
              {pedido.costo_envio > 0 && (
                <FinRow label="Costo envío" value={pedido.costo_envio} moneda="PEN" />
              )}
              <div className="pt-2 border-t border-stone-100">
                <FinRow label="Total" value={pedido.total} moneda="PEN" accent large />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* SECCIÓN E — Cotización origen */}
      {pedido.cotizacion && (
        <SectionCard title="Cotización de origen">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900">
                  {pedido.cotizacion.numero}
                </p>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Cotización vinculada al pedido
                </p>
              </div>
            </div>
            <Link
              href="/admin/Panel-Administrativo/cotizaciones"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-[10px] font-black uppercase tracking-widest text-stone-700 hover:bg-stone-50"
            >
              Ir a cotizaciones
              <ExternalLink size={12} />
            </Link>
          </div>
        </SectionCard>
      )}

      {/* SECCIÓN C — Ítems */}
      <SectionCard title="Ítems del pedido">
        {(pedido.pedido_items ?? []).length === 0 ? (
          <p className="text-sm text-stone-500 py-6 text-center">
            Sin ítems registrados
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  {[
                    'Producto',
                    'SKU',
                    'Color',
                    'Talla',
                    'Cantidad',
                    'Especificaciones',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-2 text-[10px] font-black text-stone-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedido.pedido_items.map((item) => {
                  const espec = item.especificaciones as Record<
                    string,
                    unknown
                  > | null;
                  const sku =
                    item.variantes_producto?.sku ??
                    item.productos?.sku ??
                    '—';
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-stone-50 hover:bg-stone-50/50"
                    >
                      <td className="py-3 px-2 font-semibold text-stone-900">
                        {item.productos?.nombre ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-stone-600 font-mono text-xs">
                        {sku}
                      </td>
                      <td className="py-3 px-2 text-stone-700">
                        {item.variantes_producto?.color ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-stone-700">
                        {item.variantes_producto?.talla ?? '—'}
                      </td>
                      <td className="py-3 px-2 font-bold text-stone-900 text-center">
                        {item.cantidad}
                      </td>
                      <td className="py-3 px-2 max-w-[200px]">
                        <EspecificacionesLista espec={espec} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* SECCIÓN D — Seguimiento */}
      <SectionCard title="Historial de seguimiento">
        <div className="space-y-6">
          <PedidoTracker pedidoId={pedido.id} variant="admin" />

          {historial.length > 0 ? (
            <ul className="space-y-3 border-t border-stone-100 pt-4">
              {historial.map((s) => {
                const cfg = ESTADO_CONFIG[s.estado] ?? ESTADOS_PEDIDO[s.estado as keyof typeof ESTADOS_PEDIDO];
                const label =
                  cfg && 'label' in cfg ? cfg.label : s.estado;
                return (
                  <li
                    key={s.id}
                    className="flex gap-3 border-l-2 border-rose-200 pl-3 py-1"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-stone-900 capitalize">
                          {label}
                        </span>
                        <span className="text-[10px] text-stone-400 font-bold">
                          {s.created_at
                            ? new Date(s.created_at).toLocaleString('es-PE')
                            : '—'}
                        </span>
                      </div>
                      {s.notas && (
                        <p className="text-xs text-stone-600 mt-1 bg-stone-50 rounded-lg px-2 py-1.5 border border-stone-100">
                          {s.notas}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider text-center py-4">
              Sin registros de seguimiento
            </p>
          )}
        </div>
      </SectionCard>

      {/* Pagos (complemento) */}
      <details className="bg-white border border-stone-100 rounded-2xl shadow-sm">
        <summary className="px-5 py-4 cursor-pointer text-[10px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
          <Building2 size={14} />
          Estado de pagos
        </summary>
        <div className="px-5 pb-5 border-t border-stone-50">
          <TabPagos pedido={pedido} />
        </div>
      </details>
    </div>
  );
}
