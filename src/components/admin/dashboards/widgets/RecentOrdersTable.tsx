"use client";

import React from 'react';
import { Eye, Clock, CheckCircle2, AlertCircle, Truck, XCircle } from 'lucide-react';
import type { pedidos, clientes } from '@prisma/client';
import { EstadoPedido } from '@prisma/client';

type Pedido = pedidos & {
  clientes: Pick<clientes, 'razon_social'> | null;
};

interface RecentOrdersTableProps {
  orders: Pedido[];
  rol?:   string;
}

// ─── Paleta ERP ───────────────────────────────────────────────────────────────
const P = {
  accent:  '#1d3fa6',
  surface: '#f0f4ff',
  border:  '#d4dae5',
  bg:      '#f4f6f9',
  white:   '#ffffff',
  text:    '#0f172a',
  muted:   '#64748b',
};

// ─── Estado badges — colores semánticos neutros ───────────────────────────────
const STATUS_CONFIG: Record<EstadoPedido, {
  bg: string; color: string; border: string;
  icon: React.ReactNode; label: string;
}> = {
  pendiente: {
    bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe',
    icon: <Clock size={10} />, label: 'Pendiente',
  },
  en_produccion: {
    bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
    icon: <AlertCircle size={10} />, label: 'En producción',
  },
  listo_para_despacho: {
    bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0',
    icon: <Truck size={10} />, label: 'Listo despacho',
  },
  entregado: {
    bg: '#f8fafc', color: '#475569', border: '#e2e8f0',
    icon: <CheckCircle2 size={10} />, label: 'Entregado',
  },
  cancelado: {
    bg: '#fef2f2', color: '#dc2626', border: '#fecaca',
    icon: <XCircle size={10} />, label: 'Cancelado',
  },
  pagado: {
    bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff',
    icon: <CheckCircle2 size={10} />, label: 'Pagado',
  },
};

const FALLBACK = {
  bg: '#f8fafc', color: '#64748b', border: '#e2e8f0',
  icon: null, label: 'Sin estado',
};

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const pendientes = orders.filter((o) => o.estado === 'pendiente').length;

  return (
    <div style={{
      background:   P.white,
      border:       `1px solid ${P.border}`,
      borderRadius: 12,
      padding:      '20px 24px',
      boxShadow:    '0 1px 3px 0 rgb(0 0 0 / 0.07)',
      width:        '100%',
      overflow:     'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: P.text,
            textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Pedidos Recientes
          </h3>
          <p style={{ fontSize: 11, color: P.muted, marginTop: 3 }}>
            Monitor en tiempo real del flujo operativo
          </p>
        </div>
        <button style={{
          fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: P.white,
          background: P.text, border: 'none',
          padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
        }}>
          Ver todos
        </button>
      </div>

      {/* Tabla */}
      {orders.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center',
          fontSize: 12, color: P.muted, fontWeight: 500 }}>
          Sin pedidos recientes
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'separate',
          borderSpacing: '0 4px', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr style={{ fontSize: 9, fontWeight: 800, color: P.muted,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <th style={{ paddingBottom: 8, paddingLeft: 12, textAlign: 'left', fontWeight: 800 }}>ID</th>
              <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 800 }}>Cliente</th>
              <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 800 }}>Total</th>
              <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 800 }}>Estado</th>
              <th style={{ paddingBottom: 8, textAlign: 'right', paddingRight: 12, fontWeight: 800 }}>Ver</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const cfg = order.estado
                ? (STATUS_CONFIG[order.estado] ?? FALLBACK)
                : FALLBACK;

              return (
                <tr key={String(order.id)} style={{ transition: 'all 0.15s' }}>
                  {/* ID */}
                  <td style={{
                    padding: '10px 0 10px 12px',
                    background: P.bg, borderRadius: '8px 0 0 8px',
                    border: `1px solid transparent`,
                    borderRight: 'none',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800,
                      color: P.accent, fontStyle: 'italic' }}>
                      #{String(order.id).padStart(5, '0')}
                    </span>
                  </td>

                  {/* Cliente */}
                  <td style={{
                    padding: '10px 8px 10px 0',
                    background: P.bg,
                    borderTop: `1px solid transparent`,
                    borderBottom: `1px solid transparent`,
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: P.text,
                      textTransform: 'uppercase', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      margin: 0, paddingRight: 8 }}>
                      {order.clientes?.razon_social || 'Consumidor General'}
                    </p>
                    <p style={{ fontSize: 9, color: P.muted, fontWeight: 600,
                      textTransform: 'uppercase', marginTop: 2 }}>
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString('es-PE', {
                            day: 'numeric', month: 'short',
                          })
                        : 'Sin fecha'}
                    </p>
                  </td>

                  {/* Total */}
                  <td style={{
                    padding: '10px 8px',
                    background: P.bg,
                    borderTop: `1px solid transparent`,
                    borderBottom: `1px solid transparent`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: P.text }}>
                      S/ {Number(order.total ?? 0).toLocaleString('es-PE')}
                    </span>
                  </td>

                  {/* Estado */}
                  <td style={{
                    padding: '10px 8px',
                    background: P.bg,
                    borderTop: `1px solid transparent`,
                    borderBottom: `1px solid transparent`,
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 5,
                      fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                      background: cfg.bg, color: cfg.color,
                      border: `1px solid ${cfg.border}`,
                      maxWidth: 120, overflow: 'hidden',
                    }}>
                      {cfg.icon}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' }}>
                        {cfg.label}
                      </span>
                    </span>
                  </td>

                  {/* Ver */}
                  <td style={{
                    padding: '10px 12px 10px 0',
                    background: P.bg,
                    borderRadius: '0 8px 8px 0',
                    border: `1px solid transparent`,
                    borderLeft: 'none',
                    textAlign: 'right',
                  }}>
                    <button style={{
                      padding: '5px 6px', borderRadius: 6,
                      background: P.white, color: P.muted,
                      border: `1px solid ${P.border}`,
                      cursor: 'pointer', display: 'inline-flex',
                      transition: 'all 0.15s',
                    }}>
                      <Eye size={13} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Footer — pendientes */}
      {pendientes > 0 && (
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: '#eff6ff', borderRadius: 8,
          border: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertCircle size={13} style={{ color: '#1d4ed8', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#1e3a8a',
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {pendientes} Pedido{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: 9, color: '#1d4ed8', fontWeight: 600,
              textTransform: 'uppercase', marginTop: 1 }}>
              Requieren atención
            </p>
          </div>
        </div>
      )}
    </div>
  );
}