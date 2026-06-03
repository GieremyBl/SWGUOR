'use client';

import Link from 'next/link';
import { FileText, ArrowUpRight, Plus } from 'lucide-react';
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
      className="bg-guor-surface rounded-2xl overflow-hidden border border-guor-line shadow-card"
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b border-guor-line-soft"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-guor-cream-deep text-guor-soft"
          >
            <FileText size={15} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-guor-ink">
              Cotizaciones Recientes
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-widest text-guor-muted">
              Presupuestos activos
            </p>
          </div>
        </div>
        <Link
          href="/portal/cotizaciones"
          className="text-[10px] font-black uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg bg-guor-cream-deep text-guor-soft hover:bg-guor-line hover:text-guor-ink"
        >
          Ver todas
        </Link>
      </div>

      {cotizaciones.length > 0 ? (
        <>
          {/* Thead */}
          <div
            className="grid px-5 py-2.5 bg-guor-bg border-b border-guor-line-soft"
            style={{
              gridTemplateColumns: '1fr auto auto auto',
              gap: '1rem',
            }}
          >
            {['Documento', 'Items', 'Total', ''].map((h) => (
              <span key={h} className="text-[9px] font-black uppercase tracking-widest text-guor-muted">
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-guor-cream-deep">
            {cotizaciones.map((c) => (
              <div
                key={c.id}
                className="grid px-5 py-3.5 items-center transition-colors hover:bg-guor-bg"
                style={{ gridTemplateColumns: '1fr auto auto auto', gap: '1rem' }}
              >
                {/* Documento */}
                <div>
                  <p className="text-xs font-black text-guor-ink">{c.numero}</p>
                  <p className="text-[10px] font-medium mt-0.5 text-guor-muted">
                    {formatDateLong(c.created_at)}
                  </p>
                </div>

                {/* Items */}
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-guor-cream-deep text-guor-soft"
                >
                  {c.total_items} prod.
                </span>

                {/* Total */}
                <span className="text-xs font-black text-guor-ink">
                  {formatCurrency(c.total ?? 0)}
                </span>

                {/* Acción */}
                <Link
                  href={`/portal/cotizaciones/${c.id}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-guor-cream-deep text-guor-soft hover:bg-guor-dark hover:text-guor-bg"
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
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-guor-cream-deep text-guor-stone-mid"
          >
            <FileText size={28} />
          </div>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-guor-ink">
              Sin solicitudes
            </p>
            <p className="text-[10px] font-medium mt-1 text-guor-muted">
              Aún no tienes cotizaciones recientes
            </p>
          </div>
          <Link
            href="/portal/cotizaciones/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-guor-dark text-guor-bg border border-guor-dark hover:bg-guor-gold hover:border-guor-gold hover:text-guor-dark"
          >
            <Plus size={13} /> Nueva Solicitud
          </Link>
        </div>
      )}
    </div>
  );
}