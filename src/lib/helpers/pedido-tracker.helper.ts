import type {
  EstadoDespacho,
  EstadoPedido,
  EtapaConfeccion,
  EtapaProduccion,
} from '@prisma/client';
import { PASOS_TRACKER_PEDIDO } from '@/lib/constants/pedido-tracker';

export type PasoTrackerEstado = 'completado' | 'actual' | 'pendiente';

export interface PasoTrackerCalculado {
  key: string;
  label: string;
  estadoVisual: PasoTrackerEstado;
}

export interface PasoFlujoInterno {
  key: string;
  label: string;
  rol: string;
  estadoVisual: PasoTrackerEstado;
}

const ETAPAS_PRODUCCION_ORDENADAS: EtapaProduccion[] = [
  'diseno',
  'patronaje',
  'corte',
  'confeccion',
  'remallado',
  'bordado_estampado',
  'control_calidad',
  'acabado',
  'listo_entrega',
];

const ETAPAS_CONFECCION_ORDENADAS: EtapaConfeccion[] = [
  'recepcion_cortes',
  'confeccion_y_remalle',
  'acabado_y_limpieza',
  'planchado_y_empaque',
  'entregado_a_guor',
];

const PASOS_FLUJO_INTERNO_BASE: Array<Omit<PasoFlujoInterno, 'estadoVisual'>> = [
  { key: 'diseno_patronaje', label: 'Diseño y patronaje', rol: 'Diseñador' },
  { key: 'corte_registrado', label: 'Corte registrado', rol: 'Cortador' },
  { key: 'taller_asignado', label: 'Taller externo asignado', rol: 'Representante de Taller' },
  { key: 'recepcion_materiales', label: 'Recepción de materiales esenciales', rol: 'Representante de Taller' },
  { key: 'confeccion_remalle', label: 'Confección y remalle', rol: 'Representante de Taller' },
  { key: 'acabado_limpieza', label: 'Acabado y limpieza', rol: 'Representante de Taller' },
  { key: 'planchado_empaque', label: 'Planchado y empaque', rol: 'Representante de Taller' },
  { key: 'listo_guor', label: 'Listo para entregar a GUOR', rol: 'Representante de Taller' },
  { key: 'verificacion_almacen', label: 'Verificación en almacén', rol: 'Almacenero' },
  { key: 'seguimiento_despacho', label: 'Seguimiento de despacho', rol: 'Ayudante' },
  { key: 'entrega_cliente', label: 'Entrega al cliente', rol: 'Ayudante / Administrador' },
];

function idxProduccion(etapa: EtapaProduccion | string | null | undefined): number {
  if (!etapa) return -1;
  return ETAPAS_PRODUCCION_ORDENADAS.indexOf(etapa as EtapaProduccion);
}

function idxConfeccion(etapa: EtapaConfeccion | string | null | undefined): number {
  if (!etapa) return -1;
  return ETAPAS_CONFECCION_ORDENADAS.indexOf(etapa as EtapaConfeccion);
}

/** Índice del paso activo (0–4). Si el pedido está entregado, devuelve 5 (todos completados). */
export function calcularIndicePasoActual(
  pedidoEstado: EstadoPedido | string | null,
  despachoEstado: EstadoDespacho | string | null | undefined,
): number {
  const estado = pedidoEstado ?? 'pendiente';

  if (estado === 'entregado' || despachoEstado === 'entregado') {
    return PASOS_TRACKER_PEDIDO.length;
  }

  if (despachoEstado === 'en_ruta') {
    return 3;
  }

  if (estado === 'listo_para_despacho') return 2;
  if (estado === 'en_produccion') return 1;
  if (estado === 'pendiente' || estado === 'pagado') return 0;

  if (estado === 'cancelado') return 0;

  return 0;
}

export function calcularPasosTracker(
  pedidoEstado: EstadoPedido | string | null,
  despachoEstado: EstadoDespacho | string | null | undefined,
): PasoTrackerCalculado[] {
  const indiceActual = calcularIndicePasoActual(pedidoEstado, despachoEstado);

  return PASOS_TRACKER_PEDIDO.map((paso, i) => {
    let estadoVisual: PasoTrackerEstado = 'pendiente';
    if (indiceActual >= PASOS_TRACKER_PEDIDO.length) {
      estadoVisual = 'completado';
    } else if (i < indiceActual) {
      estadoVisual = 'completado';
    } else if (i === indiceActual) {
      estadoVisual = 'actual';
    }
    return { key: paso.key, label: paso.label, estadoVisual };
  });
}

export function formatearFechaEntrega(
  fecha: Date | string | null | undefined,
): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function calcularFlujoInternoPedido(params: {
  pedidoEstado: EstadoPedido | string | null;
  despachoEstado: EstadoDespacho | string | null | undefined;
  etapaProduccionActual?: EtapaProduccion | string | null;
  etapaConfeccionActual?: EtapaConfeccion | string | null;
  tallerAsignado?: boolean;
  almacenVerificado?: boolean;
}): PasoFlujoInterno[] {
  const estadoPedido = params.pedidoEstado ?? 'pendiente';
  const estadoDespacho = params.despachoEstado ?? null;
  const prodIdx = idxProduccion(params.etapaProduccionActual);
  const confIdx = idxConfeccion(params.etapaConfeccionActual);

  const entregado = estadoPedido === 'entregado' || estadoDespacho === 'entregado';
  const seguimientoDespachoActivo =
    estadoDespacho === 'preparando' ||
    estadoDespacho === 'en_ruta' ||
    estadoDespacho === 'entregado' ||
    estadoPedido === 'en_ruta' ||
    estadoPedido === 'entregado';
  const verificacionAlmacen =
    Boolean(params.almacenVerificado) ||
    estadoPedido === 'listo_para_despacho' ||
    estadoPedido === 'en_ruta' ||
    estadoPedido === 'entregado' ||
    estadoDespacho === 'en_almacen' ||
    estadoDespacho === 'preparando' ||
    estadoDespacho === 'en_ruta' ||
    estadoDespacho === 'entregado';

  let indiceActual = 0;
  if (entregado) {
    indiceActual = 10;
  } else if (seguimientoDespachoActivo) {
    indiceActual = 9;
  } else if (verificacionAlmacen) {
    indiceActual = 8;
  } else if (confIdx >= 4) {
    indiceActual = 7;
  } else if (confIdx >= 3) {
    indiceActual = 6;
  } else if (confIdx >= 2) {
    indiceActual = 5;
  } else if (confIdx >= 1) {
    indiceActual = 4;
  } else if (confIdx >= 0) {
    indiceActual = 3;
  } else if (params.tallerAsignado) {
    indiceActual = 2;
  } else if (prodIdx >= 2) {
    indiceActual = 1;
  }

  return PASOS_FLUJO_INTERNO_BASE.map((paso, i) => {
    let estadoVisual: PasoTrackerEstado = 'pendiente';
    if (i < indiceActual) estadoVisual = 'completado';
    if (i === indiceActual) estadoVisual = 'actual';

    // Si ya hay entrega final, todo aparece como completado.
    if (entregado) estadoVisual = 'completado';

    return {
      ...paso,
      estadoVisual,
    };
  });
}
