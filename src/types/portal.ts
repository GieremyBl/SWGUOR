// src/lib/types/portal.types.ts

export interface ProductoBase {
    id: string | number;
    nombre: string;
    categoria?: string;
    precio: number;
    imagen: string | null;
    sku: string;
    descripcion?: string | null;
    destacado?: boolean | null;
    moq?: number;
    colores_disponibles?: string[] | null;
    tallas_disponibles?: string[] | null;
    variantes?: Array<{ id: number; color: string; talla: string; stock: number }>;
    variantes_producto?: Array<{ id: number; color: string; talla: string; stock: number }>;
}