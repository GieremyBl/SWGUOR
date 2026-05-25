export interface OrdenCompraItemRow {
  id: number;
  material_id: number | null;
  insumo_id: number | null;
  cantidad_pedida: number;
  cantidad_recibida: number;
  precio_unitario: number;
  subtotal: number | null;
  notas: string | null;
  materiales?: { id: number; nombre: string; unidad_medida: string } | null;
  insumo?: { id: number; nombre: string; unidad_medida: string } | null;
}

export interface OrdenCompraRow {
  id: number;
  cotizacion_proveedor_id: number | null;
  proveedor_id: number;
  creado_por: string | null;
  estado: string;
  estado_pago: string;
  total_orden: number;
  total_pagado: number;
  saldo_pendiente: number | null;
  fecha_prometida: string | null;
  fecha_recepcion: string | null;
  notas: string | null;
  created_at: string | null;
  updated_at: string | null;
  pdf_url?: string | null;
  proveedores?: {
    id: number;
    razon_social: string;
    ruc: string;
    email: string;
    telefono?: string;
    contacto?: string;
    direccion?: string;
  };
  cotizaciones_proveedor?: {
    id: number;
    numero_externo: string | null;
    estado: string;
    total_estimado: number;
    moneda: string | null;
  } | null;
  ordenes_compra_items?: OrdenCompraItemRow[];
}
