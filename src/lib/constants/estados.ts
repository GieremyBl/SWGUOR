import {
  EstadoCliente,
  EstadoConfeccion,
  EstadoCotizacion,
  EstadoDespacho,
  EstadoDevolucion,
  EstadoDevolucionProv,
  EstadoFeedback,
  EstadoFicha,
  EstadoGuiaRemision,
  EstadoOrdenCompra,
  EstadoOrdenProduccion,
  EstadoPago,
  EstadoPagoOrdenCompra,
  EstadoPagoTaller,
  EstadoPedido,
  EstadoProducto,
  PrioridadPedido,
  Rol,
  TipoCliente,
  TipoIncidenciaCliente,
  SeveridadIncidencia,
  UnidadMedida
} from '@prisma/client';
/**
 * Constantes de Estados para el Sistema GUOR v2 - Edición ERP B2B
 * Centrado en el ciclo de vida comercial y logístico
 */

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

export const TIPO_INCIDENCIA: Record<TipoIncidenciaCliente, { label: string; color: string; bgColor: string }> = {
  defecto_confeccion: { label: 'Defecto de confección', color: 'text-red-700', bgColor: 'bg-red-100' },
  pedido_equivocado: { label: 'Pedido equivocado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  talla_incorrecta: { label: 'Talla incorrecta', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  cantidad_incorrecta: { label: 'Cantidad incorrecta', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  dano_en_transporte: { label: 'Daño en transporte', color: 'text-red-700', bgColor: 'bg-red-100' },
  empaque_defectuoso: { label: 'Empaque defectuoso', color: 'text-red-700', bgColor: 'bg-red-100' },
  otro: { label: 'Otro', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

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
export const ESTADOS_COTIZACION: Record<EstadoCotizacion, { label: string; color: string; bgColor: string }> = {
  borrador: { label: 'Borrador', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  enviada: { label: 'Enviada', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  aprobada: { label: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100' },
  rechazada: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100' },
  expirada: { label: 'Expirada', color: 'text-gray-400', bgColor: 'bg-gray-50' },
  convertida: { label: 'Convertida a Pedido', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

// ─── ESTADOS DEL CLIENTE ───────────────────────────────────────────────────────────
export const ESTADOS_CLIENTE: Record<EstadoCliente, { label: string, color: string, bgColor: string }> = {
  activo: { label: 'Activo', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactivo: { label: 'Inactivo', color: 'text-red-700', bgColor: 'bg-red-100' },
  suspendido: { label: 'Suspendido', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  potencial: { label: 'Potencial', color: 'text-blue-700', bgColor: 'bg-blue-100' },
}

export const ESTADO_PRODUCTO: Record<EstadoProducto, { label: string, color: string, bgColor: string }> = {
  activo: { label: 'Activo', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactivo: { label: 'Inactivo', color: 'text-red-700', bgColor: 'bg-red-100' },
  descontinuado: { label: 'Descontinuado', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  agotado: { label: 'Agotado', color: 'text-red-700', bgColor: 'bg-red-100' },
  en_produccion: { label: 'En Producción', color: 'text-blue-700', bgColor: 'bg-blue-100' },
}

export const ESTADO_FICHA: Record<EstadoFicha, { label: string, color: string, bgColor: string }> = {
  borrador: { label: 'Borrador', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  aprobada: { label: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100' },
  obsoleta: { label: 'Obsoleta', color: 'text-red-700', bgColor: 'bg-red-100' },
  en_revision: { label: 'En Revisión', color: 'text-blue-700', bgColor: 'bg-blue-100' },
}

export const ESTADO_DEVOLUCION_PROVEEDOR: Record<EstadoDevolucionProv, { label: string, color: string, bgColor: string }> = {
  pendiente_envio: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  en_transito: { label: 'En Tránsito', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  aceptado_proveedor: { label: 'Aceptado', color: 'text-green-700', bgColor: 'bg-green-100' },
  rechazado_proveedor: { label: 'Rechazado', color: 'text-red-700', bgColor: 'bg-red-100' },
  completado: { label: 'Completado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
}

export const ESTADO_DEVOLUCION: Record<EstadoDevolucion, { label: string, color: string, bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  en_revision: { label: 'En Revisión', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  aprobada: { label: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100' },
  rechazada: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100' },
  completada: { label: 'Completada', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  anulada: { label: 'Anulada', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export const ESTADOS_DESPACHO: Record<EstadoDespacho, { label: string, color: string, bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  en_almacen: { label: 'En Almacén', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  en_ruta: { label: 'En Ruta', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  entregado: { label: 'Entregado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  incidencia: { label: 'Incidencia', color: 'text-red-700', bgColor: 'bg-red-100' },
  preparando: { label: 'Preparando', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  devuelto: { label: 'Devuelto', color: 'text-red-700', bgColor: 'bg-red-100' },
  cancelado: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
}

// ─── ESTADOS DE PEDIDOS DEL CLIENTE ──────────────────────────────────────────────
export const ESTADOS_PEDIDO: Record<EstadoPedido, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  en_produccion: { label: 'En Producción', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  listo_para_despacho: { label: 'Listo p/ Despacho', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  entregado: { label: 'Entregado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelado: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100' },
  pagado: { label: 'Pagado', color: 'text-green-700', bgColor: 'bg-green-100' },
};

export const ESTADOS_GUIA_REMISION: Record<EstadoGuiaRemision, { label: string, color: string, bgColor: string }> = {
  borrador: { label: 'Borrador', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  emitida: { label: 'Emitida', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  en_transito: { label: 'En Tránsito', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  entregada: { label: 'Entregada', color: 'text-green-700', bgColor: 'bg-green-100' },
  anulada: { label: 'Anulada', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export const ESTADOS_FEEDBACK: Record<EstadoFeedback, { label: string, color: string, bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  revisado: { label: 'Revisado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
}

export const ESTADOS_PAGO_TALLER: Record<EstadoPagoTaller, { label: string, color: string, bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  pagado: { label: 'Pagado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  anulado: { label: 'Anulado', color: 'text-slate-700', bgColor: 'bg-slate-100' },
}

export const TIPOS_CLIENTE: Record<TipoCliente, { label: string, color: string, bgColor: string }> = {
  minorista: { label: 'Minorista', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  mayorista: { label: 'Mayorista', color: 'text-green-700', bgColor: 'bg-green-100' },
  distribuidor: { label: 'Distribuidor', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  corporativo: { label: 'Corporativo', color: 'text-purple-700', bgColor: 'bg-purple-100' },
}

export const ESTADOS_ORDEN_PRODUCCION: Record<EstadoOrdenProduccion, { label: string, color: string, bgColor: string }> = {
  borrador: { label: 'Borrador', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  confirmada: { label: 'Confirmada', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  en_produccion: { label: 'En Producción', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  pausada: { label: 'Pausada', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  completada: { label: 'Completada', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelada: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
}
// ─── PAGOS ───────────────────────────────────────────────────────────────
export const ESTADOS_PAGO: Record<EstadoPago, { label: string, color: string, bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  pago_parcial: { label: 'Pago Parcial', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  pagado: { label: 'Pagado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  anulado: { label: 'Anulado', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

// ─── PRIORIDADES DE PEDIDO (CUS-08) ──────────────────────────────────────────
export const PRIORIDADES_PEDIDO: Record<PrioridadPedido, { label: string, color: string, bgColor: string }> = {
  baja: { label: 'Baja', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  normal: { label: 'Normal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  alta: { label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  urgente: { label: 'Urgente', color: 'text-rose-600', bgColor: 'bg-rose-100' },
};

// ─── UNIDADES DE MEDIDA ──────────────────────────────────────────────────────
export const UNIDADES_MEDIDA: Record<UnidadMedida, { label: string }> = {
  metros: { label: 'metros' },
  unidades: { label: 'und' },
  conos: { label: 'conos' },
  docenas: { label: 'docenas' },
  kilogramos: { label: 'kilogramos' },
  set: { label: 'set' },
  millares: { label: 'millares' },
};

// ── ROLES DE USUARIO ─────────────────────────────────────────────────────────
export const ROLES_USUARIO: Record<Rol, { label: string; color: string; bgColor: string }> = {
  administrador: { label: 'Administrador', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  cliente: { label: 'Cliente B2B', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  representante_taller: { label: 'Representante de Taller', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  disenador: { label: 'Diseñador', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  cortador: { label: 'Cortador', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  ayudante: { label: 'Ayudante', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  recepcionista: { label: 'Recepcionista', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  gerente: { label: 'Gerente', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  almacenero: { label: 'Almacenero', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

// ─── REGLAS DE NEGOCIO B2B ───────────────────────────────────────────────────
export const REGLAS_NEGOCIO = {
  MOQ_GENERAL: 400,
  VALIDEZ_COTIZACION_DIAS: 7,
};

// ─── UTILIDADES ──────────────────────────────────────────────────────────────

export function getEstadoInfo(estado: string, tipo: 'cotizacion' | 'pedido' | 'despacho' | 'cliente' | 'pago' | 'rol' | 'confeccion'): { label: string; color: string; bgColor: string } {
  const map: Record<
    'pedido' | 'cliente' | 'despacho' | 'cotizacion' | 'pago' | 'rol' | 'confeccion',
    Record<string, { label: string; color: string; bgColor: string }>
  > = {
    pedido: ESTADOS_PEDIDO,
    cliente: TIPOS_CLIENTE,
    despacho: ESTADOS_DESPACHO,
    cotizacion: ESTADOS_COTIZACION,
    pago: ESTADOS_PAGO_ORDEN_COMPRA,
    rol: ROLES_USUARIO,
    confeccion: ESTADOS_CONFECCION,
  };

  return map[tipo]?.[estado] ?? { label: estado, color: 'text-gray-500', bgColor: 'bg-gray-100' };
}

// Listas de exportación para Selects y Filtros
export const ESTADOS_CONFECCION: Record<EstadoConfeccion, { label: string; color: string; bgColor: string }> = {
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
export const ESTADOS_ORDEN_COMPRA: Record<EstadoOrdenCompra, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmada: { label: 'Confirmada', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  parcialmente_recibida: { label: 'Parcial', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  completada: { label: 'Completada', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelada: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const ESTADOS_PAGO_ORDEN_COMPRA: Record<EstadoPagoOrdenCompra, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: 'Pago pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  parcial: { label: 'Pago parcial', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  pagado: { label: 'Pagado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
};