export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';

const ORDEN_TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34'];

const ordenarTallas = (tallas: string[]): string[] =>
  [...tallas].sort((a, b) => {
    const ia = ORDEN_TALLAS.indexOf(a);
    const ib = ORDEN_TALLAS.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

const normalizarImagen = (img: string | null | undefined, bucket = 'productos'): string | null => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  const cleanPath = img.includes('/') ? img : `${bucket}/${img}`;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${cleanPath}`;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productoId = BigInt(resolvedParams.id);

    // ── 1. Producto con variantes y categoría ──
    const producto = await prisma.productos.findUnique({
      where: { id: productoId },
      include: {
        categorias_productos: {
          select: { id: true, nombre: true, imagen: true },
        },
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

    // ── 2. Traer regla de descuento por separado (si existe) ──
    let reglaDescuentoData = null;
    try {
      const regla_id = (producto as any).regla_descuento_id;
      if (regla_id) {
        const regla = await prisma.reglas_descuento.findUnique({
          where: { id: regla_id },
          select: {
            id: true,
            nombre: true,
            cantidad_min: true,
            tipo_beneficio: true,
            valor_descuento: true,
            activo: true,
            tipo_conteo: true,
          },
        });
        if (regla) {
          reglaDescuentoData = {
            id: regla.id,
            nombre: regla.nombre,
            cantidad_minima: regla.cantidad_min,
            descuento_porcentaje: Number(regla.valor_descuento),
            tipo_beneficio: regla.tipo_beneficio,
            tipo_conteo: regla.tipo_conteo,
          };
        }
      }
    } catch (e) {
      // Tabla o columna no existe aún
      console.warn('Reglas de descuento no disponibles:', e);
    }

    // ── 3. Variantes con stock > 0 ──
    const variantesConStock = producto.variantes_producto.filter(
      (v: any) => v.stock > 0
    );

    const coloresDisponibles = [
      ...new Set(variantesConStock.map((v: any) => v.color)),
    ] as string[];

    const tallasDisponibles = ordenarTallas(
      [...new Set(variantesConStock.map((v: any) => v.talla))] as string[]
    );

    // ── 4. Mapa: color → tallas disponibles ──
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

    // ── 5. Mapa: talla → colores disponibles ──
    const coloresPorTalla: Record<string, string[]> = {};
    for (const v of variantesConStock) {
      if (!coloresPorTalla[v.talla]) coloresPorTalla[v.talla] = [];
      if (!coloresPorTalla[v.talla].includes(v.color)) {
        coloresPorTalla[v.talla].push(v.color);
      }
    }

    // ── 6. Stock total ──
    const stockTotal = variantesConStock.reduce((sum: number, v: any) => sum + v.stock, 0);

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
          imagen: normalizarImagen(
            producto.categorias_productos.imagen,
            'categorias'
          ),
        }
        : { id: null, nombre: 'Sin categoría', imagen: null },
      colores_disponibles: coloresDisponibles,
      tallas_disponibles: tallasDisponibles,
      tallas_por_color: tallasPorColor,
      colores_por_talla: coloresPorTalla,
      regla_descuento: reglaDescuentoData,
      variantes: producto.variantes_producto.map((v: any) => ({
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