
export type EstadoPedido =
    | 'pendiente'
    | 'en_produccion'
    | 'listo_para_despacho'
    | 'entregado'
    | 'cancelado';

export type EstadoPago = 'pendiente' | 'verificado' | 'rechazado';

export interface Pedido {
    id: number;
    total: number;
    estado: EstadoPedido;
    estado_pago: EstadoPago;
    created_at: string;
    total_unidades: number;
    moneda: string;
    monto_pagado?: number;
    saldo_pendiente?: number;
    fecha_entrega_est?: string | null;
    notas_cliente?: string | null;
    clientes?: unknown;
    seguimiento_pedido?: unknown;
}

export interface PedidoFilaDB {
    id: number;
    total: number;
    estado: string | null;
    created_at: string | null;
    total_unidades: number;
    moneda: string;
    monto_pagado: number;
    saldo_pendiente: number;
}

export interface CotizacionHistorial {
    id: number;
    numero: string;
    created_at: string | null;
    costo_envio: number | null;
    total: number | null;
    estado: string | null;
}