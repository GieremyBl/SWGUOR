import { z } from 'zod';

export const pagoConfirmacionQuerySchema = z.object({
  pedido_id: z.string().trim().min(1),
  comprobante_id: z.string().uuid('ID de comprobante inválido'),
});

export interface PagoConfirmacionResumen {
  pedido: {
    id: number;
    estado: string | null;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    moneda: string;
  };
  pago: {
    id: string;
    monto: number;
    metodo_pago: string;
    fecha_pago: string;
    estado: string;
    culqi_charge_id: string | null;
  };
  comprobante: {
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
  };
  cliente: {
    razon_social: string | null;
    ruc: string;
  };
}

export interface PagoConfirmacionResponse {
  success: true;
  data: PagoConfirmacionResumen;
}
