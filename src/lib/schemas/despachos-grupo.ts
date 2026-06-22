import { z } from 'zod';

export const agruparDespachosSchema = z.object({
  despacho_ids: z
    .array(z.union([z.string(), z.number()]))
    .min(2, 'Selecciona al menos 2 despachos para agrupar'),
  paradas: z
    .array(
      z.object({
        despacho_id: z.union([z.string(), z.number()]),
        numero_parada: z.number().int().min(1),
      }),
    )
    .optional(),
});

export type AgruparDespachosInput = z.infer<typeof agruparDespachosSchema>;
