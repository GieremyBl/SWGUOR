export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      almacen_stock: {
        Row: {
          almacen_id: number
          cantidad: number
          id: number
          insumo_id: number | null
          material_id: number | null
          producto_id: number | null
          stock_minimo: number | null
          updated_at: string
          zona_id: number | null
        }
        Insert: {
          almacen_id: number
          cantidad?: number
          id?: never
          insumo_id?: number | null
          material_id?: number | null
          producto_id?: number | null
          stock_minimo?: number | null
          updated_at?: string
          zona_id?: number | null
        }
        Update: {
          almacen_id?: number
          cantidad?: number
          id?: never
          insumo_id?: number | null
          material_id?: number | null
          producto_id?: number | null
          stock_minimo?: number | null
          updated_at?: string
          zona_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "almacen_stock_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_stock_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "almacen_stock_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "almacen_zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      almacen_zonas: {
        Row: {
          activo: boolean
          almacen_id: number
          created_at: string
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          almacen_id: number
          created_at?: string
          descripcion?: string | null
          id?: never
          nombre: string
        }
        Update: {
          activo?: boolean
          almacen_id?: number
          created_at?: string
          descripcion?: string | null
          id?: never
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "almacen_zonas_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
        ]
      }
      almacenes: {
        Row: {
          capacidad_total: number | null
          created_at: string
          descripcion: string | null
          direccion: string | null
          email: string | null
          estado: boolean
          id: number
          nombre: string
          responsable_id: number | null
          telefono: string | null
          unidad_capacidad: string | null
          updated_at: string
        }
        Insert: {
          capacidad_total?: number | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          estado: boolean
          id?: never
          nombre: string
          responsable_id?: number | null
          telefono?: string | null
          unidad_capacidad?: string | null
          updated_at?: string
        }
        Update: {
          capacidad_total?: number | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          estado?: boolean
          id?: never
          nombre?: string
          responsable_id?: number | null
          telefono?: string | null
          unidad_capacidad?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "almacenes_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almacenes_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      asientos_contables: {
        Row: {
          created_at: string
          cuenta: Database["public"]["Enums"]["CuentaContable"]
          descripcion: string | null
          fecha: string
          id: number
          monto: number
          pago_id: string | null
          pedido_id: number | null
          tipo: Database["public"]["Enums"]["TipoAsiento"]
          usuario_id: number | null
        }
        Insert: {
          created_at?: string
          cuenta: Database["public"]["Enums"]["CuentaContable"]
          descripcion?: string | null
          fecha?: string
          id?: number
          monto: number
          pago_id?: string | null
          pedido_id?: number | null
          tipo: Database["public"]["Enums"]["TipoAsiento"]
          usuario_id?: number | null
        }
        Update: {
          created_at?: string
          cuenta?: Database["public"]["Enums"]["CuentaContable"]
          descripcion?: string | null
          fecha?: string
          id?: number
          monto?: number
          pago_id?: string | null
          pedido_id?: number | null
          tipo?: Database["public"]["Enums"]["TipoAsiento"]
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asientos_contables_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id_uuid"]
          },
          {
            foreignKeyName: "asientos_contables_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asientos_contables_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "fk_asientos_pedido"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: Database["public"]["Enums"]["AccionAuditoria"]
          created_at: string
          datos_antes: Json | null
          datos_despues: Json | null
          id: number
          ids: Json | null
          ip_address: unknown
          registro_id: number
          tabla: string
          user_agent: string | null
          usuario_id: number | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["AccionAuditoria"]
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: number
          ids?: Json | null
          ip_address?: unknown
          registro_id: number
          tabla: string
          user_agent?: string | null
          usuario_id?: number | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["AccionAuditoria"]
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: number
          ids?: Json | null
          ip_address?: unknown
          registro_id?: number
          tabla?: string
          user_agent?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      categoria_insumo: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_productos: {
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
          created_at: string
          direccion_fiscal: string | null
          email: string | null
          estado: Database["public"]["Enums"]["EstadoCliente"] | null
          id: number
          nombre_comercial: string | null
          razon_social: string | null
          ruc: string
          telefono: string | null
          tipo_cliente: Database["public"]["Enums"]["TipoCliente"] | null
          updated_at: string
          usuario_id: number | null
        }
        Insert: {
          created_at?: string
          direccion_fiscal?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["EstadoCliente"] | null
          id?: number
          nombre_comercial?: string | null
          razon_social?: string | null
          ruc: string
          telefono?: string | null
          tipo_cliente?: Database["public"]["Enums"]["TipoCliente"] | null
          updated_at?: string
          usuario_id?: number | null
        }
        Update: {
          created_at?: string
          direccion_fiscal?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["EstadoCliente"] | null
          id?: number
          nombre_comercial?: string | null
          razon_social?: string | null
          ruc?: string
          telefono?: string | null
          tipo_cliente?: Database["public"]["Enums"]["TipoCliente"] | null
          updated_at?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      comprobantes: {
        Row: {
          cdr_url: string | null
          correlativo: string
          created_at: string
          enviado_sunat_at: string | null
          estado_sunat: Database["public"]["Enums"]["EstadoComprobante"]
          fecha_emision: string
          hash_cpe: string | null
          id_uuid: string
          igv: number
          moneda: string
          numero_completo: string | null
          pago_id: string | null
          pdf_url: string | null
          pedido_id: number | null
          respuesta_sunat: string | null
          ruc_emisor: string
          serie: string
          subtotal: number
          tipo: Database["public"]["Enums"]["TipoComprobante"]
          total: number
          updated_at: string
          xml_url: string | null
        }
        Insert: {
          cdr_url?: string | null
          correlativo: string
          created_at?: string
          enviado_sunat_at?: string | null
          estado_sunat?: Database["public"]["Enums"]["EstadoComprobante"]
          fecha_emision?: string
          hash_cpe?: string | null
          id_uuid: string
          igv?: number
          moneda?: string
          numero_completo?: string | null
          pago_id?: string | null
          pdf_url?: string | null
          pedido_id?: number | null
          respuesta_sunat?: string | null
          ruc_emisor: string
          serie: string
          subtotal?: number
          tipo: Database["public"]["Enums"]["TipoComprobante"]
          total?: number
          updated_at?: string
          xml_url?: string | null
        }
        Update: {
          cdr_url?: string | null
          correlativo?: string
          created_at?: string
          enviado_sunat_at?: string | null
          estado_sunat?: Database["public"]["Enums"]["EstadoComprobante"]
          fecha_emision?: string
          hash_cpe?: string | null
          id_uuid?: string
          igv?: number
          moneda?: string
          numero_completo?: string | null
          pago_id?: string | null
          pdf_url?: string | null
          pedido_id?: number | null
          respuesta_sunat?: string | null
          ruc_emisor?: string
          serie?: string
          subtotal?: number
          tipo?: Database["public"]["Enums"]["TipoComprobante"]
          total?: number
          updated_at?: string
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id_uuid"]
          },
          {
            foreignKeyName: "comprobantes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      confecciones: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          created_at: string
          estado: Database["public"]["Enums"]["EstadoConfeccion"]
          fecha_entrega: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          notas: string | null
          observaciones: string | null
          orden_produccion_id: number | null
          prenda: string
          prioridad: string
          responsable_id: number | null
          taller_id: number
          updated_at: string
        }
        Insert: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoConfeccion"]
          fecha_entrega?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          notas?: string | null
          observaciones?: string | null
          orden_produccion_id?: number | null
          prenda?: string
          prioridad?: string
          responsable_id?: number | null
          taller_id: number
          updated_at?: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoConfeccion"]
          fecha_entrega?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          notas?: string | null
          observaciones?: string | null
          orden_produccion_id?: number | null
          prenda?: string
          prioridad?: string
          responsable_id?: number | null
          taller_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confecciones_orden_produccion_id_fkey"
            columns: ["orden_produccion_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confecciones_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confecciones_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "confecciones_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_sistema: {
        Row: {
          categoria: string
          clave: string
          descripcion: string | null
          id: number
          tipo_dato: string
          updated_at: string
          updated_by: string | null
          valor: string
        }
        Insert: {
          categoria?: string
          clave: string
          descripcion?: string | null
          id?: number
          tipo_dato?: string
          updated_at?: string
          updated_by?: string | null
          valor: string
        }
        Update: {
          categoria?: string
          clave?: string
          descripcion?: string | null
          id?: number
          tipo_dato?: string
          updated_at?: string
          updated_by?: string | null
          valor?: string
        }
        Relationships: []
      }
      costo_envio: {
        Row: {
          activo: boolean
          costo: number
          created_at: string
          id: number
          updated_at: string
          zona: Database["public"]["Enums"]["ZonaEnvio"]
        }
        Insert: {
          activo?: boolean
          costo: number
          created_at?: string
          id?: number
          updated_at?: string
          zona: Database["public"]["Enums"]["ZonaEnvio"]
        }
        Update: {
          activo?: boolean
          costo?: number
          created_at?: string
          id?: number
          updated_at?: string
          zona?: Database["public"]["Enums"]["ZonaEnvio"]
        }
        Relationships: []
      }
      cotizacion_items: {
        Row: {
          cantidad: number
          color_snapshot: string
          cotizacion_id: number
          id: number
          modelo_snapshot: string | null
          precio_unitario_snapshot: number
          prenda_tipo_snapshot: string | null
          producto_id: number
          subtotal: number
          talla_snapshot: string
          variante_id: number
        }
        Insert: {
          cantidad: number
          color_snapshot: string
          cotizacion_id: number
          id?: number
          modelo_snapshot?: string | null
          precio_unitario_snapshot: number
          prenda_tipo_snapshot?: string | null
          producto_id: number
          subtotal: number
          talla_snapshot: string
          variante_id: number
        }
        Update: {
          cantidad?: number
          color_snapshot?: string
          cotizacion_id?: number
          id?: number
          modelo_snapshot?: string | null
          precio_unitario_snapshot?: number
          prenda_tipo_snapshot?: string | null
          producto_id?: number
          subtotal?: number
          talla_snapshot?: string
          variante_id?: number
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
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "v_cotizaciones_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_variante_id"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "v_variante_stock_resumen"
            referencedColumns: ["variante_id"]
          },
          {
            foreignKeyName: "fk_cotizacion_items_variante_id"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          aprobacion_automatica: boolean | null
          aprobado_at: string | null
          cliente_id: number | null
          costo_envio: number | null
          costo_total_estimado: number | null
          created_at: string | null
          direccion_despacho: string | null
          estado: Database["public"]["Enums"]["EstadoCotizacion"] | null
          expira_at: string | null
          id: number
          id_regla_descuento: number | null
          igv: number | null
          moneda: string
          monto_descuento: number | null
          notas_internas: string | null
          numero: string
          origen: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          valida_hasta: string
          zona_envio_id: number | null
        }
        Insert: {
          aprobacion_automatica?: boolean | null
          aprobado_at?: string | null
          cliente_id?: number | null
          costo_envio?: number | null
          costo_total_estimado?: number | null
          created_at?: string | null
          direccion_despacho?: string | null
          estado?: Database["public"]["Enums"]["EstadoCotizacion"] | null
          expira_at?: string | null
          id?: number
          id_regla_descuento?: number | null
          igv?: number | null
          moneda?: string
          monto_descuento?: number | null
          notas_internas?: string | null
          numero: string
          origen?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          valida_hasta: string
          zona_envio_id?: number | null
        }
        Update: {
          aprobacion_automatica?: boolean | null
          aprobado_at?: string | null
          cliente_id?: number | null
          costo_envio?: number | null
          costo_total_estimado?: number | null
          created_at?: string | null
          direccion_despacho?: string | null
          estado?: Database["public"]["Enums"]["EstadoCotizacion"] | null
          expira_at?: string | null
          id?: number
          id_regla_descuento?: number | null
          igv?: number | null
          moneda?: string
          monto_descuento?: number | null
          notas_internas?: string | null
          numero?: string
          origen?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          valida_hasta?: string
          zona_envio_id?: number | null
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
            foreignKeyName: "cotizaciones_zona_envio_id_fkey"
            columns: ["zona_envio_id"]
            isOneToOne: false
            referencedRelation: "costo_envio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cotizaciones_id_regla_descuento"
            columns: ["id_regla_descuento"]
            isOneToOne: false
            referencedRelation: "reglas_descuento"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones_proveedor: {
        Row: {
          created_at: string | null
          estado: string
          fecha_solicitud: string
          fecha_vencimiento: string | null
          id: number
          moneda: string | null
          notas: string | null
          numero_externo: string | null
          pdf_url: string | null
          proveedor_id: number
          solicitado_por: string | null
          total_estimado: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string
          fecha_solicitud?: string
          fecha_vencimiento?: string | null
          id?: number
          moneda?: string | null
          notas?: string | null
          numero_externo?: string | null
          pdf_url?: string | null
          proveedor_id: number
          solicitado_por?: string | null
          total_estimado?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string
          fecha_solicitud?: string
          fecha_vencimiento?: string | null
          id?: number
          moneda?: string | null
          notas?: string | null
          numero_externo?: string | null
          pdf_url?: string | null
          proveedor_id?: number
          solicitado_por?: string | null
          total_estimado?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones_proveedor_items: {
        Row: {
          cantidad: number
          cotizacion_id: number
          descripcion: string | null
          id: number
          insumo_id: number | null
          material_id: number | null
          notas: string | null
          precio_unitario: number | null
          subtotal: number | null
          tipo_item: string | null
          unidad: string | null
        }
        Insert: {
          cantidad: number
          cotizacion_id: number
          descripcion?: string | null
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          notas?: string | null
          precio_unitario?: number | null
          subtotal?: number | null
          tipo_item?: string | null
          unidad?: string | null
        }
        Update: {
          cantidad?: number
          cotizacion_id?: number
          descripcion?: string | null
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          notas?: string | null
          precio_unitario?: number | null
          subtotal?: number | null
          tipo_item?: string | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_proveedor_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones_proveedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_proveedor_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
        ]
      }
      descuento_aplicaciones: {
        Row: {
          aplicable_id: number
          aplicable_tipo: string
          base_calculo: string
          created_at: string
          descripcion: string | null
          estado: string
          fuente_id: number | null
          fuente_tipo: string
          id: number
          monto_descuento: number
          nombre: string
          porcentaje_aplicado: number | null
          regla_id: number | null
        }
        Insert: {
          aplicable_id: number
          aplicable_tipo: string
          base_calculo?: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          fuente_id?: number | null
          fuente_tipo: string
          id?: number
          monto_descuento: number
          nombre: string
          porcentaje_aplicado?: number | null
          regla_id?: number | null
        }
        Update: {
          aplicable_id?: number
          aplicable_tipo?: string
          base_calculo?: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          fuente_id?: number | null
          fuente_tipo?: string
          id?: number
          monto_descuento?: number
          nombre?: string
          porcentaje_aplicado?: number | null
          regla_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "descuento_aplicaciones_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "reglas_descuento"
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
        }
        Insert: {
          created_at?: string
          direccion_entrega: string
          estado?: Database["public"]["Enums"]["EstadoDespacho"]
          fecha_despacho: string
          fecha_entrega?: string | null
          id?: number
          pedido_id: number
          updated_at?: string
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
        }
        Relationships: [
          {
            foreignKeyName: "despachos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      despachos_grupo_pedidos: {
        Row: {
          created_at: string
          despacho_id: number
          estado_entrega: Database["public"]["Enums"]["EstadoEntrega"] | null
          grupo_despacho_id: number
          id: number
          numero_parada: number | null
          pedido_id: number
        }
        Insert: {
          created_at?: string
          despacho_id: number
          estado_entrega?: Database["public"]["Enums"]["EstadoEntrega"] | null
          grupo_despacho_id: number
          id?: number
          numero_parada?: number | null
          pedido_id: number
        }
        Update: {
          created_at?: string
          despacho_id?: number
          estado_entrega?: Database["public"]["Enums"]["EstadoEntrega"] | null
          grupo_despacho_id?: number
          id?: number
          numero_parada?: number | null
          pedido_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "despachos_grupo_pedidos_despacho_id_fkey"
            columns: ["despacho_id"]
            isOneToOne: false
            referencedRelation: "despachos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_grupo_pedidos_grupo_despacho_id_fkey"
            columns: ["grupo_despacho_id"]
            isOneToOne: false
            referencedRelation: "despachos_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despachos_grupo_pedidos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      despachos_grupos: {
        Row: {
          created_at: string
          direccion_entrega: string
          direccion_entrega_original: string | null
          estado: Database["public"]["Enums"]["EstadoDespacho"]
          fecha_despacho: string
          fecha_entrega: string | null
          id: number
          repartidor_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion_entrega: string
          direccion_entrega_original?: string | null
          estado: Database["public"]["Enums"]["EstadoDespacho"]
          fecha_despacho: string
          fecha_entrega?: string | null
          id?: number
          repartidor_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion_entrega?: string
          direccion_entrega_original?: string | null
          estado?: Database["public"]["Enums"]["EstadoDespacho"]
          fecha_despacho?: string
          fecha_entrega?: string | null
          id?: number
          repartidor_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "despachos_grupos_repartidor_id_fkey"
            columns: ["repartidor_id"]
            isOneToOne: false
            referencedRelation: "repartidores"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones_cliente: {
        Row: {
          cantidad: number
          cliente_id: number
          condicion_recibido:
          | Database["public"]["Enums"]["CondicionProducto"]
          | null
          created_at: string
          estado_solicitud: Database["public"]["Enums"]["EstadoDevolucion"]
          fecha_finalizacion: string | null
          fotos_url: Json | null
          id: number
          monto_reembolsado: number | null
          motivo: Database["public"]["Enums"]["MotivoDevolucion"]
          notas_cliente: string | null
          notas_internas: string | null
          pedido_id: number | null
          procesado_por: number | null
          producto_id: number
          updated_at: string
          variante_id: number
        }
        Insert: {
          cantidad: number
          cliente_id: number
          condicion_recibido?:
          | Database["public"]["Enums"]["CondicionProducto"]
          | null
          created_at?: string
          estado_solicitud?: Database["public"]["Enums"]["EstadoDevolucion"]
          fecha_finalizacion?: string | null
          fotos_url?: Json | null
          id?: never
          monto_reembolsado?: number | null
          motivo: Database["public"]["Enums"]["MotivoDevolucion"]
          notas_cliente?: string | null
          notas_internas?: string | null
          pedido_id?: number | null
          procesado_por?: number | null
          producto_id: number
          updated_at?: string
          variante_id: number
        }
        Update: {
          cantidad?: number
          cliente_id?: number
          condicion_recibido?:
          | Database["public"]["Enums"]["CondicionProducto"]
          | null
          created_at?: string
          estado_solicitud?: Database["public"]["Enums"]["EstadoDevolucion"]
          fecha_finalizacion?: string | null
          fotos_url?: Json | null
          id?: never
          monto_reembolsado?: number | null
          motivo?: Database["public"]["Enums"]["MotivoDevolucion"]
          notas_cliente?: string | null
          notas_internas?: string | null
          pedido_id?: number | null
          procesado_por?: number | null
          producto_id?: number
          updated_at?: string
          variante_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_cliente_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_cliente_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "devoluciones_usuario_fkey"
            columns: ["procesado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_usuario_fkey"
            columns: ["procesado_por"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "devoluciones_variante_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "v_variante_stock_resumen"
            referencedColumns: ["variante_id"]
          },
          {
            foreignKeyName: "devoluciones_variante_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      devoluciones_proveedor: {
        Row: {
          accion_requerida: string | null
          cantidad: number
          created_at: string
          estado: Database["public"]["Enums"]["EstadoDevolucionProv"]
          fecha_salida: string | null
          fotos_evidencia: Json | null
          id: number
          insumo_id: number
          monto_estimado_recuperar: number | null
          motivo: Database["public"]["Enums"]["MotivoDevolucionProv"]
          numero_guia_remision: string | null
          observaciones: string | null
          orden_id: number | null
          proveedor_id: number
          updated_at: string
          usuario_id: number | null
        }
        Insert: {
          accion_requerida?: string | null
          cantidad: number
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoDevolucionProv"]
          fecha_salida?: string | null
          fotos_evidencia?: Json | null
          id?: never
          insumo_id: number
          monto_estimado_recuperar?: number | null
          motivo: Database["public"]["Enums"]["MotivoDevolucionProv"]
          numero_guia_remision?: string | null
          observaciones?: string | null
          orden_id?: number | null
          proveedor_id: number
          updated_at?: string
          usuario_id?: number | null
        }
        Update: {
          accion_requerida?: string | null
          cantidad?: number
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoDevolucionProv"]
          fecha_salida?: string | null
          fotos_evidencia?: Json | null
          id?: never
          insumo_id?: number
          monto_estimado_recuperar?: number | null
          motivo?: Database["public"]["Enums"]["MotivoDevolucionProv"]
          numero_guia_remision?: string | null
          observaciones?: string | null
          orden_id?: number | null
          proveedor_id?: number
          updated_at?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_prov_proveedor_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_prov_usuario_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_prov_usuario_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
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
          pais: string | null
          provincia: string | null
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
          pais?: string | null
          provincia?: string | null
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
          pais?: string | null
          provincia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_direcciones_cliente_cliente_id"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_cliente: {
        Row: {
          atencion_personal: number | null
          calidad_producto: number | null
          canal: string | null
          cliente_id: number
          comentarios: string | null
          created_at: string
          enviado_en: string | null
          estado: Database["public"]["Enums"]["EstadoFeedback"] | null
          id: number
          nota_interna: string | null
          pedido_id: number
          puntuacion: number
          recomendaria: boolean | null
          respondido_en: string | null
          tiempo_entrega: number | null
          updated_at: string | null
        }
        Insert: {
          atencion_personal?: number | null
          calidad_producto?: number | null
          canal?: string | null
          cliente_id: number
          comentarios?: string | null
          created_at?: string
          enviado_en?: string | null
          estado?: Database["public"]["Enums"]["EstadoFeedback"] | null
          id?: number
          nota_interna?: string | null
          pedido_id: number
          puntuacion: number
          recomendaria?: boolean | null
          respondido_en?: string | null
          tiempo_entrega?: number | null
          updated_at?: string | null
        }
        Update: {
          atencion_personal?: number | null
          calidad_producto?: number | null
          canal?: string | null
          cliente_id?: number
          comentarios?: string | null
          created_at?: string
          enviado_en?: string | null
          estado?: Database["public"]["Enums"]["EstadoFeedback"] | null
          id?: number
          nota_interna?: string | null
          pedido_id?: number
          puntuacion?: number
          recomendaria?: boolean | null
          respondido_en?: string | null
          tiempo_entrega?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_feedback_cliente_cliente_id"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_feedback_pedido"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
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
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_tecnicas: {
        Row: {
          costo_estimado: number | null
          created_at: string
          created_by: number | null
          descripcion_detallada: string | null
          estado: Database["public"]["Enums"]["EstadoFicha"] | null
          ficha_url: string | null
          id: number
          id_producto: number | null
          imagen_geometral: string | null
          sam_total: number | null
          version: string | null
        }
        Insert: {
          costo_estimado?: number | null
          created_at?: string
          created_by?: number | null
          descripcion_detallada?: string | null
          estado?: Database["public"]["Enums"]["EstadoFicha"] | null
          ficha_url?: string | null
          id?: number
          id_producto?: number | null
          imagen_geometral?: string | null
          sam_total?: number | null
          version?: string | null
        }
        Update: {
          costo_estimado?: number | null
          created_at?: string
          created_by?: number | null
          descripcion_detallada?: string | null
          estado?: Database["public"]["Enums"]["EstadoFicha"] | null
          ficha_url?: string | null
          id?: number
          id_producto?: number | null
          imagen_geometral?: string | null
          sam_total?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_tecnicas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_tecnicas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_fichas_tecnicas_id_producto"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
        ]
      }
      fichas_tecnicas_detalle: {
        Row: {
          cantidad_consumo: number
          ficha_id: number
          id: number
          insumo_id: number | null
          material_id: number | null
          observaciones: string | null
          porcentaje_desperdicio: number | null
        }
        Insert: {
          cantidad_consumo?: number
          ficha_id: number
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          observaciones?: string | null
          porcentaje_desperdicio?: number | null
        }
        Update: {
          cantidad_consumo?: number
          ficha_id?: number
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          observaciones?: string | null
          porcentaje_desperdicio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ficha_cabecera"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_rel"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
        ]
      }
      guias_remision: {
        Row: {
          created_at: string
          destino_direccion: string
          destino_id: number | null
          destino_tipo: string
          emitido_por: number | null
          estado: Database["public"]["Enums"]["EstadoGuiaRemision"]
          fecha_emision: string
          fecha_entrega: string | null
          fecha_traslado: string
          id: number
          motivo_traslado: string | null
          numero: string
          observaciones: string | null
          orden_produccion_id: number | null
          origen_direccion: string
          origen_id: number | null
          origen_tipo: string
          pdf_url: string | null
          pedido_id: number | null
          placa_vehiculo: string | null
          ruc_transportista: string | null
          tipo: Database["public"]["Enums"]["TipoGuiaRemision"]
          transportista: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          destino_direccion: string
          destino_id?: number | null
          destino_tipo: string
          emitido_por?: number | null
          estado?: Database["public"]["Enums"]["EstadoGuiaRemision"]
          fecha_emision?: string
          fecha_entrega?: string | null
          fecha_traslado: string
          id?: number
          motivo_traslado?: string | null
          numero: string
          observaciones?: string | null
          orden_produccion_id?: number | null
          origen_direccion: string
          origen_id?: number | null
          origen_tipo: string
          pdf_url?: string | null
          pedido_id?: number | null
          placa_vehiculo?: string | null
          ruc_transportista?: string | null
          tipo: Database["public"]["Enums"]["TipoGuiaRemision"]
          transportista?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          destino_direccion?: string
          destino_id?: number | null
          destino_tipo?: string
          emitido_por?: number | null
          estado?: Database["public"]["Enums"]["EstadoGuiaRemision"]
          fecha_emision?: string
          fecha_entrega?: string | null
          fecha_traslado?: string
          id?: number
          motivo_traslado?: string | null
          numero?: string
          observaciones?: string | null
          orden_produccion_id?: number | null
          origen_direccion?: string
          origen_id?: number | null
          origen_tipo?: string
          pdf_url?: string | null
          pedido_id?: number | null
          placa_vehiculo?: string | null
          ruc_transportista?: string | null
          tipo?: Database["public"]["Enums"]["TipoGuiaRemision"]
          transportista?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guias_remision_emitido_por_fkey"
            columns: ["emitido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_remision_emitido_por_fkey"
            columns: ["emitido_por"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "guias_remision_orden_produccion_id_fkey"
            columns: ["orden_produccion_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_remision_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      guias_remision_items: {
        Row: {
          cantidad: number
          descripcion: string
          guia_id: number
          guia_id_uuid: string | null
          id: number
          insumo_id: number | null
          material_id: number | null
          material_id_uuid: string | null
          observaciones: string | null
          peso_kg: number | null
          producto_id: number | null
          unidad: string
        }
        Insert: {
          cantidad: number
          descripcion: string
          guia_id: number
          guia_id_uuid?: string | null
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          material_id_uuid?: string | null
          observaciones?: string | null
          peso_kg?: number | null
          producto_id?: number | null
          unidad?: string
        }
        Update: {
          cantidad?: number
          descripcion?: string
          guia_id?: number
          guia_id_uuid?: string | null
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          material_id_uuid?: string | null
          observaciones?: string | null
          peso_kg?: number | null
          producto_id?: number | null
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "guias_remision_items_guia_id_fkey"
            columns: ["guia_id"]
            isOneToOne: false
            referencedRelation: "guias_remision"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_remision_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "guias_remision_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
        ]
      }
      incidencias_cliente: {
        Row: {
          cliente_id: number | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          evidencia_url: string[] | null
          id: number
          pedido_id: number | null
          tipo: Database["public"]["Enums"]["TipoIncidenciaCliente"] | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: number | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          evidencia_url?: string[] | null
          id?: never
          pedido_id?: number | null
          tipo?: Database["public"]["Enums"]["TipoIncidenciaCliente"] | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: number | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          evidencia_url?: string[] | null
          id?: never
          pedido_id?: number | null
          tipo?: Database["public"]["Enums"]["TipoIncidenciaCliente"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_cliente_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias_taller: {
        Row: {
          asignado_a: number | null
          confeccion_id: number | null
          created_at: string
          descripcion: string
          fecha_reporte: string
          fecha_resolucion: string | null
          foto_url: string | null
          id: number
          impacto_horas: number | null
          pedido_id: number
          reportado_por: number | null
          resuelto: boolean
          severidad: Database["public"]["Enums"]["SeveridadIncidencia"]
          solucion: string | null
          tipo: Database["public"]["Enums"]["TipoIncidencia"]
          updated_at: string | null
        }
        Insert: {
          asignado_a?: number | null
          confeccion_id?: number | null
          created_at?: string
          descripcion: string
          fecha_reporte?: string
          fecha_resolucion?: string | null
          foto_url?: string | null
          id?: number
          impacto_horas?: number | null
          pedido_id: number
          reportado_por?: number | null
          resuelto?: boolean
          severidad?: Database["public"]["Enums"]["SeveridadIncidencia"]
          solucion?: string | null
          tipo: Database["public"]["Enums"]["TipoIncidencia"]
          updated_at?: string | null
        }
        Update: {
          asignado_a?: number | null
          confeccion_id?: number | null
          created_at?: string
          descripcion?: string
          fecha_reporte?: string
          fecha_resolucion?: string | null
          foto_url?: string | null
          id?: number
          impacto_horas?: number | null
          pedido_id?: number
          reportado_por?: number | null
          resuelto?: boolean
          severidad?: Database["public"]["Enums"]["SeveridadIncidencia"]
          solucion?: string | null
          tipo?: Database["public"]["Enums"]["TipoIncidencia"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_incidencias_taller_asignado_a"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_incidencias_taller_asignado_a"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "fk_incidencias_taller_confeccion_id"
            columns: ["confeccion_id"]
            isOneToOne: false
            referencedRelation: "confecciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_incidencias_taller_reportado_por"
            columns: ["reportado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_incidencias_taller_reportado_por"
            columns: ["reportado_por"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "incidencias_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo: {
        Row: {
          alerta_bajo_stock: boolean | null
          categoria_id: number
          created_at: string
          descripcion: string | null
          id: number
          nombre: string
          precio_unitario: number | null
          proveedor_id: number | null
          stock_actual: number
          stock_maximo: number | null
          stock_minimo: number
          tipo: Database["public"]["Enums"]["TipoInsumo"]
          ubicacion_almacen: string | null
          unidad_medida: Database["public"]["Enums"]["UnidadMedida"]
          updated_at: string | null
        }
        Insert: {
          alerta_bajo_stock?: boolean | null
          categoria_id: number
          created_at?: string
          descripcion?: string | null
          id?: number
          nombre: string
          precio_unitario?: number | null
          proveedor_id?: number | null
          stock_actual?: number
          stock_maximo?: number | null
          stock_minimo?: number
          tipo: Database["public"]["Enums"]["TipoInsumo"]
          ubicacion_almacen?: string | null
          unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
          updated_at?: string | null
        }
        Update: {
          alerta_bajo_stock?: boolean | null
          categoria_id?: number
          created_at?: string
          descripcion?: string | null
          id?: number
          nombre?: string
          precio_unitario?: number | null
          proveedor_id?: number | null
          stock_actual?: number
          stock_maximo?: number | null
          stock_minimo?: number
          tipo?: Database["public"]["Enums"]["TipoInsumo"]
          ubicacion_almacen?: string | null
          unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_categoria"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categoria_insumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumo_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      materiales: {
        Row: {
          alerta_bajo_stock: boolean | null
          ancho_total: number | null
          ancho_util: number | null
          codigo_color: string | null
          color: string | null
          composicion: string | null
          created_at: string
          descripcion: string | null
          gramaje: number | null
          id: number
          nombre: string
          precio_unitario: number | null
          proveedor_id: number | null
          stock_actual: number
          stock_minimo: number
          tipo: Database["public"]["Enums"]["TipoMaterial"]
          unidad_medida: Database["public"]["Enums"]["UnidadMedida"]
          updated_at: string | null
        }
        Insert: {
          alerta_bajo_stock?: boolean | null
          ancho_total?: number | null
          ancho_util?: number | null
          codigo_color?: string | null
          color?: string | null
          composicion?: string | null
          created_at?: string
          descripcion?: string | null
          gramaje?: number | null
          id?: number
          nombre: string
          precio_unitario?: number | null
          proveedor_id?: number | null
          stock_actual?: number
          stock_minimo?: number
          tipo?: Database["public"]["Enums"]["TipoMaterial"]
          unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
          updated_at?: string | null
        }
        Update: {
          alerta_bajo_stock?: boolean | null
          ancho_total?: number | null
          ancho_util?: number | null
          codigo_color?: string | null
          color?: string | null
          composicion?: string | null
          created_at?: string
          descripcion?: string | null
          gramaje?: number | null
          id?: number
          nombre?: string
          precio_unitario?: number | null
          proveedor_id?: number | null
          stock_actual?: number
          stock_minimo?: number
          tipo?: Database["public"]["Enums"]["TipoMaterial"]
          unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          almacen_id: number | null
          cantidad: number
          created_at: string
          id: number
          insumo_id: number | null
          material_id: number | null
          motivo: string
          producto_id: number | null
          referencia_tipo: Database["public"]["Enums"]["ReferenciaMovimiento"]
          tipo_movimiento: Database["public"]["Enums"]["TipoMovimiento"]
          updated_at: string | null
          usuario_id: number | null
        }
        Insert: {
          almacen_id?: number | null
          cantidad: number
          created_at?: string
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          motivo: string
          producto_id?: number | null
          referencia_tipo: Database["public"]["Enums"]["ReferenciaMovimiento"]
          tipo_movimiento: Database["public"]["Enums"]["TipoMovimiento"]
          updated_at?: string | null
          usuario_id?: number | null
        }
        Update: {
          almacen_id?: number | null
          cantidad?: number
          created_at?: string
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          motivo?: string
          producto_id?: number | null
          referencia_tipo?: Database["public"]["Enums"]["ReferenciaMovimiento"]
          tipo_movimiento?: Database["public"]["Enums"]["TipoMovimiento"]
          updated_at?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_movimientos_inventario_material_id"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_movimientos_inventario_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "movimientos_inventario_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          id: number
          leido: boolean
          leido_at: string | null
          mensaje: string
          referencia_id: number | null
          referencia_tipo:
          | Database["public"]["Enums"]["ReferenciaNotificacion"]
          | null
          tipo: Database["public"]["Enums"]["TipoNotificacion"]
          titulo: string
          url_destino: string | null
          usuario_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          leido?: boolean
          leido_at?: string | null
          mensaje: string
          referencia_id?: number | null
          referencia_tipo?:
          | Database["public"]["Enums"]["ReferenciaNotificacion"]
          | null
          tipo: Database["public"]["Enums"]["TipoNotificacion"]
          titulo: string
          url_destino?: string | null
          usuario_id: number
        }
        Update: {
          created_at?: string
          id?: number
          leido?: boolean
          leido_at?: string | null
          mensaje?: string
          referencia_id?: number | null
          referencia_tipo?:
          | Database["public"]["Enums"]["ReferenciaNotificacion"]
          | null
          tipo?: Database["public"]["Enums"]["TipoNotificacion"]
          titulo?: string
          url_destino?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      oferta_reglas: {
        Row: {
          oferta_id: number
          prioridad: number
          regla_id: number
        }
        Insert: {
          oferta_id: number
          prioridad?: number
          regla_id: number
        }
        Update: {
          oferta_id?: number
          prioridad?: number
          regla_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "oferta_reglas_oferta_id_fkey"
            columns: ["oferta_id"]
            isOneToOne: false
            referencedRelation: "ofertas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oferta_reglas_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "reglas_descuento"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas: {
        Row: {
          activo: boolean
          descripcion: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          nombre: string
        }
        Update: {
          activo?: boolean
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      ordenes_compra: {
        Row: {
          cotizacion_proveedor_id: number | null
          creado_por: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["EstadoOrdenCompra"]
          estado_pago: Database["public"]["Enums"]["EstadoPagoOrdenCompra"]
          fecha_prometida: string | null
          fecha_recepcion: string | null
          id: number
          notas: string | null
          proveedor_id: number
          saldo_pendiente: number | null
          total_orden: number
          total_pagado: number
          updated_at: string | null
        }
        Insert: {
          cotizacion_proveedor_id?: number | null
          creado_por?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoOrdenCompra"]
          estado_pago?: Database["public"]["Enums"]["EstadoPagoOrdenCompra"]
          fecha_prometida?: string | null
          fecha_recepcion?: string | null
          id?: number
          notas?: string | null
          proveedor_id: number
          saldo_pendiente?: number | null
          total_orden?: number
          total_pagado?: number
          updated_at?: string | null
        }
        Update: {
          cotizacion_proveedor_id?: number | null
          creado_por?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoOrdenCompra"]
          estado_pago?: Database["public"]["Enums"]["EstadoPagoOrdenCompra"]
          fecha_prometida?: string | null
          fecha_recepcion?: string | null
          id?: number
          notas?: string | null
          proveedor_id?: number
          saldo_pendiente?: number | null
          total_orden?: number
          total_pagado?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_cotizacion_proveedor_id_fkey"
            columns: ["cotizacion_proveedor_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones_proveedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_compra_items: {
        Row: {
          cantidad_pedida: number
          cantidad_recibida: number
          id: number
          insumo_id: number | null
          material_id: number | null
          notas: string | null
          orden_compra_id: number
          precio_unitario: number
          subtotal: number | null
        }
        Insert: {
          cantidad_pedida: number
          cantidad_recibida?: number
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          notas?: string | null
          orden_compra_id: number
          precio_unitario: number
          subtotal?: number | null
        }
        Update: {
          cantidad_pedida?: number
          cantidad_recibida?: number
          id?: number
          insumo_id?: number | null
          material_id?: number | null
          notas?: string | null
          orden_compra_id?: number
          precio_unitario?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_compra_items_orden_compra_id_fkey"
            columns: ["orden_compra_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_produccion: {
        Row: {
          cantidad_solicitada: number
          creado_por: number | null
          created_at: string | null
          email_enviado_at: string | null
          estado: Database["public"]["Enums"]["EstadoOrdenProduccion"]
          etapa: Database["public"]["Enums"]["EtapaProduccion"] | null
          fecha_entrega: string | null
          ficha_id: number
          id: number
          notas: string | null
          notificado_at: string | null
          pedido_id: number | null
          producto_id: number
          taller_id: number
          updated_at: string | null
        }
        Insert: {
          cantidad_solicitada?: number
          creado_por?: number | null
          created_at?: string | null
          email_enviado_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoOrdenProduccion"]
          etapa?: Database["public"]["Enums"]["EtapaProduccion"] | null
          fecha_entrega?: string | null
          ficha_id: number
          id?: number
          notas?: string | null
          notificado_at?: string | null
          pedido_id?: number | null
          producto_id: number
          taller_id: number
          updated_at?: string | null
        }
        Update: {
          cantidad_solicitada?: number
          creado_por?: number | null
          created_at?: string | null
          email_enviado_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoOrdenProduccion"]
          etapa?: Database["public"]["Enums"]["EtapaProduccion"] | null
          fecha_entrega?: string | null
          ficha_id?: number
          id?: number
          notas?: string | null
          notificado_at?: string | null
          pedido_id?: number | null
          producto_id?: number
          taller_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ordenes_produccion_ficha_id"
            columns: ["ficha_id"]
            isOneToOne: false
            referencedRelation: "fichas_tecnicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_pedido_id"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_ordenes_produccion_taller_id"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_produccion_items: {
        Row: {
          cantidad: number
          created_at: string
          id: number
          orden_produccion_id: number
          pedido_item_id: number
          producto_id: number
          updated_at: string
          variante_id: number | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: number
          orden_produccion_id: number
          pedido_item_id: number
          producto_id: number
          updated_at?: string
          variante_id?: number | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: number
          orden_produccion_id?: number
          pedido_item_id?: number
          producto_id?: number
          updated_at?: string
          variante_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_produccion_items_orden_produccion_id_fkey"
            columns: ["orden_produccion_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "v_variante_stock_resumen"
            referencedColumns: ["variante_id"]
          },
          {
            foreignKeyName: "ordenes_produccion_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: number
          otp: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: number
          otp: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: number
          otp?: string
          used?: boolean
        }
        Relationships: []
      }
      pagos: {
        Row: {
          comprobante_url: string | null
          created_at: string
          estado: Database["public"]["Enums"]["EstadoPago"]
          fecha_pago: string
          id_uuid: string
          metodo_pago: Database["public"]["Enums"]["MetodoPago"]
          monto: number
          notas: string | null
          pedido_id: number
          tipo: Database["public"]["Enums"]["TipoPago"]
          updated_at: string | null
          usuario_id: number | null
          verificado_at: string | null
          verificado_por: number | null
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoPago"]
          fecha_pago?: string
          id_uuid: string
          metodo_pago: Database["public"]["Enums"]["MetodoPago"]
          monto: number
          notas?: string | null
          pedido_id: number
          tipo?: Database["public"]["Enums"]["TipoPago"]
          updated_at?: string | null
          usuario_id?: number | null
          verificado_at?: string | null
          verificado_por?: number | null
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoPago"]
          fecha_pago?: string
          id_uuid?: string
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"]
          monto?: number
          notas?: string | null
          pedido_id?: number
          tipo?: Database["public"]["Enums"]["TipoPago"]
          updated_at?: string | null
          usuario_id?: number | null
          verificado_at?: string | null
          verificado_por?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_orden_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_orden_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "pagos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      pagos_taller: {
        Row: {
          comprobante_url: string | null
          confeccion_id: number | null
          created_at: string
          estado: Database["public"]["Enums"]["EstadoPagoTaller"]
          fecha_pago: string
          id: number
          metodo_pago: Database["public"]["Enums"]["MetodoPago"]
          moneda: string
          monto: number
          notas: string | null
          numero_operacion: string | null
          orden_produccion_id: number | null
          registrado_por: number | null
          taller_id: number
          updated_at: string
        }
        Insert: {
          comprobante_url?: string | null
          confeccion_id?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoPagoTaller"]
          fecha_pago: string
          id?: number
          metodo_pago: Database["public"]["Enums"]["MetodoPago"]
          moneda?: string
          monto: number
          notas?: string | null
          numero_operacion?: string | null
          orden_produccion_id?: number | null
          registrado_por?: number | null
          taller_id: number
          updated_at?: string
        }
        Update: {
          comprobante_url?: string | null
          confeccion_id?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["EstadoPagoTaller"]
          fecha_pago?: string
          id?: number
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"]
          moneda?: string
          monto?: number
          notas?: string | null
          numero_operacion?: string | null
          orden_produccion_id?: number | null
          registrado_por?: number | null
          taller_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_taller_confeccion_id_fkey"
            columns: ["confeccion_id"]
            isOneToOne: false
            referencedRelation: "confecciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_taller_orden_produccion_id_fkey"
            columns: ["orden_produccion_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_taller_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_taller_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "pagos_taller_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          cantidad: number
          especificaciones: Json | null
          id: number
          pedido_id: number
          producto_id: number
          variante_id: number
        }
        Insert: {
          cantidad: number
          especificaciones?: Json | null
          id?: number
          pedido_id: number
          producto_id: number
          variante_id: number
        }
        Update: {
          cantidad?: number
          especificaciones?: Json | null
          id?: number
          pedido_id?: number
          producto_id?: number
          variante_id?: number
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
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "pedido_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "v_variante_stock_resumen"
            referencedColumns: ["variante_id"]
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
          costo_envio: number
          cotizacion_id: number | null
          created_at: string | null
          created_by: number | null
          direccion_despacho: string | null
          estado: Database["public"]["Enums"]["EstadoPedido"] | null
          id: number
          igv: number
          metodo_pago: Database["public"]["Enums"]["MetodoPago"] | null
          moneda: string
          monto_descuento: number
          monto_pagado: number
          moq_aplicado: number
          notas_cliente: string | null
          notas_pedido: string | null
          prioridad: Database["public"]["Enums"]["PrioridadPedido"] | null
          saldo_pendiente: number
          subtotal: number
          total: number
          total_estimado: number | null
          total_unidades: number
          updated_at: string | null
          zona_envio_id: number | null
        }
        Insert: {
          cliente_id?: number | null
          costo_envio?: number
          cotizacion_id?: number | null
          created_at?: string | null
          created_by?: number | null
          direccion_despacho?: string | null
          estado?: Database["public"]["Enums"]["EstadoPedido"] | null
          id?: number
          igv?: number
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          moneda?: string
          monto_descuento?: number
          monto_pagado?: number
          moq_aplicado?: number
          notas_cliente?: string | null
          notas_pedido?: string | null
          prioridad?: Database["public"]["Enums"]["PrioridadPedido"] | null
          saldo_pendiente?: number
          subtotal?: number
          total?: number
          total_estimado?: number | null
          total_unidades?: number
          updated_at?: string | null
          zona_envio_id?: number | null
        }
        Update: {
          cliente_id?: number | null
          costo_envio?: number
          cotizacion_id?: number | null
          created_at?: string | null
          created_by?: number | null
          direccion_despacho?: string | null
          estado?: Database["public"]["Enums"]["EstadoPedido"] | null
          id?: number
          igv?: number
          metodo_pago?: Database["public"]["Enums"]["MetodoPago"] | null
          moneda?: string
          monto_descuento?: number
          monto_pagado?: number
          moq_aplicado?: number
          notas_cliente?: string | null
          notas_pedido?: string | null
          prioridad?: Database["public"]["Enums"]["PrioridadPedido"] | null
          saldo_pendiente?: number
          subtotal?: number
          total?: number
          total_estimado?: number | null
          total_unidades?: number
          updated_at?: string | null
          zona_envio_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "v_cotizaciones_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "pedidos_zona_envio_id_fkey"
            columns: ["zona_envio_id"]
            isOneToOne: false
            referencedRelation: "costo_envio"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_interno: {
        Row: {
          cargo: Database["public"]["Enums"]["Cargo"] | null
          created_at: string | null
          dni: number | null
          estado: Database["public"]["Enums"]["EstadoPersonal"]
          fecha_ingreso: string | null
          id: number
          nombre_completo: string | null
          telefono: number | null
          updated_at: string | null
          usuario_id: number | null
        }
        Insert: {
          cargo?: Database["public"]["Enums"]["Cargo"] | null
          created_at?: string | null
          dni?: number | null
          estado?: Database["public"]["Enums"]["EstadoPersonal"]
          fecha_ingreso?: string | null
          id?: number
          nombre_completo?: string | null
          telefono?: number | null
          updated_at?: string | null
          usuario_id?: number | null
        }
        Update: {
          cargo?: Database["public"]["Enums"]["Cargo"] | null
          created_at?: string | null
          dni?: number | null
          estado?: Database["public"]["Enums"]["EstadoPersonal"]
          fecha_ingreso?: string | null
          id?: number
          nombre_completo?: string | null
          telefono?: number | null
          updated_at?: string | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_personal_interno_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_personal_interno_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: number | null
          colores_disponibles: Json | null
          created_at: string
          descripcion: string | null
          destacado: boolean | null
          estado: Database["public"]["Enums"]["EstadoProducto"]
          id: number
          imagen: string | null
          moq: number
          nombre: string
          precio: number
          reglas_descuento: Json | null
          sku: string
          stock: number
          tallas_disponibles: Json | null
          updated_at: string
        }
        Insert: {
          categoria_id?: number | null
          colores_disponibles?: Json | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean | null
          estado?: Database["public"]["Enums"]["EstadoProducto"]
          id?: number
          imagen?: string | null
          moq?: number
          nombre: string
          precio: number
          reglas_descuento?: Json | null
          sku: string
          stock?: number
          tallas_disponibles?: Json | null
          updated_at: string
        }
        Update: {
          categoria_id?: number | null
          colores_disponibles?: Json | null
          created_at?: string
          descripcion?: string | null
          destacado?: boolean | null
          estado?: Database["public"]["Enums"]["EstadoProducto"]
          id?: number
          imagen?: string | null
          moq?: number
          nombre?: string
          precio?: number
          reglas_descuento?: Json | null
          sku?: string
          stock?: number
          tallas_disponibles?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_productos"
            referencedColumns: ["id"]
          },
        ]
      }
      promocion_reglas: {
        Row: {
          prioridad: number
          promocion_id: number
          regla_id: number
        }
        Insert: {
          prioridad?: number
          promocion_id: number
          regla_id: number
        }
        Update: {
          prioridad?: number
          promocion_id?: number
          regla_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "promocion_reglas_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocion_reglas_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "reglas_descuento"
            referencedColumns: ["id"]
          },
        ]
      }
      promociones: {
        Row: {
          activo: boolean
          cupones: string | null
          descripcion: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          cupones?: string | null
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          nombre: string
        }
        Update: {
          activo?: boolean
          cupones?: string | null
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          categoria_suministro: string
          contacto: string
          created_at: string
          direccion: string
          email: string
          estado: string
          id: number
          razon_social: string
          ruc: string
          telefono: string
          updated_at: string
        }
        Insert: {
          categoria_suministro: string
          contacto: string
          created_at?: string
          direccion: string
          email: string
          estado?: string
          id?: number
          razon_social: string
          ruc: string
          telefono: string
          updated_at?: string
        }
        Update: {
          categoria_suministro?: string
          contacto?: string
          created_at?: string
          direccion?: string
          email?: string
          estado?: string
          id?: number
          razon_social?: string
          ruc?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      reglas_descuento: {
        Row: {
          activo: boolean | null
          cantidad_min: number
          fecha_fin: string
          fecha_inicio: string
          id: number
          nombre: string
          tipo_beneficio: Database["public"]["Enums"]["TipoBeneficio"]
          tipo_conteo: Database["public"]["Enums"]["TipoConteo"] | null
          valor_descuento: number
        }
        Insert: {
          activo?: boolean | null
          cantidad_min?: number
          fecha_fin: string
          fecha_inicio: string
          id?: number
          nombre: string
          tipo_beneficio: Database["public"]["Enums"]["TipoBeneficio"]
          tipo_conteo?: Database["public"]["Enums"]["TipoConteo"] | null
          valor_descuento: number
        }
        Update: {
          activo?: boolean | null
          cantidad_min?: number
          fecha_fin?: string
          fecha_inicio?: string
          id?: number
          nombre?: string
          tipo_beneficio?: Database["public"]["Enums"]["TipoBeneficio"]
          tipo_conteo?: Database["public"]["Enums"]["TipoConteo"] | null
          valor_descuento?: number
        }
        Relationships: []
      }
      repartidores: {
        Row: {
          activo: boolean
          created_at: string
          id: number
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: number
          nombre: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: number
          nombre?: string
          telefono?: string | null
          updated_at?: string
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
          pedido_id: number | null
          variante_id: number
        }
        Insert: {
          cantidad: number
          cotizacion_id?: number | null
          estado?: string
          expira_en?: string
          id?: number
          pedido_id?: number | null
          variante_id: number
        }
        Update: {
          cantidad?: number
          cotizacion_id?: number | null
          estado?: string
          expira_en?: string
          id?: number
          pedido_id?: number | null
          variante_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_reservas_pedido"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reservas_stock_variante_id"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "v_variante_stock_resumen"
            referencedColumns: ["variante_id"]
          },
          {
            foreignKeyName: "fk_reservas_stock_variante_id"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes_producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_stock_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_stock_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "v_cotizaciones_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimiento_confeccion: {
        Row: {
          confeccion_id: number | null
          created_at: string | null
          estado_anterior:
          | Database["public"]["Enums"]["EstadoConfeccion"]
          | null
          estado_nuevo: Database["public"]["Enums"]["EstadoConfeccion"] | null
          id: number
          notas: string | null
          responsable_id: number | null
        }
        Insert: {
          confeccion_id?: number | null
          created_at?: string | null
          estado_anterior?:
          | Database["public"]["Enums"]["EstadoConfeccion"]
          | null
          estado_nuevo?: Database["public"]["Enums"]["EstadoConfeccion"] | null
          id?: number
          notas?: string | null
          responsable_id?: number | null
        }
        Update: {
          confeccion_id?: number | null
          created_at?: string | null
          estado_anterior?:
          | Database["public"]["Enums"]["EstadoConfeccion"]
          | null
          estado_nuevo?: Database["public"]["Enums"]["EstadoConfeccion"] | null
          id?: number
          notas?: string | null
          responsable_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_seguimiento_confeccion_confeccion_id"
            columns: ["confeccion_id"]
            isOneToOne: false
            referencedRelation: "confecciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_seguimiento_confeccion_responsable_id"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_seguimiento_confeccion_responsable_id"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      seguimiento_despachos: {
        Row: {
          creado_por: string | null
          created_at: string
          grupo_despacho_id: number
          id: number
          notas: string | null
          status: Database["public"]["Enums"]["EstadoDespacho"]
          updated_at: string
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          grupo_despacho_id: number
          id?: number
          notas?: string | null
          status: Database["public"]["Enums"]["EstadoDespacho"]
          updated_at?: string
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          grupo_despacho_id?: number
          id?: number
          notas?: string | null
          status?: Database["public"]["Enums"]["EstadoDespacho"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimiento_despachos_grupo_despacho_id_fkey"
            columns: ["grupo_despacho_id"]
            isOneToOne: false
            referencedRelation: "despachos_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimiento_pedido: {
        Row: {
          creado_por: string | null
          created_at: string
          id: number
          notas: string | null
          pedido_id: number
          status: Database["public"]["Enums"]["EstadoPedido"]
          updated_at: string
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          id?: number
          notas?: string | null
          pedido_id: number
          status?: Database["public"]["Enums"]["EstadoPedido"]
          updated_at?: string
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          id?: number
          notas?: string | null
          pedido_id?: number
          status?: Database["public"]["Enums"]["EstadoPedido"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimiento_pedido_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "seguimiento_pedido_pedido_fk"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimiento_produccion: {
        Row: {
          activo: boolean
          completado_en: string | null
          created_at: string
          duracion_minutos: number | null
          etapa: Database["public"]["Enums"]["EtapaProduccion"]
          id: number
          iniciado_en: string
          observaciones: string | null
          orden_id: number
          usuario_id: number | null
        }
        Insert: {
          activo?: boolean
          completado_en?: string | null
          created_at?: string
          duracion_minutos?: number | null
          etapa: Database["public"]["Enums"]["EtapaProduccion"]
          id?: number
          iniciado_en?: string
          observaciones?: string | null
          orden_id: number
          usuario_id?: number | null
        }
        Update: {
          activo?: boolean
          completado_en?: string | null
          created_at?: string
          duracion_minutos?: number | null
          etapa?: Database["public"]["Enums"]["EtapaProduccion"]
          id?: number
          iniciado_en?: string
          observaciones?: string | null
          orden_id?: number
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_seguimiento_produccion_orden_id"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_seguimiento_produccion_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_seguimiento_produccion_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "ventas_mensuales_por_usuario"
            referencedColumns: ["usuario_id"]
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
          updated_at?: string
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
      tarifas_taller: {
        Row: {
          activo: boolean
          created_at: string
          especialidad: Database["public"]["Enums"]["EspecialidadTaller"]
          id: number
          moneda: string
          notas: string | null
          precio_unitario: number
          taller_id: number
          updated_at: string
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          especialidad: Database["public"]["Enums"]["EspecialidadTaller"]
          id?: number
          moneda?: string
          notas?: string | null
          precio_unitario: number
          taller_id: number
          updated_at?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          especialidad?: Database["public"]["Enums"]["EspecialidadTaller"]
          id?: number
          moneda?: string
          notas?: string | null
          precio_unitario?: number
          taller_id?: number
          updated_at?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarifas_taller_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifas_talleres: {
        Row: {
          costo_unitario: number
          created_at: string | null
          estado: string | null
          id: number
          moneda: string | null
          proceso: string
          rango_desde: number
          rango_hasta: number
          taller_id: number
          tipo_prenda: string
          updated_at: string | null
        }
        Insert: {
          costo_unitario: number
          created_at?: string | null
          estado?: string | null
          id?: never
          moneda?: string | null
          proceso: string
          rango_desde: number
          rango_hasta: number
          taller_id: number
          tipo_prenda: string
          updated_at?: string | null
        }
        Update: {
          costo_unitario?: number
          created_at?: string | null
          estado?: string | null
          id?: never
          moneda?: string | null
          proceso?: string
          rango_desde?: number
          rango_hasta?: number
          taller_id?: number
          tipo_prenda?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarifas_talleres_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          auth_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          estado: Database["public"]["Enums"]["EstadoUsuario"] | null
          id: number
          rol: Database["public"]["Enums"]["Rol"] | null
          ultimo_acceso: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          estado?: Database["public"]["Enums"]["EstadoUsuario"] | null
          id?: number
          rol?: Database["public"]["Enums"]["Rol"] | null
          ultimo_acceso?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          estado?: Database["public"]["Enums"]["EstadoUsuario"] | null
          id?: number
          rol?: Database["public"]["Enums"]["Rol"] | null
          ultimo_acceso?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          stock: number
          talla: Database["public"]["Enums"]["TallaProductos"]
          updated_at: string | null
        }
        Insert: {
          color?: Database["public"]["Enums"]["ColorPrenda"]
          created_at?: string | null
          estado?: Database["public"]["Enums"]["EstadoProducto"]
          id?: number
          imagen_url?: string | null
          nombre: string
          precio_adicional?: number
          producto_id: number
          sku: string
          stock?: number
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
          stock?: number
          talla?: Database["public"]["Enums"]["TallaProductos"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
        ]
      }
    }
    Views: {
      despachos_entregados_por_mes: {
        Row: {
          cantidad_despachos: number | null
          estado_despacho: Database["public"]["Enums"]["EstadoDespacho"] | null
          mes: string | null
        }
        Relationships: []
      }
      devoluciones_cliente_por_mes_y_producto: {
        Row: {
          cantidad_solicitudes: number | null
          estado_solicitud:
          | Database["public"]["Enums"]["EstadoDevolucion"]
          | null
          mes: string | null
          producto: string | null
          producto_id: number | null
          unidades_develtas: number | null
        }
        Relationships: []
      }
      igv_descuentos_mensual_ventas_efectivas: {
        Row: {
          igv_pedidos: number | null
          mes: string | null
          moneda: string | null
          monto_descuento_pedidos: number | null
          subtotal_pedidos: number | null
          total_pedidos: number | null
        }
        Relationships: []
      }
      nuevos_clientes_registrados_por_mes: {
        Row: {
          mes: string | null
          nuevos_clientes: number | null
          tipo_cliente: Database["public"]["Enums"]["TipoCliente"] | null
        }
        Relationships: []
      }
      pedidos_estado_por_mes: {
        Row: {
          cantidad_pedidos: number | null
          estado_pedido: Database["public"]["Enums"]["EstadoPedido"] | null
          mes: string | null
        }
        Relationships: []
      }
      productos_bajo_stock_o_agotados: {
        Row: {
          bajo_stock_minimo: boolean | null
          esta_agotado: boolean | null
          producto: string | null
          producto_id: number | null
          stock_actual: number | null
        }
        Relationships: []
      }
      productos_mas_stock_vs_vendidos: {
        Row: {
          producto: string | null
          producto_id: number | null
          rotacion_stock_aprox: number | null
          stock_actual: number | null
          unidades_vendidas: number | null
        }
        Relationships: []
      }
      productos_mas_vendidos_acumulados_por_mes: {
        Row: {
          mes: string | null
          producto: string | null
          producto_id: number | null
          ranking_acumulado: number | null
          unidades_vendidas: number | null
          unidades_vendidas_acumuladas: number | null
        }
        Relationships: []
      }
      rotacion_inventario_aprox_por_producto: {
        Row: {
          producto: string | null
          producto_id: number | null
          rotacion_90d_aprox: number | null
          stock_actual: number | null
          unidades_vendidas_90d: number | null
        }
        Relationships: []
      }
      tasa_devoluciones_por_producto: {
        Row: {
          producto: string | null
          producto_id: number | null
          tasa_devolucion: number | null
          unidades_develtas: number | null
          unidades_vendidas: number | null
        }
        Relationships: []
      }
      tiempo_ciclo_pedido_a_entrega_promedio: {
        Row: {
          cantidad_pedidos: number | null
          horas_promedio_ciclo: number | null
          mes_entrega: string | null
        }
        Relationships: []
      }
      top_clientes_ventas_efectivas_mensual: {
        Row: {
          cliente: string | null
          mes: string | null
          moneda: string | null
          ranking: number | null
          unidades_vendidas: number | null
        }
        Relationships: []
      }
      top5_clientes_ventas_efectivas_mensual: {
        Row: {
          cliente: string | null
          mes: string | null
          moneda: string | null
          unidades_vendidas: number | null
        }
        Relationships: []
      }
      v_cotizaciones_dashboard: {
        Row: {
          aprobacion_automatica: boolean | null
          aprobado_at: string | null
          cliente_id: number | null
          cliente_razon_social: string | null
          cliente_ruc: string | null
          costo_envio: number | null
          costo_total_estimado: number | null
          created_at: string | null
          direccion_despacho: string | null
          estado: Database["public"]["Enums"]["EstadoCotizacion"] | null
          expira_at: string | null
          id: number | null
          id_regla_descuento: number | null
          igv: number | null
          moneda: string | null
          monto_descuento: number | null
          notas_internas: string | null
          numero: string | null
          origen: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          valida_hasta: string | null
          zona_envio_id: number | null
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
            foreignKeyName: "cotizaciones_zona_envio_id_fkey"
            columns: ["zona_envio_id"]
            isOneToOne: false
            referencedRelation: "costo_envio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cotizaciones_id_regla_descuento"
            columns: ["id_regla_descuento"]
            isOneToOne: false
            referencedRelation: "reglas_descuento"
            referencedColumns: ["id"]
          },
        ]
      }
      v_producto_stock_resumen: {
        Row: {
          producto_id: number | null
          producto_nombre: string | null
          stock_total_adicional: number | null
        }
        Relationships: []
      }
      v_stock_disponible_por_producto: {
        Row: {
          producto_id: number | null
          reservado_total: number | null
          stock_disponible: number | null
          stock_variantes: number | null
        }
        Relationships: []
      }
      v_variante_stock_resumen: {
        Row: {
          color: Database["public"]["Enums"]["ColorPrenda"] | null
          producto_id: number | null
          producto_nombre: string | null
          stock_variante_stock_adicional: number | null
          talla: Database["public"]["Enums"]["TallaProductos"] | null
          variante_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "devoluciones_cliente_por_mes_y_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_bajo_stock_o_agotados"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_stock_vs_vendidos"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_mas_vendidos_acumulados_por_mes"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "rotacion_inventario_aprox_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "tasa_devoluciones_por_producto"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_producto_stock_resumen"
            referencedColumns: ["producto_id"]
          },
          {
            foreignKeyName: "fk_variantes_producto_producto_id"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "v_stock_disponible_por_producto"
            referencedColumns: ["producto_id"]
          },
        ]
      }
      ventas_mensuales: {
        Row: {
          cantidad_comprobantes: number | null
          igv_total: number | null
          mes: string | null
          moneda: string | null
          subtotal_total: number | null
          tipo_comprobante:
          | Database["public"]["Enums"]["TipoComprobante"]
          | null
          venta_total: number | null
        }
        Relationships: []
      }
      ventas_mensuales_por_metodo_pago: {
        Row: {
          cantidad_comprobantes: number | null
          mes: string | null
          metodo_pago: Database["public"]["Enums"]["MetodoPago"] | null
          moneda: string | null
          total_vendido: number | null
        }
        Relationships: []
      }
      ventas_mensuales_por_tipo_comprobante: {
        Row: {
          cantidad_comprobantes: number | null
          igv_vendido: number | null
          mes: string | null
          moneda: string | null
          subtotal_vendido: number | null
          tipo_comprobante:
          | Database["public"]["Enums"]["TipoComprobante"]
          | null
          total_vendido: number | null
        }
        Relationships: []
      }
      ventas_mensuales_por_usuario: {
        Row: {
          cantidad_comprobantes: number | null
          mes: string | null
          moneda: string | null
          rol: Database["public"]["Enums"]["Rol"] | null
          total_vendido: number | null
          usuario_id: number | null
        }
        Relationships: []
      }
      ventas_productos_mas_vendidos_mensuales: {
        Row: {
          mes: string | null
          moneda: string | null
          producto: string | null
          ranking: number | null
          unidades_vendidas: number | null
        }
        Relationships: []
      }
      vw_incidencias_mensuales: {
        Row: {
          anio: number | null
          mes: string | null
          nombre_mes: string | null
          promedio_impacto_horas: number | null
          severidad: Database["public"]["Enums"]["SeveridadIncidencia"] | null
          tipo: Database["public"]["Enums"]["TipoIncidencia"] | null
          total_incidencias: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["Rol"]
      }
      calcular_costo_ficha: { Args: { p_ficha_id: number }; Returns: number }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["Rol"]
      }
      fn_actualizar_precio_con_historico: {
        Args: {
          p_moneda: Database["public"]["Enums"]["Moneda"]
          p_precio_nuevo: number
          p_producto_id: string
          p_razon_cambio: string
          p_tipo_producto: string
          p_usuario_id: string
        }
        Returns: Json
      }
      fn_crear_reserva_stock: {
        Args: {
          p_almacen_id: string
          p_cantidad_a_reservar: number
          p_motivo: string
          p_pedido_id?: string
          p_producto_id: string
        }
        Returns: Json
      }
      fn_insertar_movimiento: {
        Args: {
          p_cantidad: number
          p_costo_unitario?: number
          p_insumo_id?: number
          p_material_id?: number
          p_motivo: string
          p_producto_id?: number
          p_referencia_id: number
          p_referencia_tipo: Database["public"]["Enums"]["ReferenciaMovimiento"]
          p_tipo_movimiento: Database["public"]["Enums"]["TipoMovimiento"]
          p_usuario_id?: number
        }
        Returns: undefined
      }
      fn_recalcular_descuento_cotizacion: {
        Args: { p_cotizacion_id: number }
        Returns: undefined
      }
      fn_usuario_id_desde_cliente: {
        Args: { p_cliente_id: number }
        Returns: number
      }
      get_admin_users: {
        Args: never
        Returns: {
          usuario_id: number
        }[]
      }
      random_9_digit_phone: { Args: never; Returns: number }
      rpc_crud_categorias_create: {
        Args: {
          p_activo?: boolean
          p_descripcion?: string
          p_imagen?: string
          p_nombre: string
          p_orden?: number
        }
        Returns: number
      }
      rpc_crud_categorias_delete: { Args: { p_id: number }; Returns: boolean }
      rpc_crud_categorias_get: {
        Args: { p_id: number }
        Returns: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: number
          imagen: string | null
          nombre: string
          orden: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "categorias_productos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_categorias_update: {
        Args: {
          p_activo?: boolean
          p_descripcion?: string
          p_id: number
          p_imagen?: string
          p_nombre?: string
          p_orden?: number
        }
        Returns: number
      }
      rpc_crud_clientes_create: {
        Args: {
          p_activo?: Database["public"]["Enums"]["EstadoCliente"]
          p_direccion_fiscal?: string
          p_email?: string
          p_nombre_comercial?: string
          p_razon_social?: string
          p_ruc?: string
          p_telefono?: string
          p_tipo_cliente?: Database["public"]["Enums"]["TipoCliente"]
          p_usuario_id?: number
        }
        Returns: number
      }
      rpc_crud_clientes_delete: { Args: { p_id: number }; Returns: boolean }
      rpc_crud_clientes_get: {
        Args: { p_id: number }
        Returns: {
          created_at: string
          direccion_fiscal: string | null
          email: string | null
          estado: Database["public"]["Enums"]["EstadoCliente"] | null
          id: number
          nombre_comercial: string | null
          razon_social: string | null
          ruc: string
          telefono: string | null
          tipo_cliente: Database["public"]["Enums"]["TipoCliente"] | null
          updated_at: string
          usuario_id: number | null
        }
        SetofOptions: {
          from: "*"
          to: "clientes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_clientes_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          email: string
          estado: Database["public"]["Enums"]["EstadoCliente"]
          id: number
          razon_social: string
          ruc: string
          telefono: string
          tipo_cliente: Database["public"]["Enums"]["TipoCliente"]
          updated_at: string
          usuario_id: number
        }[]
      }
      rpc_crud_clientes_update: {
        Args: {
          p_activo?: Database["public"]["Enums"]["EstadoCliente"]
          p_direccion_fiscal?: string
          p_email?: string
          p_id: number
          p_nombre_comercial?: string
          p_razon_social?: string
          p_ruc?: string
          p_telefono?: string
          p_tipo_cliente?: Database["public"]["Enums"]["TipoCliente"]
          p_usuario_id?: number
        }
        Returns: number
      }
      rpc_crud_ficha_medidas_create: {
        Args: {
          p_id_ficha: number
          p_punto_medida?: string
          p_talla?: string
          p_tolerancia?: number
          p_valor_cm?: number
        }
        Returns: number
      }
      rpc_crud_ficha_medidas_delete: {
        Args: { p_id: number }
        Returns: boolean
      }
      rpc_crud_ficha_medidas_get: {
        Args: { p_id: number }
        Returns: {
          created_at: string
          id: number
          id_ficha: number | null
          punto_medida: string | null
          talla: string | null
          tolerancia: number | null
          valor_cm: number | null
        }
        SetofOptions: {
          from: "*"
          to: "ficha_medidas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_ficha_medidas_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          id: number
          id_ficha: number
          punto_medida: string
          talla: string
          tolerancia: number
          valor_cm: number
        }[]
      }
      rpc_crud_ficha_medidas_update: {
        Args: {
          p_id: number
          p_id_ficha?: number
          p_punto_medida?: string
          p_talla?: string
          p_tolerancia?: number
          p_valor_cm?: number
        }
        Returns: number
      }
      rpc_crud_fichas_tecnicas_create: {
        Args: {
          p_costo_estimado?: number
          p_created_by?: number
          p_descripcion_detallada?: string
          p_estado?: Database["public"]["Enums"]["EstadoFicha"]
          p_ficha_url?: string
          p_id_producto?: number
          p_imagen_geometral?: string
          p_sam_total?: number
          p_version?: string
        }
        Returns: number
      }
      rpc_crud_fichas_tecnicas_delete: {
        Args: { p_id: number }
        Returns: boolean
      }
      rpc_crud_fichas_tecnicas_get: {
        Args: { p_id: number }
        Returns: {
          costo_estimado: number | null
          created_at: string
          created_by: number | null
          descripcion_detallada: string | null
          estado: Database["public"]["Enums"]["EstadoFicha"] | null
          ficha_url: string | null
          id: number
          id_producto: number | null
          imagen_geometral: string | null
          sam_total: number | null
          version: string | null
        }
        SetofOptions: {
          from: "*"
          to: "fichas_tecnicas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_fichas_tecnicas_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          costo_estimado: number
          created_at: string
          estado: Database["public"]["Enums"]["EstadoFicha"]
          id: number
          id_producto: number
          sam_total: number
          version: string
        }[]
      }
      rpc_crud_fichas_tecnicas_update: {
        Args: {
          p_costo_estimado?: number
          p_created_by?: number
          p_descripcion_detallada?: string
          p_estado?: Database["public"]["Enums"]["EstadoFicha"]
          p_ficha_url?: string
          p_id: number
          p_id_producto?: number
          p_imagen_geometral?: string
          p_sam_total?: number
          p_version?: string
        }
        Returns: number
      }
      rpc_crud_insumo_delete: { Args: { p_id: number }; Returns: boolean }
      rpc_crud_materiales_create: {
        Args: {
          p_alerta_bajo_stock?: boolean
          p_almacen_id?: number
          p_ancho_total?: number
          p_ancho_util?: number
          p_codigo_color?: string
          p_color?: string
          p_composicion?: string
          p_descripcion?: string
          p_gramaje?: number
          p_nombre: string
          p_precio_unitario?: number
          p_proveedor_id?: number
          p_stock_actual?: number
          p_stock_minimo?: number
          p_tipo?: Database["public"]["Enums"]["TipoMaterial"]
          p_ubicacion_almacen?: string
          p_unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
        }
        Returns: number
      }
      rpc_crud_materiales_delete: { Args: { p_id: number }; Returns: boolean }
      rpc_crud_materiales_get: {
        Args: { p_id: number }
        Returns: {
          alerta_bajo_stock: boolean | null
          ancho_total: number | null
          ancho_util: number | null
          codigo_color: string | null
          color: string | null
          composicion: string | null
          created_at: string
          descripcion: string | null
          gramaje: number | null
          id: number
          nombre: string
          precio_unitario: number | null
          proveedor_id: number | null
          stock_actual: number
          stock_minimo: number
          tipo: Database["public"]["Enums"]["TipoMaterial"]
          unidad_medida: Database["public"]["Enums"]["UnidadMedida"]
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "materiales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_materiales_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          almacen_id: number
          id: number
          nombre: string
          precio_unitario: number
          proveedor_id: number
          stock_actual: number
          stock_minimo: number
          tipo: Database["public"]["Enums"]["TipoMaterial"]
          unidad_medida: Database["public"]["Enums"]["UnidadMedida"]
          updated_at: string
        }[]
      }
      rpc_crud_materiales_update: {
        Args: {
          p_alerta_bajo_stock?: boolean
          p_almacen_id?: number
          p_ancho_total?: number
          p_ancho_util?: number
          p_codigo_color?: string
          p_color?: string
          p_composicion?: string
          p_descripcion?: string
          p_gramaje?: number
          p_id: number
          p_nombre?: string
          p_precio_unitario?: number
          p_proveedor_id?: number
          p_stock_actual?: number
          p_stock_minimo?: number
          p_tipo?: Database["public"]["Enums"]["TipoMaterial"]
          p_ubicacion_almacen?: string
          p_unidad_medida?: Database["public"]["Enums"]["UnidadMedida"]
        }
        Returns: number
      }
      rpc_crud_personal_interno_create: {
        Args: {
          p_cargo?: Database["public"]["Enums"]["Cargo"]
          p_dni?: number
          p_estado?: Database["public"]["Enums"]["EstadoPersonal"]
          p_fecha_ingreso?: string
          p_nombre_completo?: string
          p_telefono?: number
          p_usuario_id?: number
        }
        Returns: number
      }
      rpc_crud_personal_interno_delete: {
        Args: { p_id: number }
        Returns: boolean
      }
      rpc_crud_personal_interno_get: {
        Args: { p_id: number }
        Returns: {
          cargo: Database["public"]["Enums"]["Cargo"] | null
          created_at: string | null
          dni: number | null
          estado: Database["public"]["Enums"]["EstadoPersonal"]
          fecha_ingreso: string | null
          id: number
          nombre_completo: string | null
          telefono: number | null
          updated_at: string | null
          usuario_id: number | null
        }
        SetofOptions: {
          from: "*"
          to: "personal_interno"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_personal_interno_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          cargo: Database["public"]["Enums"]["Cargo"]
          dni: number
          estado: Database["public"]["Enums"]["EstadoPersonal"]
          fecha_ingreso: string
          id: number
          nombre_completo: string
          telefono: number
        }[]
      }
      rpc_crud_personal_interno_update: {
        Args: {
          p_cargo?: Database["public"]["Enums"]["Cargo"]
          p_dni?: number
          p_estado?: Database["public"]["Enums"]["EstadoPersonal"]
          p_fecha_ingreso?: string
          p_id: number
          p_nombre_completo?: string
          p_telefono?: number
          p_usuario_id?: number
        }
        Returns: number
      }
      rpc_crud_productos_create: {
        Args: {
          p_almacen_id?: number
          p_categoria_id?: number
          p_colores_disponibles?: Json
          p_descripcion?: string
          p_destacado?: boolean
          p_estado?: Database["public"]["Enums"]["EstadoProducto"]
          p_imagen?: string
          p_moq?: number
          p_nombre: string
          p_precio?: number
          p_reglas_descuento?: Json
          p_sku?: string
          p_stock?: number
          p_tallas_disponibles?: Json
        }
        Returns: number
      }
      rpc_crud_productos_delete: { Args: { p_id: number }; Returns: boolean }
      rpc_crud_productos_get: {
        Args: { p_id: number }
        Returns: {
          categoria_id: number | null
          colores_disponibles: Json | null
          created_at: string
          descripcion: string | null
          destacado: boolean | null
          estado: Database["public"]["Enums"]["EstadoProducto"]
          id: number
          imagen: string | null
          moq: number
          nombre: string
          precio: number
          reglas_descuento: Json | null
          sku: string
          stock: number
          tallas_disponibles: Json | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "productos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_productos_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          categoria_id: number
          descripcion: string
          estado: Database["public"]["Enums"]["EstadoProducto"]
          id: number
          imagen: string
          nombre: string
          precio: number
          sku: string
          stock: number
          updated_at: string
        }[]
      }
      rpc_crud_productos_update: {
        Args: {
          p_almacen_id?: number
          p_categoria_id?: number
          p_colores_disponibles?: Json
          p_descripcion?: string
          p_destacado?: boolean
          p_estado?: Database["public"]["Enums"]["EstadoProducto"]
          p_id: number
          p_imagen?: string
          p_moq?: number
          p_nombre: string
          p_precio?: number
          p_reglas_descuento?: Json
          p_sku?: string
          p_stock?: number
          p_tallas_disponibles?: Json
        }
        Returns: number
      }
      rpc_crud_talleres_create: {
        Args: {
          p_contacto?: string
          p_direccion?: string
          p_email?: string
          p_especialidad?: Database["public"]["Enums"]["EspecialidadTaller"]
          p_estado?: Database["public"]["Enums"]["EstadoTaller"]
          p_nombre: string
          p_ruc?: string
          p_telefono?: string
        }
        Returns: number
      }
      rpc_crud_talleres_delete: { Args: { p_id: number }; Returns: boolean }
      rpc_crud_talleres_get: {
        Args: { p_id: number }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "talleres"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_talleres_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          direccion: string
          email: string
          especialidad: Database["public"]["Enums"]["EspecialidadTaller"]
          estado: Database["public"]["Enums"]["EstadoTaller"]
          id: number
          nombre: string
          ruc: string
          telefono: string
          updated_at: string
        }[]
      }
      rpc_crud_talleres_update: {
        Args: {
          p_contacto?: string
          p_direccion?: string
          p_email?: string
          p_especialidad?: Database["public"]["Enums"]["EspecialidadTaller"]
          p_estado?: Database["public"]["Enums"]["EstadoTaller"]
          p_id: number
          p_nombre?: string
          p_ruc?: string
          p_telefono?: string
        }
        Returns: number
      }
      rpc_crud_usuarios_create: {
        Args: {
          p_auth_id?: string
          p_created_by?: string
          p_email: string
          p_estado?: Database["public"]["Enums"]["EstadoUsuario"]
          p_rol?: Database["public"]["Enums"]["Rol"]
        }
        Returns: number
      }
      rpc_crud_usuarios_delete: { Args: { p_id: number }; Returns: boolean }
      rpc_crud_usuarios_get: {
        Args: { p_id: number }
        Returns: {
          auth_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          estado: Database["public"]["Enums"]["EstadoUsuario"] | null
          id: number
          rol: Database["public"]["Enums"]["Rol"] | null
          ultimo_acceso: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rpc_crud_usuarios_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          email: string
          estado: Database["public"]["Enums"]["EstadoUsuario"]
          id: number
          rol: Database["public"]["Enums"]["Rol"]
          ultimo_acceso: string
          updated_at: string
        }[]
      }
      rpc_crud_usuarios_update: {
        Args: {
          p_auth_id?: string
          p_created_by?: string
          p_email?: string
          p_estado?: Database["public"]["Enums"]["EstadoUsuario"]
          p_id: number
          p_rol?: Database["public"]["Enums"]["Rol"]
          p_ultimo_acceso?: string
        }
        Returns: number
      }
      rpc_get_cliente_by_uuid: {
        Args: { p_cliente_id: number }
        Returns: {
          created_at: string
          direccion_fiscal: string
          email: string
          estado: string
          id: number
          nombre_comercial: string
          razon_social: string
          ruc: string
          telefono: string
          tipo_cliente: string
          updated_at: string
        }[]
      }
      rpc_get_despachos_by_pedido_uuid: {
        Args: { p_pedido_id: number }
        Returns: {
          created_at: string
          estado: string
          id: number
          pedido_id: number
          updated_at: string
        }[]
      }
      rpc_get_feedback_cliente_by_pedido_uuid: {
        Args: { p_pedido_id: number }
        Returns: {
          cliente_id: number
          created_at: string
          id: number
          mensaje: string
          pedido_id: number
          tipo: string
          updated_at: string
        }[]
      }
      rpc_get_ordenes_produccion_by_pedido_uuid: {
        Args: { p_pedido_id: number }
        Returns: {
          cantidad_solicitada: number
          created_at: string
          estado: string
          fecha_entrega: string
          ficha_id: number
          id: number
          notas: string
          pedido_id: number
          producto_id: number
          taller_id: number
          updated_at: string
        }[]
      }
      rpc_get_ordenes_produccion_items: {
        Args: { p_orden_id?: number; p_pedido_id?: string }
        Returns: {
          cantidad: number
          created_at: string
          id: number
          orden_produccion_id: number
          pedido_id: string
          pedido_item_id: number
          producto_id: number
          updated_at: string
          variante_id: number
        }[]
      }
      rpc_get_pedido_by_uuid: {
        Args: { p_pedido_id: number }
        Returns: {
          cliente_id: number
          costo_envio: number
          cotizacion_id: number
          created_at: string
          created_by: number
          direccion_despacho: string
          estado: string
          id: number
          igv: number
          metodo_pago: string
          moneda: string
          monto_descuento: number
          monto_pagado: number
          moq_aplicado: number
          notas_cliente: string
          prioridad: string
          saldo_pendiente: number
          subtotal: number
          total: number
          total_estimado: number
          total_unidades: number
          updated_at: string
        }[]
      }
      rpc_get_pedido_items_by_pedido_uuid: {
        Args: { p_pedido_id: number }
        Returns: {
          cantidad: number
          especificaciones: Json
          id: number
          pedido_id: number
          producto_id: number
          variante_id: number
        }[]
      }
      rpc_registrar_movimiento_inventario: {
        Args: {
          p_almacen_id: number
          p_cantidad: number
          p_insumo_id: number
          p_material_id: number
          p_motivo: string
          p_producto_id: number
          p_referencia_id: number
          p_referencia_tipo: Database["public"]["Enums"]["ReferenciaMovimiento"]
          p_tipo_movimiento: Database["public"]["Enums"]["TipoMovimiento"]
          p_usuario_id: number
        }
        Returns: {
          movimiento_id: number
          stock_insumo_actual: number
          stock_material_actual: number
          tipo_movimiento: Database["public"]["Enums"]["TipoMovimiento"]
        }[]
      }
      rpc_registrar_producto_con_bom: {
        Args: {
          p_almacen_id: number
          p_cantidad: number
          p_motivo: string
          p_producto_id: number
          p_referencia_id: number
          p_referencia_tipo: Database["public"]["Enums"]["ReferenciaMovimiento"]
          p_tipo_producto_mov: Database["public"]["Enums"]["TipoMovimiento"]
          p_usuario_id: number
        }
        Returns: {
          movimiento_id: number
        }[]
      }
    }
    Enums: {
      AccionAuditoria:
      | "crear"
      | "actualizar"
      | "eliminar"
      | "aprobar"
      | "rechazar"
      | "anular"
      Cargo:
      | "administrador"
      | "cortador"
      | "disenador"
      | "recepcionista"
      | "ayudante"
      | "representante_taller"
      | "gerente"
      | "almacenero"
      ColorPrenda:
      | "animal_print"
      | "azul"
      | "azulino"
      | "beige"
      | "blanco"
      | "camel"
      | "celeste"
      | "cemento"
      | "chocolate"
      | "coral"
      | "crema"
      | "fucsia"
      | "grafito"
      | "gris"
      | "guinda"
      | "lila"
      | "marron"
      | "melange"
      | "melon"
      | "negro"
      | "nude"
      | "palo_rosa"
      | "perla"
      | "piton"
      | "rojo"
      | "rosa"
      | "rose"
      | "verde"
      | "vino"
      CondicionProducto:
      | "perfecto_estado"
      | "reproceso"
      | "segunda"
      | "merma"
      | "sucio"
      CuentaContable:
      | "caja"
      | "bancos"
      | "cuentas_por_cobrar"
      | "inventario"
      | "ventas"
      | "costo_ventas"
      | "cuentas_por_pagar"
      | "capital"
      | "igv"
      | "descuentos"
      | "gastos_operativos"
      EspecialidadTaller:
      | "corte"
      | "confeccion"
      | "bordado"
      | "estampado"
      | "costura"
      | "acabados"
      | "otro"
      EstadoCategoria: "activo" | "inactivo"
      EstadoCliente: "activo" | "inactivo" | "suspendido" | "potencial"
      EstadoComprobante: "pendiente" | "enviado" | "aceptado" | "rechazado"
      EstadoConfeccion:
      | "pendiente"
      | "en_proceso"
      | "completada"
      | "rechazada"
      | "cancelada"
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
      | "en_almacen"
      | "devuelto"
      | "cancelado"
      EstadoDevolucion:
      | "pendiente"
      | "en_revision"
      | "aprobada"
      | "rechazada"
      | "completada"
      | "anulada"
      EstadoDevolucionProv:
      | "pendiente_envio"
      | "en_transito"
      | "aceptado_proveedor"
      | "rechazado_proveedor"
      | "completado"
      EstadoEntrega:
      | "en_espera"
      | "siguiente"
      | "entregado"
      | "reprogramado"
      | "incidencia"
      EstadoFeedback: "pendiente" | "revisado"
      EstadoFicha: "borrador" | "en_revision" | "aprobada" | "obsoleta"
      EstadoGuiaRemision:
      | "borrador"
      | "emitida"
      | "en_transito"
      | "entregada"
      | "anulada"
      EstadoOrdenCompra:
      | "pendiente"
      | "confirmada"
      | "parcialmente_recibida"
      | "completada"
      | "cancelada"
      EstadoOrdenProduccion:
      | "borrador"
      | "confirmada"
      | "en_produccion"
      | "pausada"
      | "completada"
      | "cancelada"
      EstadoPago: "pendiente" | "pagado" | "pago_parcial" | "anulado"
      EstadoPagoOrdenCompra: "pendiente" | "parcial" | "pagado"
      EstadoPagoTaller: "pendiente" | "pagado" | "anulado"
      EstadoPedido:
      | "pendiente"
      | "en_produccion"
      | "listo_para_despacho"
      | "entregado"
      | "cancelado"
      | "pagado"
      EstadoPersonal: "activo" | "inactivo" | "suspendido"
      EstadoProducto:
      | "activo"
      | "inactivo"
      | "agotado"
      | "descontinuado"
      | "en_produccion"
      EstadoTaller: "activo" | "inactivo" | "suspendido"
      EstadoUsuario: "activo" | "inactivo" | "suspendido"
      EtapaProduccion:
      | "diseno"
      | "patronaje"
      | "corte"
      | "confeccion"
      | "remallado"
      | "bordado_estampado"
      | "control_calidad"
      | "acabado"
      | "listo_entrega"
      MetodoPago:
      | "efectivo"
      | "transferencia_bcp"
      | "yape"
      | "plin"
      | "visa"
      | "mastercard"
      Moneda: "PEN" | "USD"
      MotivoDevolucion:
      | "defecto_fabrica"
      | "talla_incorrecta"
      | "error_envio"
      | "insatisfaccion"
      | "danado_transporte"
      | "otros"
      MotivoDevolucionProv:
      | "insumo_defectuoso"
      | "no_cumple_especificaciones"
      | "exceso_pedido"
      | "pedido_incompleto_danado"
      | "vencimiento"
      | "otros"
      PrioridadPedido: "baja" | "normal" | "alta" | "urgente"
      ReferenciaMovimiento:
      | "ORDEN_COMPRA"
      | "PEDIDO_CLIENTE"
      | "ORDEN_PRODUCCION"
      | "AJUSTE_MANUAL"
      | "MERMA_INCIDENCIA"
      | "DEVOLUCION"
      | "TRANSFERENCIA"
      | "INVENTARIO_INICIAL"
      ReferenciaNotificacion:
      | "PRODUCTO"
      | "COTIZACION"
      | "ORDEN_PRODUCCION"
      | "PAGO"
      | "PEDIDO"
      | "SISTEMA"
      | "DEVOLUCION"
      | "DESPACHO"
      | "CONFECCION"
      | "CLIENTE"
      | "INVENTARIO"
      | "COMPROBANTE"
      Rol:
      | "administrador"
      | "cortador"
      | "disenador"
      | "recepcionista"
      | "ayudante"
      | "representante_taller"
      | "cliente"
      | "gerente"
      | "almacenero"
      SeveridadIncidencia: "baja" | "media" | "alta" | "critica"
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
      TipoAsiento: "debe" | "haber"
      TipoBeneficio: "porcentaje_subtotal"
      TipoCliente: "corporativo" | "minorista" | "distribuidor" | "mayorista"
      TipoComprobante: "factura" | "boleta" | "nota_credito" | "nota_debito"
      TipoConteo: "modelos_distintos"
      TipoGuiaRemision:
      | "envio_taller"
      | "retorno_taller"
      | "despacho_cliente"
      | "devolucion_cliente"
      | "traslado_almacen"
      TipoIncidencia:
      | "averia_maquina"
      | "falta_material"
      | "error_diseno"
      | "defecto_corte"
      | "defecto_confeccion"
      | "retraso"
      | "otro"
      TipoIncidenciaCliente:
      | "defecto_confeccion"
      | "pedido_equivocado"
      | "talla_incorrecta"
      | "cantidad_incorrecta"
      | "dano_en_transporte"
      | "empaque_defectuoso"
      | "otro"
      TipoInsumo: "materia_prima" | "avio" | "empaque" | "suministro"
      TipoMaterial: "punto" | "plano" | "no_tejido" | "especial"
      TipoMovimiento:
      | "entrada"
      | "salida"
      | "ajuste"
      | "consumo_orden_produccion"
      | "consumo_orden_produccion_item"
      | "produccion_entrada"
      | "devolucion_consumo"
      | "devolucion_a_proveedor"
      | "recepcion_devolucion_proveedor"
      | "incidencia_taller"
      | "devolucion_a_cliente"
      | "recepcion_devolucion_cliente"
      | "transferencia_entrada"
      | "transferencia_salida"
      | "inventario_inicial"
      TipoNotificacion:
      | "stock_bajo"
      | "pedido_vencido"
      | "pago_pendiente"
      | "cotizacion_expirada"
      | "orden_produccion"
      | "confeccion_completada"
      | "devolucion_solicitada"
      | "sistema"
      | "cotizacion_aprobada"
      | "cotizacion_rechazada"
      | "pedido_confirmado"
      | "pedido_listo"
      | "pago_verificado"
      | "pago_rechazado"
      | "despacho_en_camino"
      | "cotizacion_creada"
      | "cotizacion_modificada"
      | "pedido_en_revision"
      | "pedido_modificado"
      | "pedido_cancelado"
      | "pedido_parcial"
      | "pago_parcial"
      | "nota_credito_emitida"
      | "orden_produccion_aprobada"
      | "orden_produccion_iniciada"
      | "orden_produccion_pausada"
      | "orden_produccion_cancelada"
      | "confeccion_iniciada"
      | "confeccion_en_proceso"
      | "confeccion_con_retraso"
      | "confeccion_observacion"
      | "stock_agotado"
      | "stock_repuesto"
      | "ingreso_tela"
      | "merma_registrada"
      | "ajuste_inventario"
      | "despacho_programado"
      | "despacho_preparando"
      | "despacho_entregado"
      | "despacho_fallido"
      | "despacho_devuelto"
      | "devolucion_aprobada"
      | "devolucion_rechazada"
      | "devolucion_recibida"
      | "cambio_solicitado"
      | "cambio_completado"
      | "cliente_nuevo"
      | "cuenta_bloqueada"
      | "cuenta_reactivada"
      | "documento_requerido"
      TipoPago: "adelanto" | "cuota" | "saldo_final" | "pago_completo"
      UnidadMedida:
      | "metros"
      | "unidades"
      | "conos"
      | "docenas"
      | "kilogramos"
      | "set"
      | "millares"
      ZonaEnvio: "Cercana a SJL" | "Zona media" | "Zona lejana"
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
      AccionAuditoria: [
        "crear",
        "actualizar",
        "eliminar",
        "aprobar",
        "rechazar",
        "anular",
      ],
      Cargo: [
        "administrador",
        "cortador",
        "disenador",
        "recepcionista",
        "ayudante",
        "representante_taller",
        "gerente",
        "almacenero",
      ],
      ColorPrenda: [
        "animal_print",
        "azul",
        "azulino",
        "beige",
        "blanco",
        "camel",
        "celeste",
        "cemento",
        "chocolate",
        "coral",
        "crema",
        "fucsia",
        "grafito",
        "gris",
        "guinda",
        "lila",
        "marron",
        "melange",
        "melon",
        "negro",
        "nude",
        "palo_rosa",
        "perla",
        "piton",
        "rojo",
        "rosa",
        "rose",
        "verde",
        "vino",
      ],
      CondicionProducto: [
        "perfecto_estado",
        "reproceso",
        "segunda",
        "merma",
        "sucio",
      ],
      CuentaContable: [
        "caja",
        "bancos",
        "cuentas_por_cobrar",
        "inventario",
        "ventas",
        "costo_ventas",
        "cuentas_por_pagar",
        "capital",
        "igv",
        "descuentos",
        "gastos_operativos",
      ],
      EspecialidadTaller: [
        "corte",
        "confeccion",
        "bordado",
        "estampado",
        "costura",
        "acabados",
        "otro",
      ],
      EstadoCategoria: ["activo", "inactivo"],
      EstadoCliente: ["activo", "inactivo", "suspendido", "potencial"],
      EstadoComprobante: ["pendiente", "enviado", "aceptado", "rechazado"],
      EstadoConfeccion: [
        "pendiente",
        "en_proceso",
        "completada",
        "rechazada",
        "cancelada",
      ],
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
        "en_almacen",
        "devuelto",
        "cancelado",
      ],
      EstadoDevolucion: [
        "pendiente",
        "en_revision",
        "aprobada",
        "rechazada",
        "completada",
        "anulada",
      ],
      EstadoDevolucionProv: [
        "pendiente_envio",
        "en_transito",
        "aceptado_proveedor",
        "rechazado_proveedor",
        "completado",
      ],
      EstadoEntrega: [
        "en_espera",
        "siguiente",
        "entregado",
        "reprogramado",
        "incidencia",
      ],
      EstadoFeedback: ["pendiente", "revisado"],
      EstadoFicha: ["borrador", "en_revision", "aprobada", "obsoleta"],
      EstadoGuiaRemision: [
        "borrador",
        "emitida",
        "en_transito",
        "entregada",
        "anulada",
      ],
      EstadoOrdenCompra: [
        "pendiente",
        "confirmada",
        "parcialmente_recibida",
        "completada",
        "cancelada",
      ],
      EstadoOrdenProduccion: [
        "borrador",
        "confirmada",
        "en_produccion",
        "pausada",
        "completada",
        "cancelada",
      ],
      EstadoPago: ["pendiente", "pagado", "pago_parcial", "anulado"],
      EstadoPagoOrdenCompra: ["pendiente", "parcial", "pagado"],
      EstadoPagoTaller: ["pendiente", "pagado", "anulado"],
      EstadoPedido: [
        "pendiente",
        "en_produccion",
        "listo_para_despacho",
        "entregado",
        "cancelado",
        "pagado",
      ],
      EstadoPersonal: ["activo", "inactivo", "suspendido"],
      EstadoProducto: [
        "activo",
        "inactivo",
        "agotado",
        "descontinuado",
        "en_produccion",
      ],
      EstadoTaller: ["activo", "inactivo", "suspendido"],
      EstadoUsuario: ["activo", "inactivo", "suspendido"],
      EtapaProduccion: [
        "diseno",
        "patronaje",
        "corte",
        "confeccion",
        "remallado",
        "bordado_estampado",
        "control_calidad",
        "acabado",
        "listo_entrega",
      ],
      MetodoPago: [
        "efectivo",
        "transferencia_bcp",
        "yape",
        "plin",
        "visa",
        "mastercard",
      ],
      Moneda: ["PEN", "USD"],
      MotivoDevolucion: [
        "defecto_fabrica",
        "talla_incorrecta",
        "error_envio",
        "insatisfaccion",
        "danado_transporte",
        "otros",
      ],
      MotivoDevolucionProv: [
        "insumo_defectuoso",
        "no_cumple_especificaciones",
        "exceso_pedido",
        "pedido_incompleto_danado",
        "vencimiento",
        "otros",
      ],
      PrioridadPedido: ["baja", "normal", "alta", "urgente"],
      ReferenciaMovimiento: [
        "ORDEN_COMPRA",
        "PEDIDO_CLIENTE",
        "ORDEN_PRODUCCION",
        "AJUSTE_MANUAL",
        "MERMA_INCIDENCIA",
        "DEVOLUCION",
        "TRANSFERENCIA",
        "INVENTARIO_INICIAL",
      ],
      ReferenciaNotificacion: [
        "PRODUCTO",
        "COTIZACION",
        "ORDEN_PRODUCCION",
        "PAGO",
        "PEDIDO",
        "SISTEMA",
        "DEVOLUCION",
        "DESPACHO",
        "CONFECCION",
        "CLIENTE",
        "INVENTARIO",
        "COMPROBANTE",
      ],
      Rol: [
        "administrador",
        "cortador",
        "disenador",
        "recepcionista",
        "ayudante",
        "representante_taller",
        "cliente",
        "gerente",
        "almacenero",
      ],
      SeveridadIncidencia: ["baja", "media", "alta", "critica"],
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
      TipoAsiento: ["debe", "haber"],
      TipoBeneficio: ["porcentaje_subtotal"],
      TipoCliente: ["corporativo", "minorista", "distribuidor", "mayorista"],
      TipoComprobante: ["factura", "boleta", "nota_credito", "nota_debito"],
      TipoConteo: ["modelos_distintos"],
      TipoGuiaRemision: [
        "envio_taller",
        "retorno_taller",
        "despacho_cliente",
        "devolucion_cliente",
        "traslado_almacen",
      ],
      TipoIncidencia: [
        "averia_maquina",
        "falta_material",
        "error_diseno",
        "defecto_corte",
        "defecto_confeccion",
        "retraso",
        "otro",
      ],
      TipoIncidenciaCliente: [
        "defecto_confeccion",
        "pedido_equivocado",
        "talla_incorrecta",
        "cantidad_incorrecta",
        "dano_en_transporte",
        "empaque_defectuoso",
        "otro",
      ],
      TipoInsumo: ["materia_prima", "avio", "empaque", "suministro"],
      TipoMaterial: ["punto", "plano", "no_tejido", "especial"],
      TipoMovimiento: [
        "entrada",
        "salida",
        "ajuste",
        "consumo_orden_produccion",
        "consumo_orden_produccion_item",
        "produccion_entrada",
        "devolucion_consumo",
        "devolucion_a_proveedor",
        "recepcion_devolucion_proveedor",
        "incidencia_taller",
        "devolucion_a_cliente",
        "recepcion_devolucion_cliente",
        "transferencia_entrada",
        "transferencia_salida",
        "inventario_inicial",
      ],
      TipoNotificacion: [
        "stock_bajo",
        "pedido_vencido",
        "pago_pendiente",
        "cotizacion_expirada",
        "orden_produccion",
        "confeccion_completada",
        "devolucion_solicitada",
        "sistema",
        "cotizacion_aprobada",
        "cotizacion_rechazada",
        "pedido_confirmado",
        "pedido_listo",
        "pago_verificado",
        "pago_rechazado",
        "despacho_en_camino",
        "cotizacion_creada",
        "cotizacion_modificada",
        "pedido_en_revision",
        "pedido_modificado",
        "pedido_cancelado",
        "pedido_parcial",
        "pago_parcial",
        "nota_credito_emitida",
        "orden_produccion_aprobada",
        "orden_produccion_iniciada",
        "orden_produccion_pausada",
        "orden_produccion_cancelada",
        "confeccion_iniciada",
        "confeccion_en_proceso",
        "confeccion_con_retraso",
        "confeccion_observacion",
        "stock_agotado",
        "stock_repuesto",
        "ingreso_tela",
        "merma_registrada",
        "ajuste_inventario",
        "despacho_programado",
        "despacho_preparando",
        "despacho_entregado",
        "despacho_fallido",
        "despacho_devuelto",
        "devolucion_aprobada",
        "devolucion_rechazada",
        "devolucion_recibida",
        "cambio_solicitado",
        "cambio_completado",
        "cliente_nuevo",
        "cuenta_bloqueada",
        "cuenta_reactivada",
        "documento_requerido",
      ],
      TipoPago: ["adelanto", "cuota", "saldo_final", "pago_completo"],
      UnidadMedida: [
        "metros",
        "unidades",
        "conos",
        "docenas",
        "kilogramos",
        "set",
        "millares",
      ],
      ZonaEnvio: ["Cercana a SJL", "Zona media", "Zona lejana"],
    },
  },
} as const

