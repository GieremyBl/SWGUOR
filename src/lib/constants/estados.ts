import type {
  EstadoDespacho,
  TipoIncidenciaCliente,
  SeveridadIncidencia,
} from '@/lib/services/despachos.service';
/**
 * Constantes de Estados para el Sistema GUOR v2 - Edición ERP B2B
 * Centrado en el ciclo de vida comercial y logístico
 */

// ─── Estados de despacho ──────────────────────────────────────────────────────
export const ESTADO_CONFIG: Record<
  EstadoDespacho,
  { label: string; color: string; bg: string; border: string }
> = {
  pendiente: { label: 'En Almacén', color: '#6B7280', bg: '#F9FAFB', border: '#D1D5DB' },
  preparando: { label: 'Preparando', color: '#8A7676', bg: '#F5EBEB', border: '#E7D7D7' },
  en_ruta: { label: 'En ruta', color: '#B8962D', bg: '#FDF6E3', border: '#D4AF37' },
  entregado: { label: 'Entregado', color: '#4A3737', bg: '#F5F5F5', border: '#CCCCCC' },
  incidencia: { label: 'Con incidencia', color: '#A32D2D', bg: '#FCEBEB', border: '#E24B4A' },
};

// ─── Tipos de incidencia ──────────────────────────────────────────────────────
export const TIPO_LABELS: Record<TipoIncidenciaCliente, string> = {
  defecto_confeccion: 'Defecto de confección',
  pedido_equivocado: 'Pedido equivocado',
  talla_incorrecta: 'Talla incorrecta',
  cantidad_incorrecta: 'Cantidad incorrecta',
  dano_en_transporte: 'Daño en transporte',
  empaque_defectuoso: 'Empaque defectuoso',
  otro: 'Otro',
};

// ─── Severidad de incidencia ──────────────────────────────────────────────────
export const SEVERIDAD_CONFIG: Record<
  SeveridadIncidencia,
  { label: string; color: string; bg: string; border: string; desc: string }
> = {
  baja: { label: 'Baja', color: '#3B6D11', bg: '#EAF3DE', border: '#639922', desc: 'No afecta la operación' },
  media: { label: 'Media', color: '#B8962D', bg: '#FDF6E3', border: '#D4AF37', desc: 'Afecta parcialmente' },
  alta: { label: 'Alta', color: '#993C1D', bg: '#FAECE7', border: '#D85A30', desc: 'Requiere atención pronta' },
  critica: { label: 'Crítica', color: '#A32D2D', bg: '#FCEBEB', border: '#E24B4A', desc: 'Paraliza la operación' },
};

// ─── COTIZACIONES B2B ────────────────────────────────────────────────────────
// Estados específicos para el flujo de negociación e IA
export const ESTADOS_COTIZACION: Record<string, { label: string; color: string; bgColor: string }> = {
  borrador: { label: 'Borrador', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  pendiente: { label: 'En Revisión', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  aceptada: { label: 'Aceptada', color: 'text-green-700', bgColor: 'bg-green-100' },
  rechazada: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100' },
  expirada: { label: 'Expirada', color: 'text-gray-400', bgColor: 'bg-gray-50' },
  convertida: { label: 'En Orden', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

// ─── ESTADOS DE PEDIDOS DEL CLIENTE ──────────────────────────────────────────────
export const ESTADOS_PEDIDO: Record<string, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  en_produccion: { label: 'En Producción', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  listo_para_despacho: { label: 'Listo p/ Despacho', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  entregado: { label: 'Entregado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelado: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// ─── PAGOS ───────────────────────────────────────────────────────────────
export const ESTADOS_PAGO: Record<string, { label: string, color: string, bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  parcial: { label: 'Pago Parcial', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completado: { label: 'Completado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  reembolsado: { label: 'Reembolsado', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

// ─── PRIORIDADES DE PEDIDO (CUS-08) ──────────────────────────────────────────
export const PRIORIDADES_PEDIDO: Record<string, { label: string, color: string, bgColor: string }> = {
  baja: { label: 'Baja', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  media: { label: 'Media', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  alta: { label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100' },
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
  pendiente: { label: 'En Almacén', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  preparando: { label: 'Packing', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  en_ruta: { label: 'En Tránsito', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  entregado: { label: 'Entregado', color: 'text-green-700', bgColor: 'bg-green-100' },
  incidencia: { label: 'Incidencia', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// ─── CLIENTES B2B ─────────────────────────────────────────────────────────────
export const TIPOS_CLIENTE: Record<string, { label: string; color: string; bgColor: string }> = {
  corporativo: { label: 'Corp. Premium', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  distribuidor: { label: 'Distribuidor', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  minorista: { label: 'Minorista B2B', color: 'text-sky-700', bgColor: 'bg-sky-100' },
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
  gerente: 'Gerente',
};

// ─── REGLAS DE NEGOCIO B2B ───────────────────────────────────────────────────
export const REGLAS_NEGOCIO = {
  MOQ_GENERAL: 400,
  ESCALAS_DESCUENTO: [
    { min: 400, dcto: 0.00 },
    { min: 1000, dcto: 0.05 },
    { min: 5000, dcto: 0.12 },
    { min: 10000, dcto: 0.18 },
  ],
  VALIDEZ_COTIZACION_DIAS: 7,
};

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

export function getEstadoInfo(
  estado: string,
  tipo: 'pedido' | 'cliente' | 'despacho' | 'cotizacion',
): { label: string; color: string; bgColor: string } {
  const map: Record<string, Record<string, any>> = {
    pedido: ESTADOS_PEDIDO,
    cliente: TIPOS_CLIENTE,
    despacho: ESTADOS_DESPACHO,
    cotizacion: ESTADOS_COTIZACION,
  };

  return map[tipo]?.[estado] ?? { label: estado, color: 'text-gray-500', bgColor: 'bg-gray-100' };
}

// Listas de exportación para Selects y Filtros
export const ESTADOS_CONFECCION: Record<string, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  en_proceso: { label: 'En Proceso', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completada: { label: 'Completada', color: 'text-green-700', bgColor: 'bg-green-100' },
  rechazada: { label: 'Rechazada', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  cancelada: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
};
export const LISTA_ESTADOS_CONFECCION = Object.keys(ESTADOS_CONFECCION);

// ─── COTIZACIONES PROVEEDOR (re-export sin ciclos de importación) ────────────
export {
  ESTADO_COTIZACION_PROVEEDOR,
  ESTADOS_COTIZACION_PROVEEDOR,
  ESTADOS_COTIZACION_PARA_GENERAR_OC,
  TRANSICIONES_COTIZACION_PROVEEDOR,
  type EstadoCotizacionProveedor,
} from '@/lib/constants/cotizacion-proveedor-estados';

// ─── ÓRDENES DE COMPRA (CUS-50) ───────────────────────────────────────────────
export const ESTADOS_ORDEN_COMPRA: Record<string, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmada: { label: 'Confirmada', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  parcialmente_recibida: { label: 'Parcial', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  completada: { label: 'Completada', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelada: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const ESTADOS_PAGO_ORDEN_COMPRA: Record<string, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pago pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  parcial: { label: 'Pago parcial', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  pagado: { label: 'Pagado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
};