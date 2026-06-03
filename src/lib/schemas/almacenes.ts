import { z } from 'zod';

// ══════════════════════════════════════════════════════
// ALMACENES
// ══════════════════════════════════════════════════════

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
  filtro: z.object({
    estado: z.string().optional(),
    responsable_id: z.bigint().positive().optional(),
  }).optional(),
  paginacion: z.object({
    pagina: z.number().int().positive().default(1),
    limite: z.number().int().positive().default(10),
  }).optional(),
});

export const consultaCapacidadSchema = z.object({
  almacenId: z.bigint().positive(),
});

export type Almacen = z.infer<typeof almacenBaseSchema>;
export type CrearAlmacen = z.infer<typeof crearAlmacenSchema>;
export type ActualizarAlmacen = z.infer<typeof actualizarAlmacenSchema>;

// ══════════════════════════════════════════════════════
// ALMACEN ZONAS
// ══════════════════════════════════════════════════════

export const almacenZonaBaseSchema = z.object({
  id: z.bigint().positive(),
  almacen_id: z.bigint().positive(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(255),
  descripcion: z.string().nullable().optional(),
  activo: z.boolean().optional(),
  created_at: z.date().optional(),
});

export const crearZonaSchema = almacenZonaBaseSchema.omit({
  id: true,
  almacen_id: true,
  created_at: true,
}).extend({
  telefono: z
    .string()
    .regex(/^\d{9}$/, 'El teléfono debe tener exactamente 9 dígitos numéricos')
    .nullable()
    .optional(),

  direccion: z
    .string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(255, 'La dirección no puede superar los 255 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.,#\-\/]+$/, 'La dirección contiene caracteres no permitidos')
    .nullable()
    .optional(),
});

export const actualizarZonaSchema = crearZonaSchema.partial();

export type AlmacenZona = z.infer<typeof almacenZonaBaseSchema>;
export type CrearZona = z.infer<typeof crearZonaSchema>;
export type ActualizarZona = z.infer<typeof actualizarZonaSchema>;

// ══════════════════════════════════════════════════════
// ALMACEN STOCK
// ══════════════════════════════════════════════════════

// Tipo de ítem — exactamente uno debe estar presente (refleja chk_un_solo_item)
const itemStockSchema = z.union([
  z.object({
    producto_id: z.bigint().positive(),
    insumo_id: z.null().optional(),
    material_id: z.null().optional(),
  }),
  z.object({
    producto_id: z.null().optional(),
    insumo_id: z.bigint().positive(),
    material_id: z.null().optional(),
  }),
  z.object({
    producto_id: z.null().optional(),
    insumo_id: z.null().optional(),
    material_id: z.bigint().positive(),
  }),
]);

export const almacenStockBaseSchema = z.object({
  id: z.bigint().positive(),
  almacen_id: z.bigint().positive(),
  zona_id: z.bigint().positive().nullable().optional(),
  producto_id: z.bigint().positive().nullable().optional(),
  insumo_id: z.bigint().positive().nullable().optional(),
  material_id: z.bigint().positive().nullable().optional(),
  cantidad: z.number().nonnegative('La cantidad no puede ser negativa'),
  stock_minimo: z.number().nonnegative().nullable().optional().default(0),
  updated_at: z.date().optional(),
});

export const crearStockSchema = almacenStockBaseSchema
  .omit({
    id: true,
    almacen_id: true,
    updated_at: true,
  })
  .and(itemStockSchema)
  .refine(
    (data) => {
      const count = [data.producto_id, data.insumo_id, data.material_id]
        .filter(Boolean).length;
      return count === 1;
    },
    {
      message: 'Debe especificarse exactamente un tipo de ítem: producto, insumo o material',
      path: ['producto_id'],
    }
  );

export const actualizarStockSchema = almacenStockBaseSchema
  .omit({
    id: true,
    almacen_id: true,
    updated_at: true,
  })
  .partial()
  .refine(
    (data) => {
      const ids = [data.producto_id, data.insumo_id, data.material_id].filter(v => v != null);
      // En update es válido no enviar ningún ID (solo cambiar cantidad/zona)
      return ids.length === 0 || ids.length === 1;
    },
    { message: 'Solo puede especificarse un tipo de ítem a la vez', path: ['producto_id'] }
  );

// Para movimientos de stock (entrada/salida)
export const ajustarStockSchema = z.object({
  zona_id: z.bigint().positive().nullable().optional(),
  producto_id: z.bigint().positive().nullable().optional(),
  insumo_id: z.bigint().positive().nullable().optional(),
  material_id: z.bigint().positive().nullable().optional(),
  cantidad: z.number({ error: 'La cantidad es requerida' }).positive(),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  motivo: z.string().max(500).optional(),
}).refine(
  (data) => {
    const count = [data.producto_id, data.insumo_id, data.material_id].filter(Boolean).length;
    return count === 1;
  },
  { message: 'Debe especificarse exactamente un tipo de ítem', path: ['producto_id'] }
);

export type AlmacenStock = z.infer<typeof almacenStockBaseSchema>;
export type CrearStock = z.infer<typeof crearStockSchema>;
export type ActualizarStock = z.infer<typeof actualizarStockSchema>;
export type AjustarStock = z.infer<typeof ajustarStockSchema>;
