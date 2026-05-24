'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface KpiItem {
  label: string;
  value: number;
  sub: string;
  icon: LucideIcon;
  href: string;
}

interface KpiCardsProps {
  kpis: KpiItem[];
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group relative bg-guor-surface border border-guor-line rounded-2xl p-4 md:p-5 overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ boxShadow: '0 1px 4px 0 rgb(26 20 16 / 0.06)' }}
          >
            {/* Acento izquierdo gold */}
            <div
              className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full transition-all duration-300 opacity-40 group-hover:opacity-100 group-hover:top-2 group-hover:bottom-2"
              style={{ background: '#c4a35a' }}
            />

            {/* Icono flotante de fondo */}
            <div className="absolute -bottom-3 -right-3 transition-all duration-300 opacity-[0.06] group-hover:opacity-[0.10] group-hover:scale-110">
              <Icon size={72} color="#1a1410" />
            </div>

            <div className="relative flex flex-col gap-3">
              {/* Icono pequeño */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: '#f5efe4',
                  color: '#8a6d3b',
                }}
                onMouseEnter={() => { }}
              >
                <Icon size={17} />
              </div>

              {/* Número */}
              <div>
                <span
                  className="text-3xl md:text-4xl font-black leading-none tracking-tight transition-colors duration-300"
                  style={{ color: '#1a1410' }}
                >
                  {kpi.value}
                </span>
              </div>

              {/* Labels */}
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#1a1410' }}>
                  {kpi.label}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#b0a090' }}>
                  {kpi.sub}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}