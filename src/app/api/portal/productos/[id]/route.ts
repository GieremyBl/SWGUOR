export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';
import { obtenerEscalasPrecioProducto } from '@/lib/services/escalas-precio-producto.service';

// Orden canónico de tallas
const ORDEN_TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34'];
const ordenarTallas = (tallas: string[]) =>
  [...tallas].sort((a, b) => {
    const ia = ORDEN_TALLAS.indexOf(a);
    const ib = ORDEN_TALLAS.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

// Normalizar imagen de Supabase Storage
const normalizarImagen = (img: string | null | undefined, bucket = 'productos'): string | null => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  const cleanPath = img.includes('/') ? img : `${bucket}/${img}`;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${cleanPath}`;
};

/**
 * GET /api/portal/productos/[id]
 * Detalle profundo de un producto con variantes activas,
 * mapas de tallas_por_color y colores_por_talla con stock.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productoId = BigInt(resolvedParams.id);

    // ── 1. Producto con categoría y variantes activas ──
    const producto = await prisma.productos.findUnique({
      where: { id: productoId },
      include: {
        categorias_productos: { select: { id: true, nombre: true, imagen: true } },
        variantes_producto: {
          where: { estado: 'activo' },
          select: {
            id: true,
            color: true,
            talla: true,
            estado: true,
            stock: true,
            precio_adicional: true,
            sku: true,
            imagen_url: true,
            created_at: true,
          },
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
    });

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    if (producto.estado !== 'activo') {
      return NextResponse.json(
        { success: false, error: 'Producto no disponible' },
        { status: 403 }
      );
    }

    // ── 2. Variantes con stock > 0 (para selectores del frontend) ──
    const variantesConStock = producto.variantes_producto.filter(
      (v) => v.stock > 0
    );

    const coloresDisponibles = [
      ...new Set(variantesConStock.map((v) => v.color)),
    ] as string[];

    const tallasDisponibles = ordenarTallas([
      ...new Set(variantesConStock.map((v) => v.talla)),
    ] as string[]);

    // ── 3. Mapa: color → tallas disponibles ──
    const tallasPorColor: Record<string, string[]> = {};
    for (const v of variantesConStock) {
      if (!tallasPorColor[v.color]) tallasPorColor[v.color] = [];
      if (!tallasPorColor[v.color].includes(v.talla)) {
        tallasPorColor[v.color].push(v.talla);
      }
    }
    for (const color in tallasPorColor) {
      tallasPorColor[color] = ordenarTallas(tallasPorColor[color]);
    }

    // ── 4. Mapa: talla → colores disponibles ──
    const coloresPorTalla: Record<string, string[]> = {};
    for (const v of variantesConStock) {
      if (!coloresPorTalla[v.talla]) coloresPorTalla[v.talla] = [];
      if (!coloresPorTalla[v.talla].includes(v.color)) {
        coloresPorTalla[v.talla].push(v.color);
      }
    }

    // ── 5. Stock total disponible ──
    const stockTotal = variantesConStock.reduce(
      (sum, v) => sum + v.stock,
      0
    );

    // ── 6. CUS_27 — escalas de precio por cantidad vigentes para este producto ──
    const escalasPrecio = await obtenerEscalasPrecioProducto(productoId);

    // ── 7. Construir respuesta ──
    const imagenPrincipal = normalizarImagen(producto.imagen);

    const data = {
      ...serializeBigInt(producto),
      precio: Number(producto.precio),
      imagen: imagenPrincipal,
      stock_disponible: stockTotal,
      categoria: producto.categorias_productos
        ? {
          id: producto.categorias_productos.id,
          nombre: producto.categorias_productos.nombre,
          imagen: normalizarImagen(producto.categorias_productos.imagen, 'categorias'),
        }
        : { id: null, nombre: 'Sin categoría', imagen: null },
      colores_disponibles: coloresDisponibles,
      tallas_disponibles: tallasDisponibles,
      tallas_por_color: tallasPorColor,
      colores_por_talla: coloresPorTalla,
      variantes: producto.variantes_producto.map((v) => ({
        id: v.id,
        color: v.color,
        talla: v.talla,
        estado: v.estado,
        stock: v.stock,
        precio_adicional: Number(v.precio_adicional),
        precio_final: Number(producto.precio) + Number(v.precio_adicional),
        sku: v.sku,
        imagen_url: normalizarImagen(v.imagen_url) || imagenPrincipal,
      })),
      escalas_precio: escalasPrecio?.escalas ?? [],
    };

    return NextResponse.json({ success: true, data }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[Portal] Error en GET producto detalle:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
