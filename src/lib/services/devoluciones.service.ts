import { createClient } from "@/lib/supabase/server";

export const DevolucionesService = {
  // Listar devoluciones de clientes
  async listar(filtros?: {
    estado?: string;
    cliente_id?: number;
  }) {
    const supabase = await createClient();
    
    let query = supabase
      .from("devoluciones_cliente")
      .select(`
        *,
        cliente:clientes (id, razon_social, nombre_comercial, email),
        producto:productos (id, nombre, sku),
        variante:variantes_producto (id, talla, color),
        pedido:pedidos (id, fecha_pedido, total),
        procesado_por:usuarios (id, email)
      `)
      .order("created_at", { ascending: false });

    if (filtros?.estado && filtros.estado !== "todos") {
      query = query.eq("estado_solicitud", filtros.estado);
    }
    if (filtros?.cliente_id) {
      query = query.eq("cliente_id", filtros.cliente_id);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  },

  // Obtener una devolución por ID
  async obtenerPorId(id: number) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("devoluciones_cliente")
      .select(`
        *,
        cliente:clientes (*),
        producto:productos (*),
        variante:variantes_producto (*),
        pedido:pedidos (*),
        procesado_por:usuarios (*)
      `)
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Actualizar estado de devolución (aprobar/rechazar)
  async actualizarEstado(
    id: number, 
    estado: string, 
    notas_internas?: string,
    monto_reembolsado?: number,
    procesado_por?: number
  ) {
    const supabase = await createClient();
    
    const updateData: any = {
      estado_solicitud: estado,
      notas_internas: notas_internas,
      procesado_por: procesado_por,
      updated_at: new Date().toISOString(),
    };

    if (estado === "aprobada" || estado === "completada") {
      updateData.fecha_finalizacion = new Date().toISOString();
    }
    if (monto_reembolsado !== undefined) {
      updateData.monto_reembolsado = monto_reembolsado;
    }

    const { data, error } = await supabase
      .from("devoluciones_cliente")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};