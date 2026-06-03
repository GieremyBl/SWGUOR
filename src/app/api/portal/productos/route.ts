export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';

/**
 * GET /api/portal/productos
 * Catálogo público del portal B2B — solo productos activos con variantes.
 *
 * Query params:
 *  - categoria_id  → filtro por categoría
 *  - busqueda      → búsqueda por nombre, descripción o SKU
 *  - color         → filtro por ColorPrenda
 *  - talla         → filtro por TallaProductos
 *  - limite        → max resultados (default 50)
 *  - nuevo         → "true" para productos de los últimos N días
 *  - dias          → días atrás para "nuevo" (default 30)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoriaId = url.searchParams.get('categoria_id');
    const busqueda = url.searchParams.get('busqueda');
    const colorFiltro = url.searchParams.get('color');
    const tallaFiltro = url.searchParams.get('talla');
    const limite = Math.min(parseInt(url.searchParams.get('limite') || '50'), 200);
    const soloNuevos = url.searchParams.get('nuevo') === 'true';
    const dias = parseInt(url.searchParams.get('dias') || '30');

    // ── 1. Si hay filtro de color/talla, obtener producto_ids válidos ──
    let productoIdsFiltrados: bigint[] | null = null;

    if (colorFiltro || tallaFiltro) {
      const whereVariantes: Record<string, unknown> = {
        estado: 'activo'
      };
      if (colorFiltro) whereVariantes.color = colorFiltro;
      if (tallaFiltro) whereVariantes.talla = tallaFiltro;

      const variantes = await prisma.variantes_producto.findMany({
        where: whereVariantes,
        select: { producto_id: true },
      });

      productoIdsFiltrados = [
        ...new Set(variantes.map((v) => v.producto_id)),
      ];

      if (productoIdsFiltrados.length === 0) {
        return NextResponse.json({ success: true, data: [], count: 0 });
      }
    }

    // ── 2. Query principal ──
    const whereProductos: Record<string, unknown> = {
      estado: 'activo',
    };

    if (categoriaId) whereProductos.categoria_id = BigInt(categoriaId);
    if (productoIdsFiltrados)
      whereProductos.id = { in: productoIdsFiltrados };

    if (soloNuevos) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);
      whereProductos.created_at = { gte: fechaLimite };
    }

    // Búsqueda por texto (nombre, descripción, SKU)
    if (busqueda) {
      whereProductos.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { descripcion: { contains: busqueda, mode: 'insensitive' } },
        { sku: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    const productos = await prisma.productos.findMany({
      where: whereProductos,
      include: {
        categorias: { select: { id: true, nombre: true, imagen: true } },
        variantes_producto: {
          where: { estado: 'activo', stock: { gt: 0 } },
          select: {
            id: true,
            nombre: true,
            color: true,
            talla: true,
            estado: true,
            stock: true,
            precio_adicional: true,
            sku: true,
            imagen_url: true,
          },
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
      orderBy: { created_at: 'desc' },
      take: limite,
    });

    // ── 3. Transformar con lógica de variantes ──
    const normalizarImagen = (
      img: string | null | undefined
    ): string | null => {
      if (!img) return null;
      if (img.startsWith('http')) return img;
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${img}`;
    };

    const ORDEN_TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34'];
    const ordenarTallas = (tallas: string[]) =>
      [...tallas].sort(
        (a, b) => ORDEN_TALLAS.indexOf(a) - ORDEN_TALLAS.indexOf(b)
      );

    const ahora = new Date();
    const limiteNuevo = new Date();
    limiteNuevo.setDate(limiteNuevo.getDate() - 30);

    const data = productos.map((producto) => {
      const variantes = producto.variantes_producto;

      const coloresDisponibles = [
        ...new Set(variantes.map((v) => v.color)),
      ] as string[];

      const tallasDisponibles = ordenarTallas([
        ...new Set(variantes.map((v) => v.talla)),
      ] as string[]);

      // Tallas por color
      const tallasPorColor: Record<string, string[]> = {};
      for (const v of variantes) {
        if (!tallasPorColor[v.color]) tallasPorColor[v.color] = [];
        if (!tallasPorColor[v.color].includes(v.talla)) {
          tallasPorColor[v.color].push(v.talla);
        }
      }
      for (const color in tallasPorColor) {
        tallasPorColor[color] = ordenarTallas(tallasPorColor[color]);
      }

      // Colores por talla
      const coloresPorTalla: Record<string, string[]> = {};
      for (const v of variantes) {
        if (!coloresPorTalla[v.talla]) coloresPorTalla[v.talla] = [];
        if (!coloresPorTalla[v.talla].includes(v.color)) {
          coloresPorTalla[v.talla].push(v.color);
        }
      }

      const esNuevo = producto.created_at >= limiteNuevo;

      return {
        ...serializeBigInt(producto),
        precio: Number(producto.precio),
        imagen: normalizarImagen(producto.imagen),
        categoria: producto.categorias
          ? {
            id: typeof producto.categorias.id === 'bigint' ? Number(producto.categorias.id) : producto.categorias.id,
            nombre: producto.categorias.nombre,
            imagen: normalizarImagen(producto.categorias.imagen),
          }
          : { id: null, nombre: 'Sin categoría', imagen: null },
        es_nuevo: esNuevo,
        colores_disponibles: coloresDisponibles,
        tallas_disponibles: tallasDisponibles,
        tallas_por_color: tallasPorColor,
        colores_por_talla: coloresPorTalla,
        variantes: variantes.map((v) => ({
          id: Number(v.id),
          nombre: v.nombre,
          color: v.color,
          talla: v.talla,
          stock: v.stock,
          precio_adicional: Number(v.precio_adicional),
          sku: v.sku,
          imagen_url: v.imagen_url ? normalizarImagen(v.imagen_url) : null,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      filtros_aplicados: {
        categoria_id: categoriaId ? parseInt(categoriaId) : null,
        color: colorFiltro,
        talla: tallaFiltro,
        busqueda: busqueda || null,
        nuevo: soloNuevos,
        dias: soloNuevos ? dias : null,
      },
    });
  } catch (error: any) {
    console.error('[Portal] Error en GET productos:', error);
    return NextResponse.json(
      { success: false, error: error.message, data: [] },
      { status: 500 }
    );
  }
}
