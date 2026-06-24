import type { EstadoPedido } from '@prisma/client';
import type { LucideIcon } from 'lucide-react';
import {
  Clock, Cog, PackageCheck, Package,
  Truck, CheckCircle2, XCircle, BadgeCheck,
} from 'lucide-react';

// ── Labels ────────────────────────────────────────────────────────────────────

export const ESTADO_PEDIDO_LABELS: Record<EstadoPedido, string> = {
  pendiente:           'Pendiente',
  en_produccion:       'En Producción',
  listo_para_despacho: 'Listo para Despacho',
  preparando:          'Preparando Despacho',
  en_ruta:             'En Ruta',
  entregado:           'Entregado',
  cancelado:           'Cancelado',
  pagado:              'Pagado',
};

// ── Colores (Tailwind) ────────────────────────────────────────────────────────

export const ESTADO_PEDIDO_BADGE_COLORS: Record<EstadoPedido, string> = {
  pendiente:           'bg-amber-50   text-amber-600   border-amber-200',
  en_produccion:       'bg-blue-50    text-blue-600    border-blue-200',
  listo_para_despacho: 'bg-violet-50  text-violet-600  border-violet-200',
  preparando:          'bg-cyan-50    text-cyan-600    border-cyan-200',
  en_ruta:             'bg-sky-50     text-sky-700     border-sky-200',
  entregado:           'bg-emerald-50 text-emerald-600 border-emerald-200',
  cancelado:           'bg-rose-50    text-rose-500    border-rose-200',
  pagado:              'bg-emerald-50 text-emerald-700 border-emerald-300',
};

/** Color del conector vertical en la timeline */
export const ESTADO_PEDIDO_LINE_COLORS: Record<EstadoPedido, string> = {
  pendiente:           'bg-amber-200',
  en_produccion:       'bg-blue-200',
  listo_para_despacho: 'bg-violet-200',
  preparando:          'bg-cyan-200',
  en_ruta:             'bg-sky-200',
  entregado:           'bg-emerald-200',
  cancelado:           'bg-rose-200',
  pagado:              'bg-emerald-300',
};

// ── Iconos ────────────────────────────────────────────────────────────────────

export const ESTADO_PEDIDO_ICONS: Record<EstadoPedido, LucideIcon> = {
  pendiente:           Clock,
  en_produccion:       Cog,
  listo_para_despacho: PackageCheck,
  preparando:          Package,
  en_ruta:             Truck,
  entregado:           CheckCircle2,
  cancelado:           XCircle,
  pagado:              BadgeCheck,
};

// ── Orden canónico (útil para steppers y progreso) ────────────────────────────

export const ESTADO_PEDIDO_ORDEN: EstadoPedido[] = [
  'pendiente',
  'en_produccion',
  'listo_para_despacho',
  'preparando',
  'en_ruta',
  'entregado',
  'pagado',
];

// ── Funciones ─────────────────────────────────────────────────────────────────

/**
 * Determina el origen del cambio de estado.
 *  - null       → generado automáticamente por trigger de BD
 *  - UUID       → acción manual (cancelación por admin/gerente)
 */
export function getOrigenLabel(creado_por: string | null): string {
  return creado_por ? 'Acción manual (GUOR)' : 'Sistema automático';
}

/**
 * Limpia el prefijo interno de las notas generadas por el sistema.
 * "Sistema: pendiente → en_produccion" → "pendiente → en_produccion"
 * Las notas de cancelación se devuelven tal cual.
 */
export function formatearNotas(notas: string | null): string | null {
  if (!notas) return null;
  return notas.startsWith('Sistema: ') ? notas.slice(9) : notas;
}

/**
 * Índice del estado en el flujo lineal.
 * Devuelve -1 para 'cancelado' (estado terminal fuera del flujo).
 */
export function getIndiceEstado(estado: EstadoPedido): number {
  return ESTADO_PEDIDO_ORDEN.indexOf(estado);
}