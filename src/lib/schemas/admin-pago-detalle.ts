export interface AdminPagoDetalleComprobante {
  id: string;
  tipo: string;
  serie: string;
  correlativo: string;
  numero_completo: string | null;
  subtotal: number;
  igv: number;
  total: number;
  moneda: string;
  estado_sunat: string;
  fecha_emision: string;
  pdf_url: string | null;
  xml_url: string | null;
  cdr_url: string | null;
}

export interface AdminPagoDetallePedidoItem {
  cantidad: number;
  subtotal: number;
  producto_nombre: string;
  producto_sku: string | null;
}

export interface AdminPagoDetallePedido {
  id: number;
  estado: string | null;
  created_at: string | null;
  total: number;
  monto_pagado: number;
  saldo_pendiente: number;
  moneda: string;
  total_unidades: number;
  items_count: number;
  items: AdminPagoDetallePedidoItem[];
  cliente: {
    id: number;
    ruc: string;
    razon_social: string | null;
    nombre_comercial: string | null;
    email: string | null;
    telefono: string | null;
  } | null;
}

export interface AdminPagoDetalleUsuario {
  id: number;
  nombre_completo: string;
}

export interface AdminPagoDetalle {
  id_uuid: string;
  pedido_id: number;
  monto: number;
  metodo_pago: string;
  tipo: string;
  estado: string;
  fecha_pago: string;
  notas: string | null;
  verificado_at: string | null;
  usuario: AdminPagoDetalleUsuario | null;
  verificado_por_usuario: AdminPagoDetalleUsuario | null;
  pedido: AdminPagoDetallePedido;
  comprobante: AdminPagoDetalleComprobante | null;
}
