'use client';

import { Tag, Gift } from 'lucide-react';
import type { ProductoCampanaBadge } from '@/lib/services/portal-promociones-catalogo.service';
import { formatFechaCorta } from '@/lib/helpers/portal-promociones-display';

interface Props {
  badges: ProductoCampanaBadge[];
}

export function PromocionProductoBadge({ badges }: Props) {
  if (!badges.length) return null;

  const principal = badges[0];
  const Icon = principal.tipo === 'oferta' ? Gift : Tag;
  const tipoLabel = principal.tipo === 'oferta' ? 'Oferta' : 'Promo';

  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 group/badge">
      <span
        className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-black uppercase shadow-md cursor-default"
        style={{
          backgroundColor: principal.tipo === 'oferta' ? '#231e1d' : '#b5854b',
          color: '#fff',
        }}
      >
        <Icon size={12} aria-hidden />
        {badges.length > 1 ? `${badges.length}` : tipoLabel}
      </span>

      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible group-focus-within/badge:opacity-100 group-focus-within/badge:visible transition-all duration-200 z-20"
      >
        <div className="bg-slate-900 text-white text-xs rounded-xl shadow-xl p-3 space-y-2 border border-slate-700">
          {badges.map((b) => (
            <div
              key={`${b.tipo}-${b.campana_id}`}
              className="border-b border-slate-700 last:border-0 pb-2 last:pb-0"
            >
              <p className="font-bold text-amber-300">
                {b.tipo === 'oferta' ? 'Oferta' : 'Promoción'}: {b.campana_nombre}
              </p>
              {b.campana_descripcion && (
                <p className="text-slate-300 mt-0.5 leading-snug">{b.campana_descripcion}</p>
              )}
              <p className="text-slate-400 mt-1">
                Regla: {b.regla_nombre} · {b.valor_descuento}% subtotal
              </p>
              <p className="text-slate-400 mt-0.5">
                Vigencia: {formatFechaCorta(b.fecha_inicio)}
                {b.fecha_fin ? ` — ${formatFechaCorta(b.fecha_fin)}` : ' — Sin fecha fin'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
