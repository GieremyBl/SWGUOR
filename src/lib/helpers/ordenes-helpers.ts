import { EstadoOrden, MetodoPago } from "@/types";

export const OrdenesHelper = {
  /**
   * Calcula el total de fabricación basado en los productos seleccionados
   */
  calcularTotalVenta: (items: Array<{ precio_unitario: number; cantidad: number }>) => {
    const total = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    return parseFloat(total.toFixed(2));
  },

  /**
   * Ajusta los datos para que coincidan EXACTAMENTE con tu esquema SQL
   * Resuelve el error de "transferencia" vs "transferencia_bcp"
   */
prepararParaInsertar: (formData: any, totalCalculado: number) => {
    // Definimos el método de pago asegurando que sea del tipo MetodoPago o null
    const metodo: MetodoPago = formData.metodo_pago === 'transferencia' 
      ? 'transferencia_bcp' 
      : (formData.metodo_pago as MetodoPago);

    return {
      cliente_id: formData.cliente_id ? Number(formData.cliente_id) : null,
      cotizacion_id: formData.cotizacion_id ? Number(formData.cotizacion_id) : null,
      user_id: formData.user_id,
      estado: (formData.estado as EstadoOrden) || 'solicitado',
      metodo_pago: metodo, // Ahora TypeScript sabe que es un MetodoPago válido
      total_pagado: totalCalculado,
      fecha_prometida_entrega: formData.fecha_entrega || null,
      estado_pago: 'pendiente'
    };
  }
};