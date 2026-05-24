import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ESTADOS_PEDIDO, ESTADOS_PAGO, PRIORIDADES_PEDIDO, TIPOS_CLIENTE } from '@/lib/constants/estados';

type EstadoPedido =
  | 'solicitado' | 'cotizado' | 'aprobado' | 'pagado'
  | 'en_proceso' | 'finalizado' | 'cancelado';

export interface PaletaColors {
  accent: string;
  bg: string;
  bgSoft: string;
  border: string;
  text: string;
  mid: string;
  primary: string;
  secondary: string;
  dark: string;
  cream: string;
  peach: string;
  beige: string;
  white: string;
}

// ─── PALETA CORPORATIVA ROSE ──────────────────────────────────────────────────
export const COMPANY_PALETTE: PaletaColors = {
  accent:    '#e11d48',   // guor-600  — rose principal
  primary:   '#e11d48',   // guor-600
  secondary: '#be123c',   // guor-700  — hover / pressed

  bg:        '#fafaf9',   // guor-bg   — off-white cálido
  bgSoft:    '#fff1f2',   // guor-50   — surface tint rose
  white:     '#ffffff',
  beige:     '#fff1f2',   // guor-50   — icon bg
  cream:     '#ffe4e6',   // guor-100  — stock crítico bg
  peach:     '#fecdd3',   // guor-200  — stock crítico border

  text:      '#1c1917',   // guor-ink  — warm-black
  dark:      '#1c1917',   // guor-ink
  mid:       '#78716c',   // guor-soft — warm-gray (texto secundario)

  border:    '#e7e5e4',   // guor-line — warm-stone
};

export type RolPaleta =
  | 'administrador' | 'gerente' | 'recepcionista'
  | 'disenador' | 'cortador' | 'representante_taller' | 'ayudante';

export const ROLE_PALETTES: Record<RolPaleta, PaletaColors> = {
  administrador:        COMPANY_PALETTE,
  gerente:              COMPANY_PALETTE,
  recepcionista:        COMPANY_PALETTE,
  disenador:            COMPANY_PALETTE,
  cortador:             COMPANY_PALETTE,
  ayudante:             COMPANY_PALETTE,
  representante_taller: COMPANY_PALETTE,
} as const;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function groupByDate(rows: { created_at: string; total: number }[]) {
  const acc: Record<string, number> = {};
  for (const r of rows) {
    const d = new Date(r.created_at).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short',
    });
    acc[d] = (acc[d] ?? 0) + Number(r.total);
  }
  return Object.entries(acc).map(([date, monto]) => ({ date, monto }));
}

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
export const ESTADO_ICONS: Record<string, React.ReactNode> = {
  solicitado: <Clock size={11} />,
  cotizado:   <Clock size={11} />,
  aprobado:   <CheckCircle2 size={11} />,
  pagado:     <CheckCircle2 size={11} />,
  en_proceso: <AlertCircle size={11} />,
  finalizado: <CheckCircle2 size={11} />,
  cancelado:  <AlertCircle size={11} />,
};

export const toBadgeCls = (color: string, bgColor: string) =>
  `${bgColor.replace('100', '50')} ${color} border ${bgColor.replace('bg-', 'border-').replace('100', '200')}`;

export function getOrdenStatus(estado: string) {
  const key = estado?.toLowerCase() as EstadoPedido;
  const cfg = ESTADOS_PEDIDO[key];
  if (!cfg) return { label: estado ?? '—', cls: 'bg-slate-50 text-slate-500 border-slate-200', icon: null };
  return { label: cfg.label, cls: toBadgeCls(cfg.color, cfg.bgColor), icon: ESTADO_ICONS[key] ?? null };
}

export function getPagoStatus(estado: string) {
  const cfg = ESTADOS_PAGO[estado?.toLowerCase()];
  if (!cfg) return { label: estado ?? '—', cls: 'bg-slate-50 text-slate-500 border-slate-200' };
  return { label: cfg.label, cls: toBadgeCls(cfg.color, cfg.bgColor) };
}

export function getPrioridad(p: string) {
  const cfg = PRIORIDADES_PEDIDO[p?.toLowerCase()];
  if (!cfg) return { label: p ?? '—', cls: 'bg-slate-50 text-slate-500 border-slate-200' };
  return { label: cfg.label, cls: toBadgeCls(cfg.color, cfg.bgColor) };
}

export function getTipoCliente(tipo: string) {
  const cfg = TIPOS_CLIENTE[tipo?.toLowerCase()];
  return cfg?.label ?? tipo ?? '—';
}

// ─── INTERFACES PARA RECHARTS TOOLTIPS ────────────────────────────────────────
interface RechartsTooltipPayloadItem {
  value: number | string;
  name: string;
  payload: Record<string, unknown>;
}

interface RechartsTooltipProps {
  active?: boolean;
  payload?: RechartsTooltipPayloadItem[];
  label?: string | number;
}

interface CustomAreaProps extends RechartsTooltipProps {
  accentColor?: string;
}

interface ProductoPayload {
  fullName: string;
  sales: number;
}

// ─── TOOLTIPS CORREGIDOS ──────────────────────────────────────────────────────
export const AreaTip = ({ active, payload, label, accentColor = '#e11d48' }: CustomAreaProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const valorNum = Number(payload[0].value ?? 0);

  return (
    <div
      style={{
        background: '#0f172a',
        border: `1px solid ${accentColor}40`,
        borderRadius: 12,
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      <p style={{ 
        fontSize: 10, 
        color: accentColor, 
        textTransform: 'uppercase',
        letterSpacing: '0.06em', 
        marginBottom: 3,
        fontWeight: 900 
      }}>{String(label)}</p>
      <p style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>
        S/ {valorNum.toLocaleString('es-PE')}
      </p>
    </div>
  );
};

export const BarTip = ({ active, payload }: RechartsTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const p = payload[0].payload as unknown as ProductoPayload;

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '8px 12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      <p style={{ 
        color: '#64748b', 
        fontSize: 10, 
        textTransform: 'uppercase',
        letterSpacing: '0.06em', 
        marginBottom: 4,
        fontWeight: 700 
      }}>Producto</p>
      <p style={{ 
        color: '#fff', 
        fontSize: 12, 
        fontWeight: 700,
        marginBottom: 4, 
        maxWidth: 180 
      }}>{p.fullName}</p>
      <p style={{ color: '#e11d48', fontWeight: 900, fontSize: 13 }}>{p.sales} uds.</p>
    </div>
  );
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────
export const Sk = ({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
  roleColor?: string;
}) => (
  <div
    className={`animate-pulse rounded-xl ${className}`}
    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', ...style }}
  />
);