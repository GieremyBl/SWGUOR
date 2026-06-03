// ─── Tipos compartidos del módulo de pedidos ─────────────────────────────────
// Importar desde aquí en todos los componentes del módulo.

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
    fecha_entrega_est?: string | null;
    notas_cliente?: string | null;
    clientes?: unknown;
    seguimiento_pedido?: unknown;
}

export interface PedidoFilaDB {
    id: string;
    total: number;
    estado: string;
    created_at: string;
    total_unidades: number;
    moneda: string;
    monto_pagado: number;
    saldo_pendiente: number;
}

export interface CotizacionHistorial {
    id: string;
    numero: string;
    created_at: string;
    costo_envio: number;
    total: number;
    estado: string;
}