/**
 * Constantes de Estados para el Sistema GUOR v2 - Edición ERP B2B
 * Centrado en el ciclo de vida comercial y logístico
 */

import type { Database } from '@/types/database';

type EstadoOrden = Database['public']['Enums']['EstadoOrden'];
type EstadoDespacho = Database['public']['Enums']['EstadoDespacho'];

// ─── COTIZACIONES B2B ────────────────────────────────────────────────────────
// Estados específicos para el flujo de negociación e IA
export const ESTADOS_COTIZACION: Record<string, { label: string; color: string; bgColor: string }> = {
  borrador:   { label: 'Borrador',    color: 'text-slate-500',  bgColor: 'bg-slate-100' },
  pendiente:  { label: 'En Revisión', color: 'text-amber-700',  bgColor: 'bg-amber-100' },
  aceptada:   { label: 'Aceptada',    color: 'text-green-700',  bgColor: 'bg-green-100' },
  rechazada:  { label: 'Rechazada',   color: 'text-red-700',    bgColor: 'bg-red-100' },
  expirada:   { label: 'Expirada',    color: 'text-gray-400',   bgColor: 'bg-gray-50' },
  convertida: { label: 'En Orden',    color: 'text-blue-700',   bgColor: 'bg-blue-100' },
};

// ─── ÓRDENES DE VENTA/PRODUCCIÓN ──────────────────────────────────────────────
export const ESTADOS_ORDEN = {
  solicitado: { label: 'Solicitado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  cotizado:   { label: 'Cotizado', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  aprobado:   { label: 'Aprobado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  pagado:     { label: 'Pagado', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  en_proceso: { label: 'En Proceso', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  finalizado: { label: 'Finalizado', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  cancelado:  { label: 'Cancelado', color: 'text-rose-700', bgColor: 'bg-rose-100' },
};

// ─── PAGOS ───────────────────────────────────────────────────────────────
export const ESTADOS_PAGO: Record<string, { label: string, color: string, bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  parcial:   { label: 'Pago Parcial', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completado: { label: 'Completado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  reembolsado: { label: 'Reembolsado', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

// ─── PRIORIDADES DE PEDIDO (CUS-08) ──────────────────────────────────────────
export const PRIORIDADES_PEDIDO: Record<string, { label: string, color: string, bgColor: string }> = {
  baja:   { label: 'Baja', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  media:  { label: 'Media', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  alta:   { label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  urgente: { label: 'Urgente', color: 'text-rose-600', bgColor: 'bg-rose-100' },
};

// ─── UNIDADES DE MEDIDA ──────────────────────────────────────────────────────
export const UNIDADES_MEDIDA: Record<string, { label: string }> = {
  metros: { label: 'm' },
  unidades: { label: 'und' },
  conos: { label: 'conos' },
  yardas: { label: 'yd' },
};

// ─── SEGUIMIENTO LOGÍSTICO (CUS-12) ──────────────────────────────────────────
export const ESTADOS_DESPACHO: Record<EstadoDespacho, { label: string; color: string; bgColor: string }> = {
  pendiente:    { label: 'En Almacén',   color: 'text-gray-600',   bgColor: 'bg-gray-100' },
  preparando:   { label: 'Packing',      color: 'text-blue-600',   bgColor: 'bg-blue-50' }, 
  en_ruta:      { label: 'En Tránsito',  color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  entregado:    { label: 'Entregado',    color: 'text-green-700',  bgColor: 'bg-green-100' },
  incidencia:   { label: 'Incidencia',   color: 'text-red-700',    bgColor: 'bg-red-100' },
};

// ─── CLIENTES B2B ─────────────────────────────────────────────────────────────
export const TIPOS_CLIENTE: Record<string, { label: string; color: string; bgColor: string }> = {
  corporativo:  { label: 'Corp. Premium', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  distribuidor: { label: 'Distribuidor',  color: 'text-violet-700', bgColor: 'bg-violet-100' },
  minorista:    { label: 'Minorista B2B', color: 'text-sky-700',    bgColor: 'bg-sky-100' },
};

// ── ROLES DE USUARIO ─────────────────────────────────────────────────────────
export const ROLES_USUARIO = {
  administrador: 'Administrador',
  cliente: 'Cliente B2B',
  taller: 'Representante de Taller',
  disenador: 'Diseñador',
  cortador: 'Cortador',
  ayudante: 'Ayudante',
  recepcionista: 'Recepcionista',
};

// ─── REGLAS DE NEGOCIO B2B ───────────────────────────────────────────────────
export const REGLAS_NEGOCIO = {
  MOQ_GENERAL: 400, 
  ESCALAS_DESCUENTO: [
    { min: 400,  dcto: 0.00 },
    { min: 1000, dcto: 0.05 },
    { min: 5000, dcto: 0.12 },
    { min: 10000, dcto: 0.18 },
  ],
  VALIDEZ_COTIZACION_DIAS: 7,
};

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

export function getEstadoInfo(
  estado: string,
  tipo: 'orden' | 'cliente' | 'despacho' | 'cotizacion',
): { label: string; color: string; bgColor: string } {
  const map: Record<string, Record<string, any>> = {
    orden:      ESTADOS_ORDEN,
    cliente:    TIPOS_CLIENTE,
    despacho:   ESTADOS_DESPACHO,
    cotizacion: ESTADOS_COTIZACION,
  };

  return map[tipo]?.[estado] ?? { label: estado, color: 'text-gray-500', bgColor: 'bg-gray-100' };
}

// Listas de exportación para Selects y Filtros
export const LISTA_ESTADOS_COTIZACION = Object.keys(ESTADOS_COTIZACION);
export const LISTA_ESTADOS_ORDEN = Object.keys(ESTADOS_ORDEN) as EstadoOrden[];
export const LISTA_ESTADOS_DESPACHO = Object.keys(ESTADOS_DESPACHO) as EstadoDespacho[];
export const ESTADOS_CONFECCION: Record<string, { label: string; color: string; bgColor: string }> = {
  corte:          { label: 'En Corte',      color: 'text-orange-700', bgColor: 'bg-orange-100' },
  confeccionando: { label: 'Confeccionando', color: 'text-blue-700',   bgColor: 'bg-blue-100' },
  remallado:      { label: 'Remallado',     color: 'text-purple-700', bgColor: 'bg-purple-100' },
  terminado:      { label: 'Terminado',     color: 'text-green-700',  bgColor: 'bg-green-100' },
};