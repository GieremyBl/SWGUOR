import type { Prisma } from '@prisma/client';

export const ORDEN_COMPRA_INCLUDE = {
  proveedores: {
    select: {
      id: true,
      razon_social: true,
      ruc: true,
      email: true,
      telefono: true,
      contacto: true,
      direccion: true,
    },
  },
  cotizaciones_proveedor: {
    select: {
      id: true,
      numero_externo: true,
      estado: true,
      total_estimado: true,
      moneda: true,
    },
  },
  ordenes_compra_items: {
    include: {
      materiales: { select: { id: true, nombre: true, unidad_medida: true } },
      insumo: { select: { id: true, nombre: true, unidad_medida: true } },
    },
  },
} satisfies Prisma.ordenes_compraInclude;

export type OrdenCompraDetalle = Prisma.ordenes_compraGetPayload<{
  include: typeof ORDEN_COMPRA_INCLUDE;
}>;
