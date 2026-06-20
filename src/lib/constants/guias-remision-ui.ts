import type { EstadoGuiaRemision, TipoGuiaRemision } from '@/lib/schemas/guias-remision';

export const TIPO_GUIA_LABELS: Record<TipoGuiaRemision, string> = {
  envio_taller: 'Envío a taller',
  retorno_taller: 'Retorno de taller',
  despacho_cliente: 'Despacho a cliente',
  devolucion_cliente: 'Devolución cliente',
  traslado_almacen: 'Traslado entre almacenes',
};

export const ESTADO_GUIA_LABELS: Record<EstadoGuiaRemision, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  en_transito: 'En tránsito',
  entregada: 'Entregada',
  anulada: 'Anulada',
};

export const ESTADO_GUIA_STYLES: Record<EstadoGuiaRemision, string> = {
  borrador: 'bg-slate-100 text-slate-700 border-slate-200',
  emitida: 'bg-blue-50 text-blue-700 border-blue-200',
  en_transito: 'bg-amber-50 text-amber-700 border-amber-200',
  entregada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  anulada: 'bg-red-50 text-red-700 border-red-200',
};

export const GUIAS_REMISION_API = '/api/admin/guias-remision';
