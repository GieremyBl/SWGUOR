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

export const stripeConfirmRequestSchema = z
  .object({
    metodo_pago: z.literal('stripe').optional().default('stripe'),
    pedido_id: z.union([z.number(), z.string()]).transform((v) => Number(v)),
    email: z.string().trim().email('Correo del cliente inválido'),
    payment_intent_id: z.string().trim().min(1, 'payment_intent_id requerido'),
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
    metodo_pago: 'stripe' as const,
    pedido_id: data.pedido_id,
    email: data.email,
    payment_intent_id: data.payment_intent_id,
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

export type StripeConfirmRequest = z.infer<typeof stripeConfirmRequestSchema>;
