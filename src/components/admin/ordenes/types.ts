export interface ProductoRelacion {
    nombre: string;
}

export interface FichaTecnicaRelacion {
    version: string;
}

export interface TallerRelacion {
    nombre: string;
}

export interface SeguimientoProduccion {
    id: number;
    orden_id: number;
    etapa: string;
    observaciones: string | null;
    created_at: string;
}

export interface OrdenProduccion {
    id: number;
    producto_id: number;
    ficha_id: number;
    taller_id: number;
    pedido_id: number;
    cantidad_solicitada: number;
    fecha_entrega: string | null;
    notas: string | null;
    created_at?: string;
    productos?: ProductoRelacion;
    fichas_tecnicas?: FichaTecnicaRelacion;
    talleres?: TallerRelacion;
    seguimiento_produccion?: SeguimientoProduccion[];
}