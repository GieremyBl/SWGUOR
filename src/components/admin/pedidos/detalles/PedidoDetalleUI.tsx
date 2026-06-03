import React from 'react';
import { COMPANY_PALETTE } from '@/components/admin/dashboards/widgets/DashboardUtils';
import { fmt } from './types';

const G = COMPANY_PALETTE;

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label:    string;
  color:    string;           // Tailwind classes de color
  icon?:    React.ElementType;
}

export function Badge({ label, color, icon: Icon }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${color}`}>
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}

// ─── FinRow ───────────────────────────────────────────────────────────────────

interface FinRowProps {
  label:    string;
  value:    number;
  moneda?:  string;
  accent?:  boolean;   // Resalta con color rose + peso fuerte
  large?:   boolean;   // Texto más grande (para el TOTAL)
}

export function FinRow({ label, value, moneda, accent, large }: FinRowProps) {
  return (
    <div className={`flex justify-between items-center ${large ? 'py-2' : 'py-1'}`}>
      <span className={`text-xs ${accent ? 'font-black text-stone-900' : 'font-medium text-stone-500'}`}>
        {label}
      </span>
      <span
        className={`font-black ${large ? 'text-lg' : 'text-sm'} ${accent ? '' : 'text-stone-700'}`}
        style={accent ? { color: G.accent } : undefined}
      >
        {fmt(value, moneda)}
      </span>
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title?:    string;
  children:  React.ReactNode;
  className?: string;
  noPad?:    boolean;
}

export function SectionCard({ title, children, className = '', noPad }: SectionCardProps) {
  return (
    <div className={`bg-white border border-stone-100 rounded-2xl shadow-sm ${noPad ? '' : 'p-5'} ${className}`}>
      {title && (
        <h3 className={`text-[10px] font-black text-stone-400 uppercase tracking-widest ${noPad ? 'px-5 pt-5 pb-4' : 'mb-4'}`}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}