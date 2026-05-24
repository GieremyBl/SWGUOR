// src/lib/schemas/categoriasSchema.ts
import { z } from 'zod';

// ── Schema base ───────────────────────────────────────────────────────────────

export const categoriaSchema = z.object({
    nombre: z
        .string({ error: 'El nombre es obligatorio' })
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede superar los 100 caracteres')
        .trim(),

    descripcion: z
        .string()
        .max(500, 'La descripción no puede superar los 500 caracteres')
        .trim()
        .nullable()
        .optional(),

    activo: z
        .boolean()
        .default(true),

    imagen_url: z
        .string()
        .url('La URL de imagen no es válida')
        .nullable()
        .optional(),

    slug: z
        .string()
        .max(120, 'El slug no puede superar los 120 caracteres')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones')
        .nullable()
        .optional(),

    orden: z
        .number({ error: 'El orden debe ser un número' })
        .int('El orden debe ser un número entero')
        .nonnegative('El orden no puede ser negativo')
        .default(0),
});

// ── Schema para crear ─────────────────────────────────────────────────────────

export const crearCategoriaSchema = categoriaSchema;

// ── Schema para actualizar (todos los campos opcionales) ──────────────────────

export const actualizarCategoriaSchema = categoriaSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Debe enviar al menos un campo para actualizar' }
);

// ── Schema para el ID en params ───────────────────────────────────────────────

export const categoriaIdSchema = z.object({
    id: z
        .string({ error: 'El ID es obligatorio' })
        .regex(/^\d+$/, 'El ID debe ser un número válido'),
});

// ── Schema para filtros de búsqueda ──────────────────────────────────────────

export const categoriaFiltrosSchema = z.object({
    busqueda: z.string().trim().optional(),
    activo: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
});

// ── Tipos inferidos ───────────────────────────────────────────────────────────

export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
export type ActualizarCategoriaInput = z.infer<typeof actualizarCategoriaSchema>;
export type CategoriaId = z.infer<typeof categoriaIdSchema>;
export type CategoriaFiltros = z.infer<typeof categoriaFiltrosSchema>;