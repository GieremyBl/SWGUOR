'use client';

import Link from 'next/link';
import { FileText, ArrowUpRight, Plus } from 'lucide-react';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { formatCurrency, formatDateLong } from '@/lib/helpers/format-helpers';
import type { EstadoCotizacion } from '@prisma/client';

interface Cotizacion {
  id: number;
  numero: string;
  total: number | null;
  estado: EstadoCotizacion;
  created_at: string;
  total_items: number;
  moneda: string;
}

interface RecentQuotesProps {
  cotizaciones: Cotizacion[];
}

export function RecentQuotes({ cotizaciones }: RecentQuotesProps) {
  return (
    <div
      className="bg-guor-surface rounded-2xl overflow-hidden"
      style={{ border: '1px solid #e8d5a8', boxShadow: '0 1px 4px 0 rgb(26 20 16 / 0.06)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid #ede8e0' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#f5efe4', color: '#8a6d3b' }}
          >
            <FileText size={15} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight" style={{ color: '#1a1410' }}>
              Cotizaciones Recientes
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#b0a090' }}>
              Presupuestos activos
            </p>
          </div>
        </div>
        <Link
          href="/portal/cotizaciones"
          className="text-[10px] font-black uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg"
          style={{ color: '#8a6d3b', background: '#f5efe4' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#e8d5a8';
            (e.currentTarget as HTMLElement).style.color = '#1a1410';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '#f5efe4';
            (e.currentTarget as HTMLElement).style.color = '#8a6d3b';
          }}
        >
          Ver todas
        </Link>
      </div>

      {cotizaciones.length > 0 ? (
        <>
          {/* Thead */}
          <div
            className="grid px-5 py-2.5"
            style={{
              gridTemplateColumns: '1fr auto auto auto',
              gap: '1rem',
              background: '#fdf9f3',
              borderBottom: '1px solid #ede8e0',
            }}
          >
            {['Documento', 'Items', 'Total', ''].map((h) => (
              <span key={h} className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#b0a090' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: '#f5efe4' }}>
            {cotizaciones.map((c) => (
              <div
                key={c.id}
                className="grid px-5 py-3.5 items-center transition-colors"
                style={{ gridTemplateColumns: '1fr auto auto auto', gap: '1rem' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fdf9f3'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Documento */}
                <div>
                  <p className="text-xs font-black" style={{ color: '#1a1410' }}>{c.numero}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: '#b0a090' }}>
                    {formatDateLong(c.created_at)}
                  </p>
                </div>

                {/* Items */}
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-lg"
                  style={{ background: '#f5efe4', color: '#8a6d3b' }}
                >
                  {c.total_items} prod.
                </span>

                {/* Total */}
                <span className="text-xs font-black" style={{ color: '#1a1410' }}>
                  {formatCurrency(c.total ?? 0)}
                </span>

                {/* Acción */}
                <Link
                  href={`/portal/cotizaciones/${c.id}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: '#f5efe4', color: '#8a6d3b' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#1a1410';
                    (e.currentTarget as HTMLElement).style.color = '#fdf9f3';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = '#f5efe4';
                    (e.currentTarget as HTMLElement).style.color = '#8a6d3b';
                  }}
                >
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="py-14 flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: '#f5efe4', color: '#d8d0c4' }}
          >
            <FileText size={28} />
          </div>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#1a1410' }}>
              Sin solicitudes
            </p>
            <p className="text-[10px] font-medium mt-1" style={{ color: '#b0a090' }}>
              Aún no tienes cotizaciones recientes
            </p>
          </div>
          <Link
            href="/portal/cotizaciones/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            style={{ background: '#1a1410', color: '#fdf9f3', border: '1.5px solid #1a1410' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#c4a35a';
              (e.currentTarget as HTMLElement).style.borderColor = '#c4a35a';
              (e.currentTarget as HTMLElement).style.color = '#1a1410';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#1a1410';
              (e.currentTarget as HTMLElement).style.borderColor = '#1a1410';
              (e.currentTarget as HTMLElement).style.color = '#fdf9f3';
            }}
          >
            <Plus size={13} /> Nueva Solicitud
          </Link>
        </div>
      )}
    </div>
  );
}