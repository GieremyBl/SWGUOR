import { z } from 'zod';
import { datosPagadorCheckoutSchema } from '@/lib/schemas/datos-pagador-pago';

const montoField = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .optional();

const pagadorFields = {
  pagador_nombres: z.string().trim().min(2, 'Nombres del pagador requeridos'),
  pagador_apellidos: z.string().trim().min(2, 'Apellidos del pagador requeridos'),
  pagador_telefono: z.string().trim().min(9, 'Teléfono del pagador requerido'),
  pagador_usuario_id: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .optional(),
  pagador_direccion: z.string().trim().min(5, 'Dirección del pagador requerida'),
  pagador_ubicacion: z.string().trim().min(2, 'Ubicación del pagador requerida'),
  pagador_country_code: z.string().length(2).optional(),
};

export const mercadoPagoChargeRequestSchema = z
  .object({
    pedido_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    email: z.string().trim().email('Correo del cliente inválido'),
    token: z.string().trim().min(1, 'Token de tarjeta requerido'),
    payment_method_id: z.string().trim().min(1, 'payment_method_id requerido'),
    installments: z
      .union([z.number(), z.string()])
      .transform((v) => Number(v))
      .optional(),
    issuer_id: z
      .union([z.number(), z.string()])
      .transform((v) => Number(v))
      .optional(),
    monto_a_pagar: montoField,
    monto: montoField,
    description: z.string().trim().optional(),
    ...pagadorFields,
  })
  .refine((data) => Number.isFinite(data.pedido_id) && data.pedido_id > 0, {
    message: 'ID de pedido inválido',
    path: ['pedido_id'],
  })
  .transform((data) => ({
    pedido_id: data.pedido_id,
    email: data.email,
    token: data.token,
    payment_method_id: data.payment_method_id,
    installments: Number.isFinite(data.installments) && data.installments! > 0
      ? data.installments!
      : 1,
    issuer_id: Number.isFinite(data.issuer_id) ? data.issuer_id : undefined,
    monto_a_pagar: data.monto_a_pagar ?? data.monto,
    description: data.description,
    pagador: datosPagadorCheckoutSchema.parse({
      pagador_nombres: data.pagador_nombres,
      pagador_apellidos: data.pagador_apellidos,
      pagador_telefono: data.pagador_telefono,
      pagador_usuario_id: data.pagador_usuario_id,
      pagador_direccion: data.pagador_direccion,
      pagador_ubicacion: data.pagador_ubicacion,
      pagador_country_code: data.pagador_country_code,
    }),
  }));

export type MercadoPagoChargeRequest = z.infer<typeof mercadoPagoChargeRequestSchema>;

export interface MercadoPagoChargeSuccessResponse {
  success: true;
  message: string;
  code: string;
  data: {
    pedido_id: number;
    pago_id: string;
    comprobante_id: string;
    numero_comprobante: string | null;
    pedido_estado: string | null;
    mercadopago_payment_id: number;
    mercadopago_status: string;
    estado_pago: string;
    redirect_url: string;
    monto_cobrado: number;
    monto_pagado: number;
    saldo_pendiente: number;
    pago_completo: boolean;
  };
}

export interface MercadoPagoChargePendingResponse {
  success: false;
  message: string;
  code: string;
  estado_pago: string;
  mercadopago_status: string;
  mercadopago_payment_id?: number;
}

export interface MercadoPagoChargeErrorResponse {
  success: false;
  message: string;
  code: string;
  estado_pago?: string;
  mercadopago_status?: string;
}
