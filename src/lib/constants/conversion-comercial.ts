/** Roles con acceso al reporte comercial */
export const REPORTE_CONVERSION_ROLES = ['administrador', 'gerente', 'recepcionista'] as const;

/** Meses mostrados en la tasa de cierre */
export const CONVERSION_MESES_TENDENCIA = 12;

/** Top clientes por facturación */
export const CONVERSION_TOP_CLIENTES_LIMIT = 10;

/** Etiquetas del embudo comercial */
export const EMBUDO_CONVERSION_ETAPAS = [
  { key: 'creadas', label: 'Cotizaciones creadas' },
  { key: 'aprobadas', label: 'Aprobadas (aprobado_at)' },
  { key: 'convertidas', label: 'Convertidas en pedido' },
] as const;

/** Categorías inferidas de pérdida para cotizaciones expiradas */
export const MOTIVOS_PERDIDA_COTIZACION = {
  sin_cliente: 'Sin cliente registrado',
  sin_aprobacion: 'Sin aprobación del cliente',
  aprobada_sin_conversion: 'Aprobada pero no convertida',
  vencimiento_validez: 'Vencimiento de validez comercial',
} as const;

export type MotivoPerdidaCotizacion = keyof typeof MOTIVOS_PERDIDA_COTIZACION;
