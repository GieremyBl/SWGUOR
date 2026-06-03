import { z } from 'zod';

export const TipoAsientoEnum = z.enum(['debe', 'haber']);

export const CuentaContableEnum = z.enum([
  'caja',
  'bancos',
  'cuentas_por_cobrar',
  'inventario',
  'ventas',
  'costo_ventas',
  'cuentas_por_pagar',
  'capital',
  'igv',
  'descuentos',
  'gastos_operativos',
]);

export const asientoContableBaseSchema = z.object({
  id: z.number().int().positive(),
  fecha: z.date(),
  tipo: TipoAsientoEnum,
  monto: z.number().nonnegative(),
  cuenta: CuentaContableEnum,
  descripcion: z.string().nullable().optional(),
  pedido_id: z.number().int().positive().nullable().optional(),
  pago_id: z.number().int().positive().nullable().optional(),
  usuario_id: z.number().int().positive().nullable().optional(),
  created_at: z.date(),
});

export const crearAsientoContableSchema = asientoContableBaseSchema.omit({
  id: true,
  created_at: true,
});

export const obtenerAsientosSchema = z.object({
  filtro: z
    .object({
      tipo: TipoAsientoEnum.optional(),
      cuenta: CuentaContableEnum.optional(),
      pedido_id: z.number().int().positive().optional(),
      pago_id: z.number().int().positive().optional(),
      desde: z.date().optional(),
      hasta: z.date().optional(),
    })
    .optional(),
  paginacion: z
    .object({
      pagina: z.number().int().positive().default(1),
      limite: z.number().int().positive().default(20),
    })
    .optional(),
});

export type TipoAsiento = z.infer<typeof TipoAsientoEnum>;
export type CuentaContable = z.infer<typeof CuentaContableEnum>;
export type AsientoContable = z.infer<typeof asientoContableBaseSchema>;
export type CrearAsientoContable = z.infer<typeof crearAsientoContableSchema>;
export type DetalleAsiento = AsientoContable & {
  usuario: {
    id: number;
    nombre: string;
    email: string;
  } | null;
};

export const ESTADO_ASIENTO = [
  "pendiente",
  "confirmado",
  "anulado",
] as const;

export type EstadoAsiento = typeof ESTADO_ASIENTO[number];

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
