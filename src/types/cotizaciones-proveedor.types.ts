import type { Prisma } from '@prisma/client';

export const COTIZACION_PROVEEDOR_INCLUDE = {
  proveedores: {
    select: {
      id: true,
      razon_social: true,
      ruc: true,
      email: true,
      telefono: true,
      contacto: true,
    },
  },
  cotizaciones_proveedor_items: {
    orderBy: { id: 'asc' as const },
    include: {
      materiales: { select: { id: true, nombre: true } },
      insumo: { select: { id: true, nombre: true } },
    },
  },
  ordenes_compra: {
    select: { id: true, estado: true, total_orden: true },
    take: 5,
    orderBy: { created_at: 'desc' as const },
  },
} satisfies Prisma.cotizaciones_proveedorInclude;

export type CotizacionProveedorDetalle = Prisma.cotizaciones_proveedorGetPayload<{
  include: typeof COTIZACION_PROVEEDOR_INCLUDE;
}>;
