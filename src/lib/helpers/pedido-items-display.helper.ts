import type { PedidoItem } from '@/components/admin/pedidos/detalles/types';

type ItemConRelaciones = {
  id: bigint | number | string;
  cantidad: number;
  especificaciones?: unknown;
  productos?: {
    id: bigint | number | string;
    nombre: string;
    sku: string | null;
    imagen: string | null;
  } | null;
  variantes_producto?: {
    id: bigint | number | string;
    color: string | null;
    talla: string | null;
    sku: string | null;
  } | null;
};

type CotizacionItemConRelaciones = {
  id: bigint | number | string;
  cantidad: number;
  precio_unitario_snapshot: unknown;
  subtotal: unknown;
  color_snapshot: string;
  talla_snapshot: string;
  productos?: { id: unknown; nombre: string; sku: string | null; imagen: string | null } | null;
  variantes_producto?: {
    id: unknown;
    color: string | null;
    talla: string | null;
    sku: string | null;
  } | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function mapPedidoItemRow(item: ItemConRelaciones): PedidoItem {
  const espec = asRecord(item.especificaciones);
  const precio =
    typeof espec?.precio_unitario === 'number'
      ? espec.precio_unitario
      : typeof espec?.precio_congelado === 'number'
        ? espec.precio_congelado
        : null;
  const subtotal =
    typeof espec?.subtotal === 'number'
      ? espec.subtotal
      : precio != null
        ? precio * item.cantidad
        : null;

  return {
    id: String(item.id),
    cantidad: item.cantidad,
    precio_unitario: precio,
    subtotal,
    notas: null,
    especificaciones: espec,
    productos: item.productos
      ? {
        id: String(item.productos.id),
        nombre: item.productos.nombre,
        sku: item.productos.sku,
        imagen: item.productos.imagen,
      }
      : null,
    variantes_producto: item.variantes_producto
      ? {
        id: String(item.variantes_producto.id),
        color: item.variantes_producto.color,
        talla: item.variantes_producto.talla,
        sku: item.variantes_producto.sku,
      }
      : null,
  };
}

export function mapCotizacionItemsToPedidoItems(
  items: CotizacionItemConRelaciones[],
): PedidoItem[] {
  return items.map((item) =>
    mapPedidoItemRow({
      id: item.id,
      cantidad: item.cantidad,
      especificaciones: {
        color_snapshot: item.color_snapshot,
        talla_snapshot: item.talla_snapshot,
        precio_unitario: Number(item.precio_unitario_snapshot),
        subtotal: Number(item.subtotal),
      },
      productos: item.productos
        ? { ...item.productos, id: String(item.productos.id) }
        : null,
      variantes_producto: item.variantes_producto
        ? { ...item.variantes_producto, id: String(item.variantes_producto.id) }
        : null,
    }),
  );
}

export function especificacionesParaTabla(
  espec: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!espec) return null;
  const omit = new Set([
    'precio_unitario',
    'precio_congelado',
    'subtotal',
    'color_snapshot',
    'talla_snapshot',
  ]);
  const filtered = Object.fromEntries(
    Object.entries(espec).filter(([k]) => !omit.has(k)),
  );
  return Object.keys(filtered).length > 0 ? filtered : null;
}
