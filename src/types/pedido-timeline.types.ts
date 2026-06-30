// lib/types/pedido-timeline.types.ts

export type EtapaTimeline = 'pedido' | 'produccion' | 'confeccion' | 'despacho' | 'entrega';

export type EstadoEtapa = 'pendiente' | 'en_progreso' | 'completado' | 'cancelado' | 'rechazado';

export interface EventoTimeline {
    id: string;
    etapa: EtapaTimeline;
    estado: EstadoEtapa;
    titulo: string;
    descripcion?: string;
    timestamp: Date;
    usuario?: string; // Nombre del usuario que realizó la acción
    observacion?: string;
    detalles?: {
        totalOrdenes?: number;
        ordenesCompletadas?: number;
        totalConfecciones?: number;
        confeccionesCompletadas?: number;
        numeroGuia?: string;
        fechaEntrega?: Date;
    };
}

export interface TimelinePedido {
    pedidoId: string | number;
    numeroReferencia: string;
    cliente: string;
    total: number;
    eventos: EventoTimeline[];
    estadoGlobal: EstadoEtapa;
    porcentajeProgreso: number;
    estimadoEntrega?: Date;
}

export interface ResumenEtapa {
    etapa: EtapaTimeline;
    estado: EstadoEtapa;
    cantidad: number;
    completadas: number;
    porcentaje: number;
    ultimoEvento?: EventoTimeline;
}