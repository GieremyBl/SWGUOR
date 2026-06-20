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
    id: number | string;
    orden_id: number | string;
    etapa: string;
    iniciado_en?: string;
    completado_en?: string | null;
    duracion_minutos?: number | null;
    usuario_id?: number | string | null;
    observaciones: string | null;
    activo?: boolean;
    created_at: string;
    usuarios?: { id: number | string; email?: string | null; rol?: string | null } | null;
}

export interface OrdenProduccionItemRelacion {
    id: number | string;
    orden_produccion_id: number | string;
    pedido_item_id: number | string;
    producto_id: number | string;
    variante_id?: number | string | null;
    cantidad: number;
    productos?: { id: number | string; nombre: string; sku?: string | null };
    variantes_producto?: { id: number | string; talla?: string | null; color?: string | null } | null;
    pedido_items?: { id: number | string; cantidad: number; talla?: string | null; color?: string | null };
}

export interface OrdenProduccion {
    id: number | string;
    producto_id: number | string;
    ficha_id: number | string;
    taller_id: number | string;
    pedido_id?: number | string | null;
    cantidad_solicitada: number;
    estado?: string;
    etapa?: string;
    fecha_entrega: string | null;
    notas: string | null;
    created_at?: string;
    productos?: ProductoRelacion;
    fichas_tecnicas?: FichaTecnicaRelacion;
    talleres?: TallerRelacion;
    seguimiento_produccion?: SeguimientoProduccion[];
    ordenes_produccion_items?: OrdenProduccionItemRelacion[];
}