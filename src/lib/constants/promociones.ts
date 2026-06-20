/** CUS_41 — Promociones, ofertas y reglas de descuento */

export const TIPO_BENEFICIO_OPCIONES = [
  { value: 'porcentaje_subtotal', label: '% sobre subtotal' },
] as const;

export const TIPO_CONTEO_OPCIONES = [
  { value: 'modelos_distintos', label: 'Modelos distintos' },
] as const;

export type TipoBeneficioValor = (typeof TIPO_BENEFICIO_OPCIONES)[number]['value'];
export type TipoConteoValor = (typeof TIPO_CONTEO_OPCIONES)[number]['value'];

export const FUENTE_DESCUENTO = {
  PROMOCION: 'promocion',
  OFERTA: 'oferta',
  REGLA: 'regla',
  MANUAL: 'manual',
} as const;

export const APLICABLE_DESCUENTO = {
  COTIZACION: 'cotizacion',
  PEDIDO: 'pedido',
} as const;

export const ESTADO_DESCUENTO_APLICACION = {
  APLICADO: 'aplicado',
  REVERTIDO: 'revertido',
} as const;

export const ALCANCE_CAMPANA_OPCIONES = [
  { value: 'catalogo', label: 'Todo el catálogo' },
  { value: 'categoria', label: 'Por categoría' },
  { value: 'producto', label: 'Por producto específico' },
] as const;

export const ENTIDAD_DESCUENTO = {
  CATALOGO: 'catalogo',
  GLOBAL: 'global',
  CATEGORIA: 'categoria',
  PRODUCTO: 'producto',
} as const;

export type AlcanceCampanaValue =
  (typeof ALCANCE_CAMPANA_OPCIONES)[number]['value'];
