import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ESTADOS_PEDIDO, ESTADOS_PAGO, PRIORIDADES_PEDIDO, TIPOS_CLIENTE } from '@/lib/constants/estados';

type EstadoPedido =
  | 'solicitado' | 'cotizado' | 'aprobado' | 'pagado'
  | 'en_proceso' | 'finalizado' | 'cancelado';

export interface PaletaColors {
  accent: string;
  accent2?: string;
  bg: string;
  bgSoft: string;
  border: string;
  text: string;
  mid: string;
  muted: string;
  primary: string;
  secondary: string;
  dark: string;
  cream: string;
  peach: string;
  beige: string;
  white: string;
  surface?: string;
  green: string;
}

// ─── PALETA CORPORATIVA ROSE MEJORADA ────────────────────────────────────────
export const COMPANY_PALETTE: PaletaColors = {
  // Acentos principales
  accent:    '#e11d48',   // rose-600 — primario
  accent2:   '#f43f5e',   // rose-500 — hover
  primary:   '#e11d48',
  secondary: '#be123c',   // rose-700

  // Fondos y superficies
  bg:        '#fafaf9',   // stone-50 — fondo principal limpio
  bgSoft:    '#fff1f2',   // rose-50  — fondo suave
  surface:   '#ffffff',   // blanco puro para cards
  white:     '#ffffff',

  // Bordes y divisores
  border:    '#f1f5f9',   // slate-100 — borde sutil
  beige:     '#fff1f2',   // rose-50   — iconos bg
  cream:     '#ffe4e6',   // rose-100  — alertas
  peach:     '#fecdd3',   // rose-200  — bordes destacados

  // Tipografía
  text:      '#0f172a',   // slate-900 — texto principal
  dark:      '#0f172a',
  muted:     '#64748b',   // slate-500 — texto secundario
  mid:       '#78716c',   // stone-600 — más cálido

  // Verde para éxito
  green:     '#10b981',   // emerald-500
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