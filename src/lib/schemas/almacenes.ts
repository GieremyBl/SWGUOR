import { z } from 'zod';

export const almacenBaseSchema = z.object({
  id: z.bigint().positive(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(255),
  direccion: z.string().max(255).nullable().optional(),
  telefono: z.string().max(255).nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  descripcion: z.string().nullable().optional(),
  responsable_id: z.bigint().positive().nullable().optional(),
  capacidad_total: z.number().nonnegative('La capacidad debe ser positiva').nullable().optional(),
  unidad_capacidad: z.string().default('unidades'),
  estado: z.string().default('activo'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const crearAlmacenSchema = almacenBaseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const actualizarAlmacenSchema = crearAlmacenSchema.partial();

export const obtenerAlmacenesSchema = z.object({
  filtro: z
    .object({
      estado: z.string().optional(),
      responsable_id: z.bigint().positive().optional(),
    })
    .optional(),
  paginacion: z
    .object({
      pagina: z.number().int().positive().default(1),
      limite: z.number().int().positive().default(10),
    })
    .optional(),
});

export const consultaCapacidadSchema = z.object({
  almacenId: z.bigint().positive(),
});

export type Almacen = z.infer<typeof almacenBaseSchema>;
export type CrearAlmacen = z.infer<typeof crearAlmacenSchema>;
export type ActualizarAlmacen = z.infer<typeof actualizarAlmacenSchema>;