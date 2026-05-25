/** Estados de cotizaciones proveedor — archivo sin dependencias (evita ciclos en cliente) */

export const ESTADO_COTIZACION_PROVEEDOR = {
  BORRADOR: 'borrador',
  CERRADO: 'cerrado',
  CONVERTIDA: 'convertida',
  ANULADO: 'anulado',
} as const;

export type EstadoCotizacionProveedor =
  (typeof ESTADO_COTIZACION_PROVEEDOR)[keyof typeof ESTADO_COTIZACION_PROVEEDOR];

export const ESTADOS_COTIZACION_PROVEEDOR: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  borrador: { label: 'Borrador', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  cerrado: { label: 'Cerrado', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  convertida: { label: 'Convertida a OC', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  anulado: { label: 'Anulado', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const ESTADOS_COTIZACION_PARA_GENERAR_OC = [
  ESTADO_COTIZACION_PROVEEDOR.BORRADOR,
  ESTADO_COTIZACION_PROVEEDOR.CERRADO,
] as const;

export const TRANSICIONES_COTIZACION_PROVEEDOR: Record<string, string[]> = {
  borrador: ['cerrado', 'anulado'],
  cerrado: ['borrador'],
  convertida: [],
  anulado: [],
};
