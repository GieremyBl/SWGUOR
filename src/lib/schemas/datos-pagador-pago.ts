import { z } from 'zod';
import { PAIS_DEFAULT_ENTREGA } from '@/lib/constants/direccion-entrega';

export const datosPagadorPagoSchema = z.object({
  nombres: z.string().trim().min(2, 'Ingresa tus nombres'),
  apellidos: z.string().trim().min(2, 'Ingresa tus apellidos'),
  telefono: z
    .string()
    .trim()
    .min(9, 'Teléfono inválido')
    .max(15, 'Teléfono demasiado largo')
    .regex(/^[\d+\s()-]+$/, 'Teléfono inválido'),
  usuarioId: z.number().int().positive().optional(),
  direccion: z.string().trim().min(5, 'Ingresa la dirección de facturación'),
  ubicacion: z.string().trim().min(2, 'Ingresa ciudad o distrito'),
  countryCode: z.string().length(2).default(PAIS_DEFAULT_ENTREGA),
});

export type DatosPagadorPago = z.infer<typeof datosPagadorPagoSchema>;

export const DATOS_PAGADOR_PAGO_INICIAL: DatosPagadorPago = {
  nombres: '',
  apellidos: '',
  telefono: '',
  direccion: '',
  ubicacion: '',
  countryCode: PAIS_DEFAULT_ENTREGA,
};

/** Payload plano para APIs de checkout (snake_case) */
export const datosPagadorCheckoutSchema = z.object({
  pagador_nombres: z.string().trim().min(2),
  pagador_apellidos: z.string().trim().min(2),
  pagador_telefono: z.string().trim().min(9).max(15),
  pagador_usuario_id: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .optional(),
  pagador_direccion: z.string().trim().min(5),
  pagador_ubicacion: z.string().trim().min(2),
  pagador_country_code: z.string().length(2).optional(),
});

export type DatosPagadorCheckout = z.infer<typeof datosPagadorCheckoutSchema>;
