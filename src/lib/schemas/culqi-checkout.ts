import { z } from 'zod';
import { datosPagadorCheckoutSchema } from '@/lib/schemas/datos-pagador-pago';

const montoSolesField = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .optional();

export const culqiCheckoutRequestSchema = z
  .object({
    metodo_pago: z.literal('culqi').optional().default('culqi'),
    pedido_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    email: z.string().trim().email('Correo del cliente inválido'),
    /** Token de tarjeta/Yape generado por Culqi Checkout */
    token: z.string().trim().optional(),
    source_id: z.string().trim().optional(),
    description: z.string().trim().optional(),
    /** Monto a cobrar hoy en soles (validado contra saldo_pendiente en servidor) */
    monto_a_pagar: montoSolesField,
    /** Alias retrocompatible */
    monto: montoSolesField,
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
  })
  .refine((data) => Boolean(data.token || data.source_id), {
    message: 'Token o source_id de Culqi requerido',
    path: ['token'],
  })
  .refine((data) => Number.isFinite(data.pedido_id) && data.pedido_id > 0, {
    message: 'ID de pedido inválido',
    path: ['pedido_id'],
  })
  .transform((data) => ({
    metodo_pago: 'culqi' as const,
    pedido_id: data.pedido_id,
    email: data.email,
    token: data.token,
    source_id: data.source_id,
    description: data.description,
    monto_a_pagar: data.monto_a_pagar ?? data.monto,
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

export type CulqiCheckoutRequest = z.infer<typeof culqiCheckoutRequestSchema>;

export interface CulqiCheckoutSuccessData {
  pedido_id: number;
  pago_id: string;
  comprobante_id: string;
  numero_comprobante: string | null;
  pedido_estado: string | null;
  culqi_charge_id: string;
  redirect_url: string;
  monto_cobrado: number;
  monto_pagado: number;
  saldo_pendiente: number;
  pago_completo: boolean;
}

export interface CulqiCheckoutSuccessResponse {
  success: true;
  message: string;
  code: string;
  data: CulqiCheckoutSuccessData;
}

export interface CulqiCheckoutErrorResponse {
  success: false;
  message: string;
  code: string;
}
