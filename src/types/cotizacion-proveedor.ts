export interface ProveedorData {
  razon_social: string | null;
  ruc: string | null;
}

export interface CotizacionRow {
  id: string | number;
  numero_externo: string | null;
  total_estimado: number | string;
  moneda: string | null;
  fecha_solicitud: string;
  estado: string;
  proveedores: ProveedorData | null;
}

// Representa el detalle completo que requiere tu componente de UI
export interface CotizacionDetalleData extends CotizacionRow {
  // Aquí puedes añadir campos específicos del detalle si existen en el futuro
}

export interface PaginationData {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

// Formato de respuesta estándar de tu servidor
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationData;
  error?: string;
}