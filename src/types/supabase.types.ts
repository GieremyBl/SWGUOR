  export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

  /**
   * Enums de la Base de Datos
   */
  export type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'EN_PRODUCCION' | 'COMPLETADO' | 'CANCELADO' | 'ENTREGADO'
  export type EstadoConfeccion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CON_OBSERVACIONES' | 'RECHAZADA'
  export type EstadoCotizacion = 'PENDIENTE' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA'
  export type EstadoDespacho = 'PENDIENTE' | 'EMPAQUETADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'DEVUELTO'
  export type EstadoProducto = 'activo' | 'inactivo' | 'agotado'
  export type EstadoTaller = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO'
  export type PrioridadPedido = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  export type RolUsuario = 'administrador' | 'cortador' | 'diseñador' | 'recepcionista' | 'ayudante' | 'representante_taller'
  export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido'

  /**
   * Schema de la Base de Datos
   */
  export interface Database {
    public: {
      Tables: {
        // Tabla: categorias
        categorias: {
          Row: {
            id: number
            nombre: string
            descripcion: string | null
            activo: boolean
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: number
            nombre: string
            descripcion?: string | null
            activo?: boolean
            created_at?: string
            updated_at: string
          }
          Update: {
            id?: number
            nombre?: string
            descripcion?: string | null
            activo?: boolean
            created_at?: string
            updated_at?: string
          }
        }

        // Tabla: clientes
        clientes: {
          Row: {
            id: number
            ruc: number
            razon_social: string | null
            email: string | null
            telefono: number | null
            direccion: string | null
            activo: boolean | null
            created_at: string
            updated_at: string
            auth_id: string | null
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            ruc: number
            razon_social?: string | null
            email?: string | null
            telefono?: number | null
            direccion?: string | null
            activo?: boolean | null
            created_at?: string
            updated_at?: string
            auth_id?: string | null
          }
          Update: {
            ruc?: number
            razon_social?: string | null
            email?: string | null
            telefono?: number | null
            direccion?: string | null
            activo?: boolean | null
            created_at?: string
            updated_at?: string
            auth_id?: string | null
          }
        }

        // Tabla: confecciones
        confecciones: {
          Row: {
            id: number
            pedido_id: number
            taller_id: number
            estado: EstadoConfeccion
            fecha_inicio: string
            fecha_fin: string | null
            observaciones: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: number
            pedido_id: number
            taller_id: number
            estado?: EstadoConfeccion
            fecha_inicio: string
            fecha_fin?: string | null
            observaciones?: string | null
            created_at?: string
            updated_at: string
          }
          Update: {
            id?: number
            pedido_id?: number
            taller_id?: number
            estado?: EstadoConfeccion
            fecha_inicio?: string
            fecha_fin?: string | null
            observaciones?: string | null
            created_at?: string
            updated_at?: string
          }
        }

        // Tabla: cotizaciones
        cotizaciones: {
          Row: {
            id: number
            total: number
            creado_por: string | null
            created_at: string
            fecha_cotizac: string
            updated_at: string
            usuario_id: number
            estado: EstadoCotizacion
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            total: number
            creado_por?: string | null
            created_at?: string
            fecha_cotizac?: string
            updated_at: string
            usuario_id: number
            estado?: EstadoCotizacion
          }
          Update: {
            total?: number
            creado_por?: string | null
            created_at?: string
            fecha_cotizac?: string
            updated_at?: string
            usuario_id?: number
            estado?: EstadoCotizacion
          }
        }

        // Tabla: despachos
        despachos: {
          Row: {
            id: number
            pedido_id: number
            fecha_despacho: string
            created_at: string
            direccion_entrega: string
            fecha_entrega: string | null
            updated_at: string
            usuario_id: number
            estado: EstadoDespacho
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            pedido_id: number
            fecha_despacho: string
            created_at?: string
            direccion_entrega: string
            fecha_entrega?: string | null
            updated_at: string
            usuario_id: number
            estado?: EstadoDespacho
          }
          Update: {
            pedido_id?: number
            fecha_despacho?: string
            created_at?: string
            direccion_entrega?: string
            fecha_entrega?: string | null
            updated_at?: string
            usuario_id?: number
            estado?: EstadoDespacho
          }
        }

        // Tabla: detalles_pedido
        detalles_pedido: {
          Row: {
            id: number
            pedido_id: number
            producto_id: number
            cantidad: number
            talla: string
            color: string | null
            precio_unitario: number
            subtotal: number
            notas: string | null
            created_at: string
            nombre_producto: string
            sku_producto: string
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            pedido_id: number
            producto_id: number
            cantidad: number
            talla: string
            color?: string | null
            precio_unitario: number
            subtotal: number
            notas?: string | null
            created_at?: string
            nombre_producto: string
            sku_producto: string
          }
          Update: {
            pedido_id?: number
            producto_id?: number
            cantidad?: number
            talla?: string
            color?: string | null
            precio_unitario?: number
            subtotal?: number
            notas?: string | null
            created_at?: string
            nombre_producto?: string
            sku_producto?: string
          }
        }

       // Tabla: inventario
        inventario: {
          Row: {
            id: number
            nombre: string
            tipo: string
            unidad_medida: string
            stock_actual: number
            stock_minimo: number
            categoria_id: number | null
            producto_id: number | null
            cantidad_usada: number | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: never 
            nombre: string
            tipo: string
            unidad_medida: string
            stock_actual: number
            stock_minimo: number
            categoria_id?: number | null
            producto_id?: number | null
            cantidad_usada?: number | null
            created_at?: string
            updated_at: string
          }
          Update: {
            nombre?: string
            tipo?: string
            unidad_medida?: string
            stock_actual?: number
            stock_minimo?: number
            categoria_id?: number | null
            producto_id?: number | null
            cantidad_usada?: number | null
            created_at?: string
            updated_at?: string
          }
        }

        // Tabla: items_cotizacion
        items_cotizacion: {
          Row: {
            id: number
            cotizacion_id: number
            cantidad: number
            precio_unitario: number
            subtotal: number
            created_at: string
            updated_at: string
            variante_id: number
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            cotizacion_id: number
            cantidad: number
            precio_unitario: number
            subtotal: number
            created_at?: string
            updated_at: string
            variante_id: number
          }
          Update: {
            cotizacion_id?: number
            cantidad?: number
            precio_unitario?: number
            subtotal?: number
            created_at?: string
            updated_at?: string
            variante_id?: number
          }
        }

        // Tabla: lista_materiales
        lista_materiales: {
          Row: {
            id: number
            producto_id: number | null
            insumo_id: number | null
            created_at: string
            cantidad_requerida: number | null
            updated_at: string | null
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            producto_id?: number | null
            insumo_id?: number | null
            created_at?: string
            cantidad_requerida?: number | null
            updated_at?: string | null
          }
          Update: {
            producto_id?: number | null
            insumo_id?: number | null
            created_at?: string
            cantidad_requerida?: number | null
            updated_at?: string | null
          }
        }

        // Tabla: pedidos
        pedidos: {
          Row: {
            id: number
            cliente_id: number | null
            fecha_pedido: string | null
            fecha_entrega_estimada: string | null
            estado: EstadoPedido | null
            prioridad: PrioridadPedido | null
            subtotal: number | null
            descuento: number | null
            impuesto: number | null
            total: number
            notas: string | null
            direccion_envio: string | null
            created_by: string | null
            created_at: string
            updated_at: string | null
            updated_by: string | null
            datos_cliente: Json | null
            orden_id: string | null
            cliente_email: string | null
            metodo_pago: string | null
            transaccion_token: string | null
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            cliente_id?: number | null
            fecha_pedido?: string | null
            fecha_entrega_estimada?: string | null
            estado?: EstadoPedido | null
            prioridad?: PrioridadPedido | null
            subtotal?: number | null
            descuento?: number | null
            impuesto?: number | null
            total: number
            notas?: string | null
            direccion_envio?: string | null
            created_by?: string | null
            created_at?: string
            updated_at?: string | null
            updated_by?: string | null
            datos_cliente?: Json | null
            orden_id?: string | null
            cliente_email?: string | null
            metodo_pago?: string | null
            transaccion_token?: string | null
          }
          Update: {
            cliente_id?: number | null
            fecha_pedido?: string | null
            fecha_entrega_estimada?: string | null
            estado?: EstadoPedido | null
            prioridad?: PrioridadPedido | null
            subtotal?: number | null
            descuento?: number | null
            impuesto?: number | null
            total?: number
            notas?: string | null
            direccion_envio?: string | null
            created_by?: string | null
            created_at?: string
            updated_at?: string | null
            updated_by?: string | null
            datos_cliente?: Json | null
            orden_id?: string | null
            cliente_email?: string | null
            metodo_pago?: string | null
            transaccion_token?: string | null
          }
        }

        // Tabla: productos
        productos: {
          Row: {
            ficha_url: null
            id: number
            nombre: string
            descripcion: string | null
            created_at: string
            categoria_id: number
            imagen: string | null
            precio: number
            stock: number
            stock_minimo: number
            updated_at: string
            estado: EstadoProducto
            sku: string
          }
          Insert: {
            id?: never // GENERATED ALWAYS AS IDENTITY
            nombre: string
            descripcion?: string | null
            created_at?: string
            categoria_id: number
            imagen?: string | null
            precio: number
            stock?: number
            stock_minimo?: number
            updated_at: string
            estado?: EstadoProducto
            sku: string
          }
          Update: {
            nombre?: string
            descripcion?: string | null
            created_at?: string
            categoria_id?: number
            imagen?: string | null
            precio?: number
            stock?: number
            stock_minimo?: number
            updated_at?: string
            estado?: EstadoProducto
            sku?: string
          }
        }

        // Tabla: talleres
        talleres: {
          Row: {
            id: number
            nombre: string
            direccion: string
            telefono: string
            email: string | null
            created_at: string
            updated_at: string
            ruc: string
            contacto: string
            especialidad: string | null
            estado: EstadoTaller
          }
          Insert: {
            id?: number
            nombre: string
            direccion: string
            telefono: string
            email?: string | null
            created_at?: string
            updated_at: string
            ruc: string
            contacto: string
            especialidad?: string | null
            estado?: EstadoTaller
          }
          Update: {
            id?: number
            nombre?: string
            direccion?: string
            telefono?: string
            email?: string | null
            created_at?: string
            updated_at?: string
            ruc?: string
            contacto?: string
            especialidad?: string | null
            estado?: EstadoTaller
          }
        }

        // Tabla: usuarios
        usuarios: {
          Row: {
            id: number
            email: string
            nombre_completo: string
            telefono: string | null
            estado: EstadoUsuario
            rol: RolUsuario
            created_at: string
            updated_at: string
            auth_id: string | null
            ultimo_acceso: string | null
            created_by: string | null
          }
          Insert: {
            id?: number
            email: string
            nombre_completo: string
            telefono?: string | null
            estado?: EstadoUsuario
            rol?: RolUsuario
            created_at?: string
            updated_at: string
            auth_id?: string | null
            ultimo_acceso?: string | null
            created_by?: string | null
          }
          Update: {
            id?: number
            email?: string
            nombre_completo?: string
            telefono?: string | null
            estado?: EstadoUsuario
            rol?: RolUsuario
            created_at?: string
            updated_at?: string
            auth_id?: string | null
            ultimo_acceso?: string | null
            created_by?: string | null
          }
        }

        // Tabla: variantes_producto
        variantes_producto: {
          Row: {
            id: number
            producto_id: number | null
            nombre: string
            talla: string | null
            color: string | null
            precio_adicional: number | null
            stock_adicional: number | null
            sku: string | null
            imagen_url: string | null
            activo: boolean | null
            created_at: string | null
            updated_at: string | null
          }
          Insert: {
            id?: number
            producto_id?: number | null
            nombre: string
            talla?: string | null
            color?: string | null
            precio_adicional?: number | null
            stock_adicional?: number | null
            sku?: string | null
            imagen_url?: string | null
            activo?: boolean | null
            created_at?: string | null
            updated_at?: string | null
          }
          Update: {
            id?: number
            producto_id?: number | null
            nombre?: string
            talla?: string | null
            color?: string | null
            precio_adicional?: number | null
            stock_adicional?: number | null
            sku?: string | null
            imagen_url?: string | null
            activo?: boolean | null
            created_at?: string | null
            updated_at?: string | null
          }
        }
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        [_ in never]: never
      }
      Enums: {
        EstadoPedido: EstadoPedido
        EstadoConfeccion: EstadoConfeccion
        EstadoCotizacion: EstadoCotizacion
        EstadoDespacho: EstadoDespacho
        EstadoProducto: EstadoProducto
        EstadoTaller: EstadoTaller
        PrioridadPedido: PrioridadPedido
        RolUsuario: RolUsuario
        EstadoUsuario: EstadoUsuario
      }
    }
  }

  /**
   * Tipos de conveniencia para usar en la aplicación
   */
  export type Categoria = Database['public']['Tables']['categorias']['Row']
  export type Cliente = Database['public']['Tables']['clientes']['Row']
  export type Confeccion = Database['public']['Tables']['confecciones']['Row']
  export type Cotizacion = Database['public']['Tables']['cotizaciones']['Row']
  export type Despacho = Database['public']['Tables']['despachos']['Row']
  export type DetallePedido = Database['public']['Tables']['detalles_pedido']['Row']
  export type Inventario = Database['public']['Tables']['inventario']['Row']
  export type ItemCotizacion = Database['public']['Tables']['items_cotizacion']['Row']
  export type ListaMaterial = Database['public']['Tables']['lista_materiales']['Row']
  export type Pedido = Database['public']['Tables']['pedidos']['Row']
  export type Producto = Database['public']['Tables']['productos']['Row']
  export type Taller = Database['public']['Tables']['talleres']['Row']
  export type Usuario = Database['public']['Tables']['usuarios']['Row']
  export type VarianteProducto = Database['public']['Tables']['variantes_producto']['Row']

  /**
   * Tipos para inserts
   */
  export type CategoriaInsert = Database['public']['Tables']['categorias']['Insert']
  export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
  export type ConfeccionInsert = Database['public']['Tables']['confecciones']['Insert']
  export type CotizacionInsert = Database['public']['Tables']['cotizaciones']['Insert']
  export type DespachoInsert = Database['public']['Tables']['despachos']['Insert']
  export type DetallePedidoInsert = Database['public']['Tables']['detalles_pedido']['Insert']
  export type InventarioInsert = Database['public']['Tables']['inventario']['Insert']
  export type ItemCotizacionInsert = Database['public']['Tables']['items_cotizacion']['Insert']
  export type ListaMaterialInsert = Database['public']['Tables']['lista_materiales']['Insert']
  export type PedidoInsert = Database['public']['Tables']['pedidos']['Insert']
  export type ProductoInsert = Database['public']['Tables']['productos']['Insert']
  export type TallerInsert = Database['public']['Tables']['talleres']['Insert']
  export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
  export type VarianteProductoInsert = Database['public']['Tables']['variantes_producto']['Insert']

  /**
   * Tipos para updates
   */
  export type CategoriaUpdate = Database['public']['Tables']['categorias']['Update']
  export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']
  export type ConfeccionUpdate = Database['public']['Tables']['confecciones']['Update']
  export type CotizacionUpdate = Database['public']['Tables']['cotizaciones']['Update']
  export type DespachoUpdate = Database['public']['Tables']['despachos']['Update']
  export type DetallePedidoUpdate = Database['public']['Tables']['detalles_pedido']['Update']
  export type InventarioUpdate = Database['public']['Tables']['inventario']['Update']
  export type ItemCotizacionUpdate = Database['public']['Tables']['items_cotizacion']['Update']
  export type ListaMaterialUpdate = Database['public']['Tables']['lista_materiales']['Update']
  export type PedidoUpdate = Database['public']['Tables']['pedidos']['Update']
  export type ProductoUpdate = Database['public']['Tables']['productos']['Update']
  export type TallerUpdate = Database['public']['Tables']['talleres']['Update']
  export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']
  export type VarianteProductoUpdate = Database['public']['Tables']['variantes_producto']['Update']

  /**
 * Tipo extendido para mostrar el nombre de la categoría en la tabla de Inventario
 */
export type InventarioConRelaciones = Inventario & {
  categorias: {
    nombre: string
  } | null
  productos: {
    nombre: string
  } | null
}