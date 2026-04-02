/**
 * ENUMS Y TIPOS DE ESTADO
 * Basados en los tipos personalizados de tu base de datos
 */

export type EstadoCliente = 'activo' | 'inactivo' | 'suspendido' | 'potencial';

export type EstadoCotizacion = 'borrador' | 'pendiente' | 'aceptada' | 'rechazada' | 'expirada' | 'convertida';

export type EstadoOrden = 
  | 'solicitado' 
  | 'cotizado' 
  | 'aprobado' 
  | 'pagado' 
  | 'en_proceso' 
  | 'finalizado' 
  | 'cancelado';

export type UnidadMedida = 'unidades' | 'metros' | 'rollos' | 'kilogramos' | 'conos' | string;

export type EstadoProducto = 'activo' | 'inactivo' | 'agotado' | 'descontinuado';

export type EstadoDespacho = 'pendiente' | 'preparando' | 'en_ruta' | 'entregado' | 'incidencia';

export type EstadoConfeccion = 'corte' | 'confeccionando' | 'remallado' | 'terminado';

export type MetodoPago = | 'efectivo' | 'yape' | 'plin' | 'transferencia_bcp' | 'visa' | 'mastercard';

export type TipoInsumo = 'materia_prima' | 'producto_terminado' | 'empaque' | string;

export type RolUsuario = 
  | 'gerente_general'
  | 'administrador' 
  | 'cortador' 
  | 'diseñador' 
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
  auth_id: string; // El UUID de Supabase Auth
  nombre_completo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  email?: string;
  avatar_url?: string;
}

// Basada en tu esquema de tabla public.ordenes
export interface Orden {
  id: number;
  user_id: string; // UUID (auth.users)
  cliente_id: number | null;
  cotizacion_id: number | null;
  total_pagado: number;
  estado: EstadoOrden;
  metodo_pago: MetodoPago | null;
  estado_pago: 'pendiente' | 'parcial' | 'pagado';
  fecha_prometida_entrega: string | null;
  created_at: string;
  updated_at: string | null;
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
  tipo: TipoInsumo;
  unidad_medida: UnidadMedida;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number | null;
  proveedor: string | null;       
  created_at: string;
}

export interface ClienteB2B {
 id: string;
  razon_social: string;
  ruc: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo: EstadoCliente; 
  created_at: string;
}

/**
 * TIPOS PARA OPERACIONES (Omitiendo IDs generados y fechas)
 */
export type OrdenInsert = Omit<Orden, 'id' | 'created_at' | 'updated_at'>;
export type InsumoInsert = Omit<Insumo, 'id' | 'created_at'>;
export type InsumoUpdate = Partial<InsumoInsert>;

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
  // Opcional: si sueles traer los datos del cliente unidos
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