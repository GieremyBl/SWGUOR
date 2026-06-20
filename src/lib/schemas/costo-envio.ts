import { z } from 'zod';
import { ZONAS_ENVIO_DISPONIBLES } from '@/lib/constants/costo-envio';

export const ZonaEnvioInputEnum = z.enum(ZONAS_ENVIO_DISPONIBLES);

export const crearCostoEnvioSchema = z.object({
  zona: z.union([ZonaEnvioInputEnum, z.string().min(1)]),
  costo: z.number().positive('El costo debe ser mayor a cero'),
  activo: z.boolean().default(true),
});

export const actualizarCostoEnvioSchema = z.object({
  costo: z.number().positive('El costo debe ser mayor a cero').optional(),
  activo: z.boolean().optional(),
});

export type CrearCostoEnvioInput = z.infer<typeof crearCostoEnvioSchema>;
export type ActualizarCostoEnvioInput = z.infer<typeof actualizarCostoEnvioSchema>;

export interface CostoEnvioFila {
  id: number;
  zona: string;
  costo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
