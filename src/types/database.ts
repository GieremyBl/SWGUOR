export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: number
          imagen: string | null
          nombre: string
          orden: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: number
          imagen?: string | null
          nombre: string
          orden?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: number
          imagen?: string | null
          nombre?: string
          orden?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: Database["public"]["Enums"]["EstadoCliente"] | null
          created_at: string
          direccion: string | null
          email: string | null
          id: number
          razon_social: string | null
          ruc: number
          telefono: number | null
          tipo: Database["public"]["Enums"]["TipoCliente"] | null
          updated_at: string
          usuario_id: number | null
        }
        Insert: {
          activo?: Database["public"]["Enums"]["EstadoCliente"] | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: number
          razon_social?: string | null
          ruc: number
          telefono?: number | null
          tipo?: Database["public"]["Enums"]["TipoCliente"] | null
          updated_at?: string
          usuario_id?: number | null
        }
        Update: {
          activo?: Database["public"]["Enums"]["EstadoCliente"] | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: number
          razon_social?: string | null
          ruc?: number
          telefono?: number | null
          tipo?: Database["public"]["Enums"]["TipoCliente"] | null
          updated_at?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comprobantes: {
        Row: {
          correlativo: string
          emitido_en: string | null
          id: number
          orden_id: number
          pdf_url: string | null
          serie: string
          tipo: string
          xml_url: string | null
        }
        Insert: {
          correlativo: string
          emitido_en?: string | null
          id?: number
          orden_id: number
          pdf_url?: string | null
          serie: string
          tipo: string
          xml_url?: string | null
        }
        Update: {
          correlativo?: string
          emitido_en?: string | null
          id?: number
          orden_id?: number
          pdf_url?: string | null
          serie?: string
          tipo?: string
          xml_url?: string | null
        }
        Relationships: []
      }
      confecciones: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["EstadoConfeccion"]
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          observaciones: string | null
          pedido_id: number
          taller_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoConfeccion"]
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          observaciones?: string | null
          pedido_id: number
          taller_id: number
          updated_at: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoConfeccion"]
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          observaciones?: string | null
          pedido_id?: number
          taller_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confecciones_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizacion_items: {
        Row: {
          cantidad: number
          cotizacion_id: number | null
          id: number
          precio_unitario_snapshot: number
          producto_id: number | null
          subtotal: number
          variante_id: number | null
        }
        Insert: {
          cantidad: number
          cotizacion_id?: number | null
          id?: number
          precio_unitario_snapshot: number
          producto_id?: number | null
          subtotal: number
          variante_id?: number | null
        }
        Update: {
          cantidad?: number
          cotizacion_id?: number | null
          id?: number
          precio_unitario_snapshot?: number
          producto_id?: number | null
          subtotal?: number
          variante_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          cliente_id: number | null
          costo_envio: number | null
          created_at: string | null
          direccion_despacho: string | null
          estado: string | null
          id: number
          id_regla_descuento: number | null
          igv: number | null
          metodo_pago: Database["public"]["Enums"]["MetodoPago"] | null
          monto_descuento: number | null
          numero: string
          pedido_id: number | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          valida_hasta: string
        }
        Insert: {
          cliente_id?: number | null
          costo_envio?: number | null
          created_at?: string | null
          direccion_despacho?: string | null
          estado?: string | null
          id?: number
          id_regla_descuento?: number | null
          igv?: number | null
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          monto_descuento?: number | null
          numero: string
          pedido_id?: number | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          valida_hasta: string
        }
        Update: {
          cliente_id?: number | null
          costo_envio?: number | null
          created_at?: string | null
          direccion_despacho?: string | null
          estado?: string | null
          id?: number
          id_regla_descuento?: number | null
          igv?: number | null
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          monto_descuento?: number | null
          numero?: string
          pedido_id?: number | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          valida_hasta?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_id_regla_descuento_fkey"
            columns: ["id_regla_descuento"]
            isOneToOne: false
            referencedRelation: "reglas_descuento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      despachos: {
        Row: {
          created_at: string
          direccion_entrega: string
          estado: Database["public"]["Enums"]["EstadoDespacho"]
          fecha_despacho: string
          fecha_entrega: string | null
          id: number
          pedido_id: number
          updated_at: string
          usuario_id: number
        }
        Insert: {
          created_at?: string
          direccion_entrega: string
          estado?: Database["public"]["Enums"]["EstadoDespacho"]
          fecha_despacho: string
          fecha_entrega?: string | null
          id?: number
          pedido_id: number
          updated_at: string
          usuario_id: number
        }
        Update: {
          created_at?: string
          direccion_entrega?: string
          estado?: Database["public"]["Enums"]["EstadoDespacho"]
          fecha_despacho?: string
          fecha_entrega?: string | null
          id?: number
          pedido_id?: number
          updated_at?: string
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "despachos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_ficha_insumos: {
        Row: {
          consumo_unitario: number | null
          created_at: string
          id: number
          id_ficha: number | null
          id_insumo: number | null
          merma_permitida: number | null
        }
        Insert: {
          consumo_unitario?: number | null
          created_at?: string
          id?: number
          id_ficha?: number | null
          id_insumo?: number | null
          merma_permitida?: number | null
        }
        Update: {
          consumo_unitario?: number | null
          created_at?: string
          id?: number
          id_ficha?: number | null
          id_insumo?: number | null
          merma_permitida?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_ficha_insumos_id_ficha_fkey"
            columns: ["id_ficha"]
            isOneToOne: false
            referencedRelation: "fichas-tecnicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_ficha_insumos_id_insumo_fkey"
            columns: ["id_insumo"]
            isOneToOne: false
            referencedRelation: "insumo"
            referencedColumns: ["id"]
          },
        ]
      }
      direcciones_cliente: {
        Row: {
          alias: string
          ciudad: string | null
          cliente_id: number
          created_at: string | null
          departamento: string | null
          direccion: string
          es_principal: boolean | null
          id: number
        }
        Insert: {
          alias: string
          ciudad?: string | null
          cliente_id: number
          created_at?: string | null
          departamento?: string | null
          direccion: string
          es_principal?: boolean | null
          id?: number
        }
        Update: {
          alias?: string
          ciudad?: string | null
          cliente_id?: number
          created_at?: string | null
          departamento?: string | null
          direccion?: string
          es_principal?: boolean | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "direcciones_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ficha_medidas: {
        Row: {
          created_at: string
          id: number
          id_ficha: number | null
          punto_medida: string | null
          talla: string | null
          tolerancia: number | null
          valor_cm: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          id_ficha?: number | null
          punto_medida?: string | null
          talla?: string | null
          tolerancia?: number | null
          valor_cm?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          id_ficha?: number | null
          punto_medida?: string | null
          talla?: string | null
          tolerancia?: number | null
          valor_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ficha_medidas_id_ficha_fkey"
            columns: ["id_ficha"]
            isOneToOne: false
            referencedRelation: "fichas-tecnicas"
            referencedColumns: ["id"]
          },
        ]
      }
      "fichas-tecnicas": {
        Row: {
          costo_estimado: number | null
          created_at: string
          descripcion_detallada: string | null
          estado: Database["public"]["Enums"]["estado_ficha"] | null
          id: number
          id_producto: number | null
          imagen_geometral: string | null
          sam_total: number | null
          version: string | null
        }
        Insert: {
          costo_estimado?: number | null
          created_at?: string
          descripcion_detallada?: string | null
          estado?: Database["public"]["Enums"]["estado_ficha"] | null
          id?: number
          id_producto?: number | null
          imagen_geometral?: string | null
          sam_total?: number | null
          version?: string | null
        }
        Update: {
          costo_estimado?: number | null
          created_at?: string
          descripcion_detallada?: string | null
          estado?: Database["public"]["Enums"]["estado_ficha"] | null
          id?: number
          id_producto?: number | null
          imagen_geometral?: string | null
          sam_total?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas-tecnicas_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo: {
        Row: {
          created_at: string
          id: number
          nombre: string
          precio_unitario: number | null
          proveedor: string | null
          stock_actual: number
          stock_minimo: number
          tipo: Database["public"]["Enums"]["TipoInsumo"]
          unidad_medida: Database["public"]["Enums"]["UnidadMedida"]
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          precio_unitario?: number | null
          proveedor?: string | null
          stock_actual?: number
          stock_minimo?: number
          tipo: Database["public"]["Enums"]["TipoInsumo"]
          unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          precio_unitario?: number | null
          proveedor?: string | null
          stock_actual?: number
          stock_minimo?: number
          tipo?: Database["public"]["Enums"]["TipoInsumo"]
          unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
        }
        Relationships: []
      }
      movimientos_inventario: {
        Row: {
          cantidad: number | null
          created_at: string
          id: number
          insumo_id: number | null
          motivo: string | null
          producto_id: number | null
          tipo_movimiento: Database["public"]["Enums"]["TipoMovimiento"] | null
          usuario_id: number | null
        }
        Insert: {
          cantidad?: number | null
          created_at?: string
          id?: number
          insumo_id?: number | null
          motivo?: string | null
          producto_id?: number | null
          tipo_movimiento?: Database["public"]["Enums"]["TipoMovimiento"] | null
          usuario_id?: number | null
        }
        Update: {
          cantidad?: number | null
          created_at?: string
          id?: number
          insumo_id?: number | null
          motivo?: string | null
          producto_id?: number | null
          tipo_movimiento?: Database["public"]["Enums"]["TipoMovimiento"] | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          cliente_id: number | null
          cotizacion_id: number | null
          created_at: string | null
          estado: Database["public"]["Enums"]["EstadoOrden"] | null
          estado_pago: string | null
          fecha_prometida_entrega: string | null
          id: number
          metodo_pago: Database["public"]["Enums"]["MetodoPago"] | null
          total_pagado: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cliente_id?: number | null
          cotizacion_id?: number | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoOrden"] | null
          estado_pago?: string | null
          fecha_prometida_entrega?: string | null
          id?: number
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          total_pagado?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cliente_id?: number | null
          cotizacion_id?: number | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoOrden"] | null
          estado_pago?: string | null
          fecha_prometida_entrega?: string | null
          id?: number
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          total_pagado?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          cantidad: number
          especificaciones: Json | null
          id: number
          pedido_id: number | null
          producto_id: number | null
          variante_id: number | null
        }
        Insert: {
          cantidad: number
          especificaciones?: Json | null
          id?: number
          pedido_id?: number | null
          producto_id?: number | null
          variante_id?: number | null
        }
        Update: {
          cantidad?: number
          especificaciones?: Json | null
          id?: number
          pedido_id?: number | null
          producto_id?: number | null
          variante_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: number | null
          created_at: string | null
          created_by: string | null
          estado: Database["public"]["Enums"]["EstadoPedido"] | null
          id: number
          notas_cliente: string | null
          notas_pedido: string | null
          prioridad: Database["public"]["Enums"]["PrioridadPedido"] | null
          total_estimado: number | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: number | null
          created_at?: string | null
          created_by?: string | null
          estado?: Database["public"]["Enums"]["EstadoPedido"] | null
          id?: number
          notas_cliente?: string | null
          notas_pedido?: string | null
          prioridad?: Database["public"]["Enums"]["PrioridadPedido"] | null
          total_estimado?: number | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: number | null
          created_at?: string | null
          created_by?: string | null
          estado?: Database["public"]["Enums"]["EstadoPedido"] | null
          id?: number
          notas_cliente?: string | null
          notas_pedido?: string | null
          prioridad?: Database["public"]["Enums"]["PrioridadPedido"] | null
          total_estimado?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_interno: {
        Row: {
          cargo: Database["public"]["Enums"]["rol"] | null
          created_at: string | null
          dni: number | null
          estado: boolean | null
          fecha_ingreso: string | null
          id: number
          nombre_completo: string | null
          updated_at: string | null
          usuario_id: number | null
        }
        Insert: {
          cargo?: Database["public"]["Enums"]["rol"] | null
          created_at?: string | null
          dni?: number | null
          estado?: boolean | null
          fecha_ingreso?: string | null
          id?: number
          nombre_completo?: string | null
          updated_at?: string | null
          usuario_id?: number | null
        }
        Update: {
          cargo?: Database["public"]["Enums"]["rol"] | null
          created_at?: string | null
          dni?: number | null
          estado?: boolean | null
          fecha_ingreso?: string | null
          id?: number
          nombre_completo?: string | null
          updated_at?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_interno_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      precio_historico: {
        Row: {
          creado_por: string | null
          id: number
          motivo: string | null
          precio: number
          producto_id: number
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          creado_por?: string | null
          id?: number
          motivo?: string | null
          precio: number
          producto_id: number
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          creado_por?: string | null
          id?: number
          motivo?: string | null
          precio?: number
          producto_id?: number
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precio_historico_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: number | null
          created_at: string
          descripcion: string | null
          destacado: boolean | null
          estado: Database["public"]["Enums"]["EstadoProducto"]
          ficha_tecnica: Json | null
          id: number
          imagen: string | null
          nombre: string
          precio: number
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          categoria_id?: number | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean | null
          estado?: Database["public"]["Enums"]["EstadoProducto"]
          ficha_tecnica?: Json | null
          id?: number
          imagen?: string | null
          nombre: string
          precio: number
          sku: string
          stock?: number
          updated_at: string
        }
        Update: {
          categoria_id?: number | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean | null
          estado?: Database["public"]["Enums"]["EstadoProducto"]
          ficha_tecnica?: Json | null
          id?: number
          imagen?: string | null
          nombre?: string
          precio?: number
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      reglas_descuento: {
        Row: {
          aplica_a: string | null
          cantidad_max: number | null
          cantidad_min: number
          descuento_pct: number
          id: number
          nombre: string
        }
        Insert: {
          aplica_a?: string | null
          cantidad_max?: number | null
          cantidad_min: number
          descuento_pct: number
          id?: number
          nombre: string
        }
        Update: {
          aplica_a?: string | null
          cantidad_max?: number | null
          cantidad_min?: number
          descuento_pct?: number
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      reservas_stock: {
        Row: {
          cantidad: number
          cotizacion_id: number | null
          estado: string
          expira_en: string
          id: number
          orden_id: number | null
          variante_id: number
        }
        Insert: {
          cantidad: number
          cotizacion_id?: number | null
          estado?: string
          expira_en?: string
          id?: number
          orden_id?: number | null
          variante_id: number
        }
        Update: {
          cantidad?: number
          cotizacion_id?: number | null
          estado?: string
          expira_en?: string
          id?: number
          orden_id?: number | null
          variante_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservas_stock_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      talleres: {
        Row: {
          contacto: string
          created_at: string
          direccion: string
          email: string | null
          especialidad: Database["public"]["Enums"]["EspecialidadTaller"] | null
          estado: Database["public"]["Enums"]["EstadoTaller"]
          id: number
          nombre: string
          ruc: string
          telefono: string
          updated_at: string
        }
        Insert: {
          contacto: string
          created_at?: string
          direccion: string
          email?: string | null
          especialidad?:
            | Database["public"]["Enums"]["EspecialidadTaller"]
            | null
          estado?: Database["public"]["Enums"]["EstadoTaller"]
          id?: number
          nombre: string
          ruc: string
          telefono: string
          updated_at: string
        }
        Update: {
          contacto?: string
          created_at?: string
          direccion?: string
          email?: string | null
          especialidad?:
            | Database["public"]["Enums"]["EspecialidadTaller"]
            | null
          estado?: Database["public"]["Enums"]["EstadoTaller"]
          id?: number
          nombre?: string
          ruc?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          auth_id: string | null
          cliente_id: number | null
          created_at: string | null
          created_by: string | null
          email: string
          estado: Database["public"]["Enums"]["EstadoUsuario"] | null
          id: number
          nombre_completo: string
          rol: Database["public"]["Enums"]["rol"] | null
          telefono: number | null
          ultimo_acceso: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          cliente_id?: number | null
          created_at?: string | null
          created_by?: string | null
          email: string
          estado?: Database["public"]["Enums"]["EstadoUsuario"] | null
          id?: number
          nombre_completo: string
          rol?: Database["public"]["Enums"]["rol"] | null
          telefono?: number | null
          ultimo_acceso?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          cliente_id?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          estado?: Database["public"]["Enums"]["EstadoUsuario"] | null
          id?: number
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["rol"] | null
          telefono?: number | null
          ultimo_acceso?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      variantes_producto: {
        Row: {
          color: Database["public"]["Enums"]["ColorPrenda"]
          created_at: string | null
          estado: Database["public"]["Enums"]["EstadoProducto"]
          id: number
          imagen_url: string | null
          nombre: string
          precio_adicional: number
          producto_id: number
          sku: string
          stock_adicional: number
          talla: Database["public"]["Enums"]["TallaProductos"]
          updated_at: string | null
        }
        Insert: {
          color: Database["public"]["Enums"]["ColorPrenda"]
          created_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoProducto"]
          id?: number
          imagen_url?: string | null
          nombre: string
          precio_adicional?: number
          producto_id: number
          sku: string
          stock_adicional?: number
          talla: Database["public"]["Enums"]["TallaProductos"]
          updated_at?: string | null
        }
        Update: {
          color?: Database["public"]["Enums"]["ColorPrenda"]
          created_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoProducto"]
          id?: number
          imagen_url?: string | null
          nombre?: string
          precio_adicional?: number
          producto_id?: number
          sku?: string
          stock_adicional?: number
          talla?: Database["public"]["Enums"]["TallaProductos"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variantes_producto_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          created_at: string | null
          id: string
          impuestos: number
          metodo_pago: Database["public"]["Enums"]["MetodoPago"] | null
          numero_comprobante: string | null
          orden_id: number
          subtotal: number
          tipo_comprobante:
            | Database["public"]["Enums"]["TipoComprobante"]
            | null
          total: number
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          impuestos?: number
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          numero_comprobante?: string | null
          orden_id: number
          subtotal?: number
          tipo_comprobante?:
            | Database["public"]["Enums"]["TipoComprobante"]
            | null
          total?: number
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          impuestos?: number
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          numero_comprobante?: string | null
          orden_id?: number
          subtotal?: number
          tipo_comprobante?:
            | Database["public"]["Enums"]["TipoComprobante"]
            | null
          total?: number
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_ultimo_acceso: {
        Args: { usuario_id: number }
        Returns: undefined
      }
      check_user_role: {
        Args: { allowed_roles: Database["public"]["Enums"]["rol"][] }
        Returns: boolean
      }
      convertir_cotizacion_a_orden: {
        Args: { p_cot_id: number }
        Returns: number
      }
      create_user_with_creator: {
        Args: {
          auth_id_input: string
          email_input: string
          nombre_completo_input: string
          rol_input: string
          telefono_input: string
        }
        Returns: undefined
      }
      decrement_inventory: {
        Args: { p_id: number; p_qty: number }
        Returns: undefined
      }
      decrement_stock: {
        Args: { quantity: number; row_id: string }
        Returns: undefined
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_my_role: { Args: never; Returns: Database["public"]["Enums"]["rol"] }
      get_user_id: { Args: never; Returns: number }
      get_user_role: { Args: never; Returns: string }
      has_role: { Args: { required_role: string }; Returns: boolean }
      increment_stock: {
        Args: { quantity: number; row_id: string }
        Returns: undefined
      }
      insert_new_user_with_creator: {
        Args: {
          auth_id_input: string
          email_input: string
          nombre_completo_input: string
          rol_input: string
          telefono_input: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_role: {
        Args: { allowed_roles: Database["public"]["Enums"]["rol"][] }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      reduce_stock_from_order: {
        Args: { p_orden_id: number }
        Returns: undefined
      }
      registrar_entrada_fabricacion: {
        Args: {
          p_cantidad: number
          p_id: number
          p_motivo: string
          p_usuario_id: number
        }
        Returns: undefined
      }
      reservar_stock_cotizacion: {
        Args: { p_cotizacion_id: number; p_items: Json }
        Returns: Json
      }
      reset_productos_sequence: {
        Args: { new_value?: number }
        Returns: undefined
      }
      restar_stock: {
        Args: { cantidad_param: number; producto_id_param: string }
        Returns: undefined
      }
      sumar_stock: {
        Args: { cantidad_param: number; producto_id_param: string }
        Returns: undefined
      }
      verificar_stock_bajo: {
        Args: never
        Returns: {
          categoria_nombre: string
          nombre: string
          producto_id: number
          stock: number
          stock_minimo: number
        }[]
      }
    }
    Enums: {
      ColorPrenda:
        | "Blanco"
        | "Negro"
        | "Gris"
        | "Beige"
        | "Marrón pastel"
        | "Azul jean"
        | "Azul marino"
        | "Rojo"
        | "Rosa pastel"
        | "Morado claro"
        | "Verde olivo"
        | "Amarillo"
        | "Naranja"
        | "Multicolor"
        | "Único"
        | "Vino"
        | "Camel"
        | "Crema"
        | "Celeste"
        | "Amarillo limón"
      EspecialidadTaller:
        | "corte"
        | "confección"
        | "bordado"
        | "estampado"
        | "costura"
        | "acabados"
        | "otro"
      estado_ficha: "borrador" | "en_revision" | "aprobada" | "obsoleta"
      EstadoCategoria: "activo" | "inactivo"
      EstadoCliente: "activo" | "inactivo" | "suspendido" | "potencial"
      EstadoConfeccion: "corte" | "confeccionando" | "remallado" | "terminado"
      EstadoCotizacion:
        | "borrador"
        | "enviada"
        | "aprobada"
        | "rechazada"
        | "expirada"
        | "convertida"
      EstadoDespacho:
        | "pendiente"
        | "en_ruta"
        | "entregado"
        | "preparando"
        | "incidencia"
      EstadoOrden:
        | "solicitado"
        | "cotizado"
        | "aprobado"
        | "pagado"
        | "en_proceso"
        | "finalizado"
        | "cancelado"
      EstadoPago: "pendiente" | "pagado_parcial" | "pagado" | "vencido"
      EstadoPedido:
        | "pendiente"
        | "corte"
        | "costura"
        | "acabado"
        | "completado"
        | "cancelado"
      EstadoProducto: "activo" | "inactivo" | "agotado" | "descontinuado"
      EstadoTaller: "activo" | "inactivo" | "suspendido"
      EstadoUsuario: "activo" | "inactivo" | "suspendido"
      MetodoPago:
        | "efectivo"
        | "transferencia_bcp"
        | "yape"
        | "plin"
        | "visa"
        | "mastercard"
      PrioridadPedido: "baja" | "normal" | "alta" | "urgente"
      rol:
        | "administrador"
        | "cortador"
        | "disenador"
        | "recepcionista"
        | "ayudante"
        | "representante_taller"
        | "cliente"
        | "gerente"
      TallaProductos:
        | "XS"
        | "S"
        | "M"
        | "L"
        | "XL"
        | "XXL"
        | "28"
        | "30"
        | "32"
        | "34"
      TipoCategoria: "producto" | "insumo"
      TipoCliente: "corporativo" | "minorista" | "distribuidor"
      TipoComprobante: "boleta" | "factura" | "nota_venta"
      TipoInsumo: "tela" | "hilo" | "avio" | "boton" | "cierre"
      TipoMovimiento: "entrada" | "salida" | "ajuste"
      UnidadMedida:
        | "metros"
        | "unidades"
        | "conos"
        | "docenas"
        | "kilogramos"
        | "set"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ColorPrenda: [
        "Blanco",
        "Negro",
        "Gris",
        "Beige",
        "Marrón pastel",
        "Azul jean",
        "Azul marino",
        "Rojo",
        "Rosa pastel",
        "Morado claro",
        "Verde olivo",
        "Amarillo",
        "Naranja",
        "Multicolor",
        "Único",
        "Vino",
        "Camel",
        "Crema",
        "Celeste",
        "Amarillo limón",
      ],
      EspecialidadTaller: [
        "corte",
        "confección",
        "bordado",
        "estampado",
        "costura",
        "acabados",
        "otro",
      ],
      estado_ficha: ["borrador", "en_revision", "aprobada", "obsoleta"],
      EstadoCategoria: ["activo", "inactivo"],
      EstadoCliente: ["activo", "inactivo", "suspendido", "potencial"],
      EstadoConfeccion: ["corte", "confeccionando", "remallado", "terminado"],
      EstadoCotizacion: [
        "borrador",
        "enviada",
        "aprobada",
        "rechazada",
        "expirada",
        "convertida",
      ],
      EstadoDespacho: [
        "pendiente",
        "en_ruta",
        "entregado",
        "preparando",
        "incidencia",
      ],
      EstadoOrden: [
        "solicitado",
        "cotizado",
        "aprobado",
        "pagado",
        "en_proceso",
        "finalizado",
        "cancelado",
      ],
      EstadoPago: ["pendiente", "pagado_parcial", "pagado", "vencido"],
      EstadoPedido: [
        "pendiente",
        "corte",
        "costura",
        "acabado",
        "completado",
        "cancelado",
      ],
      EstadoProducto: ["activo", "inactivo", "agotado", "descontinuado"],
      EstadoTaller: ["activo", "inactivo", "suspendido"],
      EstadoUsuario: ["activo", "inactivo", "suspendido"],
      MetodoPago: [
        "efectivo",
        "transferencia_bcp",
        "yape",
        "plin",
        "visa",
        "mastercard",
      ],
      PrioridadPedido: ["baja", "normal", "alta", "urgente"],
      rol: [
        "administrador",
        "cortador",
        "disenador",
        "recepcionista",
        "ayudante",
        "representante_taller",
        "cliente",
        "gerente",
      ],
      TallaProductos: [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "28",
        "30",
        "32",
        "34",
      ],
      TipoCategoria: ["producto", "insumo"],
      TipoCliente: ["corporativo", "minorista", "distribuidor"],
      TipoComprobante: ["boleta", "factura", "nota_venta"],
      TipoInsumo: ["tela", "hilo", "avio", "boton", "cierre"],
      TipoMovimiento: ["entrada", "salida", "ajuste"],
      UnidadMedida: [
        "metros",
        "unidades",
        "conos",
        "docenas",
        "kilogramos",
        "set",
      ],
    },
  },
} as const
