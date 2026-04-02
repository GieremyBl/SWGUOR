/**
 * ENUMS Y TIPOS DE ESTADO
 * Basados en los tipos personalizados de tu base de datos
 */

export type EstadoCliente = 'activo' | 'inactivo' | 'suspendido' | 'potencial';

export type EstadoOrden = 'solicitado' | 'cotizado' | 'aprobado' | 'pagado' | 'en_proceso' | 'finalizado' | 'cancelado';

export type EstadoProducto = 'activo' | 'inactivo' | 'sin_stock';

export type MetodoPago = 'efectivo' | 'transferencia_bcp' | 'yape' | 'plin' | 'tarjeta';

export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'convertida';

export type UnidadMedida = 'unidades' | 'metros' | 'rollos' | 'kilogramos' | 'conos' | string;

export type EstadoDespacho = 'pendiente' | 'preparando' | 'en_ruta' | 'entregado' | 'incidencia';

export type EstadoConfeccion = 'corte' | 'confeccionando' | 'remallado' | 'terminado';

export type TipoInsumo = 'materia_prima' | 'producto_terminado' | 'empaque' | string;

export type RolUsuario = 
  | 'gerente'
  | 'administrador' 
  | 'cortador' 
  | 'disenador' 
  | 'recepcionista' 
  | 'ayudante' 
  | 'representante_taller' 
  | 'cliente';

export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

/**
 * INTERFACES DE ENTIDADES
 */

export interface Usuario {
  id: number;
  auth_id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  avatar_url?: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  created_at: string;
  ultimo_acceso?: string;
}

// Basada en tu esquema de tabla public.ordenes
export interface Orden {
  id: number;
  cotizacion_id: number | null;
  cliente_id: number | null;
  user_id: string;
  estado: EstadoOrden;
  metodo_pago: MetodoPago | null;
  total_pagado: number;
  fecha_prometida_entrega: string | null;
  estado_pago: 'pendiente' | 'parcial' | 'pagado';
  created_at: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  slug?: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
}

export interface Insumo {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario?: number;
  unidad_medida: string;
}

export interface Cotizacion {
  id: number;
  numero: string;
  cliente_id: number;
  estado: EstadoCotizacion;
  total: number;
  subtotal: number;
  igv: number;
  created_at: string;
}

export interface CotizacionItem {
  id: number;
  cotizacion_id: number;
  producto_id: number;
  variante_id?: number | null;
  cantidad: number;
  precio_unitario_snapshot: number;
  subtotal: number;
}

export interface ClienteB2B {
  id: number;
  razon_social: string | null;
  ruc: number;
  email?: string;
  telefono?: number;
  direccion?: string;
  activo: EstadoCliente; 
  created_at: string;
}

/**
 * TIPOS PARA OPERACIONES (Omitiendo IDs generados y fechas)
 */
export type OrdenInsert = Omit<Orden, 'id' | 'created_at'>;
export type InsumoInsert = Omit<Insumo, 'id' | 'created_at'>;
export type InsumoUpdate = Partial<InsumoInsert>;
export type CotizacionInsert = Omit<Cotizacion, 'id' | 'created_at' | 'updated_at'>;
export type CotizacionItemInsert = Omit<CotizacionItem, 'id'>;

/**
 * TIPOS ADICIONALES PARA COMPONENTES
 */
export interface ProductoPortal {
  id: string;
  nombre: string;
  sku: string;
  precioBase: number;
  stockActual: number;
  categoria: string;
}

// Basada en tu tabla de ventas
export interface Venta {
  id: number;
  orden_id: number;
  cliente_id: number | null;
  vendedor_id?: string | null;
  tipo_comprobante: 'boleta' | 'factura' | 'nota_venta';
  numero_comprobante: string;
  subtotal: number;
  impuestos: number;
  total: number;
  fecha_emision: string;
  created_at: string;
  clientes?: {
    razon_social: string;
    ruc?: string | null;
  } | null;
}

export interface Producto {
  id: number;
  nombre: string;
  sku: string;
  precio: number;
  stock: number;
  descripcion: string | null;
  categoria_id: number | null;
  imagen: string | null;
  estado: "activo" | "agotado" | string;
  updated_at: string;
  created_at: string;
}

export type OrdenConCliente = Orden & {
  clientes: {
    razon_social: string;
    ruc?: string | null;
    tipo_cliente?: string;
  } | null;
};

export type Database = {
  public: {
    Tables: {
      insumo: {
        Row: Insumo;
        Insert: InsumoInsert;
        Update: InsumoUpdate;
      };
      clientes: {
        Row: ClienteB2B;
      };
      categorias: {
        Row: Categoria;
      };
    };
  };
};