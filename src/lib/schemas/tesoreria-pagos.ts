import { z } from 'zod';
import {
  ESTADOS_TESORERIA_LABELS,
  TESORERIA_PAGOS_PAGE_SIZE_DEFAULT,
} from '@/lib/constants/tesoreria-pagos';

export const tesoreriaPagosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(TESORERIA_PAGOS_PAGE_SIZE_DEFAULT),
  busqueda: z.string().trim().optional(),
  estado: z
    .enum(Object.keys(ESTADOS_TESORERIA_LABELS) as [string, ...string[]])
    .default('todos'),
  metodo_pago: z.string().trim().optional(),
  fecha_desde: z.string().trim().optional(),
  fecha_hasta: z.string().trim().optional(),
});

export type TesoreriaPagosQuery = z.infer<typeof tesoreriaPagosQuerySchema>;

export interface TesoreriaPagoComprobante {
  id: string;
  numero_completo: string | null;
  serie: string;
  correlativo: string;
  tipo: string;
  estado_sunat: string;
}

export interface TesoreriaPagoFila {
  id_uuid: string;
  pedido_id: number;
  monto: number;
  metodo_pago: string;
  tipo: string;
  estado: string;
  estado_tesoreria: 'exitoso' | 'pendiente' | 'fallido';
  fecha_pago: string;
  notas: string | null;
  verificado_at: string | null;
  cliente: {
    id: number;
    razon_social: string | null;
    nombre_comercial: string | null;
    ruc: string;
  } | null;
  pedido: {
    id: number;
    estado: string | null;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
  };
  comprobante: TesoreriaPagoComprobante | null;
}

export interface TesoreriaPagosStats {
  total: number;
  exitosos: number;
  pendientes: number;
  fallidos: number;
  monto_exitoso: number;
}

export interface TesoreriaPagosListResponse {
  success: true;
  data: TesoreriaPagoFila[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: TesoreriaPagosStats;
}
