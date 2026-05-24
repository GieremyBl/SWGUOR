"use client";

import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import type { Database } from '@/types/database';
import { useRouter } from 'next/navigation';

type Insumo = Database['public']['Tables']['insumo']['Row'];

interface StockAlertCardProps {
  items: Insumo[];
  rol?: string;
}

const P = {
  accent:  '#1d3fa6',
  surface: '#f0f4ff',
  border:  '#c0d0ff',
  bg:      '#f4f6f9',
  white:   '#ffffff',
  text:    '#0f172a',
  muted:   '#64748b',
  danger:  '#dc2626',
  dangerBg:'#fef2f2',
  dangerBorder: '#fecaca',
};

export default function StockAlertCard({ items }: StockAlertCardProps) {
  const router = useRouter();

  return (
    <div style={{
      background:   P.white,
      border:       `1px solid ${P.border}`,
      borderRadius: 12,
      padding:      '20px 20px',
      boxShadow:    '0 1px 3px 0 rgb(0 0 0 / 0.07)',
      display:      'flex',
      flexDirection:'column',
      height:       '100%',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            padding: 8, borderRadius: 8,
            background: P.dangerBg, color: P.danger,
            border: `1px solid ${P.dangerBorder}`,
            display: 'flex', flexShrink: 0,
          }}>
            <AlertTriangle size={16} strokeWidth={2} />
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: P.text,
              textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Stock Crítico
            </h3>
            <p style={{ fontSize: 9, color: P.muted, textTransform: 'uppercase',
              letterSpacing: '0.08em', marginTop: 2 }}>
              Insumos por agotarse
            </p>
          </div>
        </div>

        {/* Badge cantidad */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: P.dangerBg, border: `1px solid ${P.dangerBorder}`,
          borderRadius: 6, padding: '3px 8px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: P.danger, display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: P.danger,
            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {items.length} alerta{items.length !== 1 ? 's' : ''} activa{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Lista */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        maxHeight: 280, overflowY: 'auto', flex: 1,
      }}>
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px',
              background: P.dangerBg,
              border: `1px solid ${P.dangerBorder}`,
              borderRadius: 8,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: P.white, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${P.dangerBorder}`, flexShrink: 0,
                }}>
                  <Package size={14} style={{ color: P.danger }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#991b1b',
                    textTransform: 'uppercase', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                    {item.nombre}
                  </p>
                  <p style={{ fontSize: 10, color: P.danger, fontWeight: 600, marginTop: 2 }}>
                    {String(item.stock_actual)} {item.unidad_medida}
                  </p>
                </div>
              </div>
              <button style={{
                padding: '5px 7px', borderRadius: 6,
                background: P.white, color: P.danger,
                border: `1px solid ${P.dangerBorder}`,
                cursor: 'pointer', flexShrink: 0, display: 'flex',
              }}>
                <ArrowRight size={13} />
              </button>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 0', opacity: 0.5 }}>
            <Package size={36} style={{ color: P.border, marginBottom: 8 }} />
            <p style={{ fontSize: 10, color: P.muted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Inventario completo ✓
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <button
        onClick={() => router.push('/admin/inventario')}
        style={{
          width: '100%', marginTop: 14,
          padding: '9px 0',
          background: P.text, color: P.white,
          border: 'none', borderRadius: 8,
          fontSize: 10, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        Reponer Inventario
        <ArrowRight size={13} />
      </button>
    </div>
  );
}