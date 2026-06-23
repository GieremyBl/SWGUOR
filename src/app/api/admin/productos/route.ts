export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ColorPrenda, TallaProductos, EstadoProducto } from '@prisma/client';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import type { RolUsuario } from '@/lib/constants/roles';

const PRODUCTOS_ROLES: RolUsuario[] = ['administrador', 'gerente', 'disenador'];
const LIMITE_MAXIMO = 200;

export async function GET(req: Request) {
  const auth = await requireServerRole(PRODUCTOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const categoriaId = searchParams.get('categoria_id');
    const busqueda = searchParams.get('busqueda');
    const estado = searchParams.get('estado');
    const colorParam = searchParams.get('color');
    const tallaParam = searchParams.get('talla');

    // 'ligero=true' es para selectores tipo combobox: evita traer todas las
    // variantes_producto + fichas_tecnicas de cada producto, que es lo más
    // pesado de esta consulta. 'limite' evita traer el catálogo completo.
    const ligero = searchParams.get('ligero') === 'true';
    const rawLimite = searchParams.get('limite');
    let limite: number | undefined;
    if (rawLimite) {
      const n = Number(rawLimite);
      if (isNaN(n) || n <= 0) {
        return NextResponse.json({ error: 'limite debe ser un número positivo' }, { status: 400 });
      }
      limite = Math.min(n, LIMITE_MAXIMO);
    }

    const color = colorParam && colorParam in ColorPrenda
      ? ColorPrenda[colorParam as keyof typeof ColorPrenda]
      : undefined;

    const talla = tallaParam && tallaParam in TallaProductos
      ? TallaProductos[tallaParam as keyof typeof TallaProductos]
      : undefined;

    const where = {
      ...(estado && { estado: estado as keyof typeof EstadoProducto }),
      ...(categoriaId && { categoria_id: parseInt(categoriaId) }),
      ...(busqueda && { nombre: { contains: busqueda, mode: 'insensitive' as const } }),
      ...(color && { variantes_producto: { some: { color } } }),
      ...(talla && { variantes_producto: { some: { talla } } }),
    };

    const productosQuery = ligero
      ? prisma.productos.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          sku: true,
          precio: true,
          estado: true,
          imagen: true,
        },
        orderBy: { nombre: 'asc' },
        ...(limite && { take: limite }),
      })
      : prisma.productos.findMany({
        where,
        include: {
          categorias_productos: true,
          variantes_producto: true,
          fichas_tecnicas: true,
        },
        orderBy: { nombre: 'asc' },
        ...(limite && { take: limite }),
      });

    const [productos, categorias] = await Promise.all([
      productosQuery,
      // El combobox (ligero=true) no necesita la lista de categorías.
      ligero ? Promise.resolve([]) : prisma.categorias_productos.findMany({ orderBy: { nombre: 'asc' } }),
    ]);

    return NextResponse.json(
      JSON.parse(JSON.stringify({ productos, categorias }, (_, v) =>
        typeof v === 'bigint' ? Number(v) : v
      ))
    );
  } catch (error: any) {
    console.error('[GET /api/admin/productos]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(PRODUCTOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { producto: datos, variantes = [] } = body;

    const producto = await prisma.productos.create({
      data: {
        nombre: datos.nombre,
        precio: datos.precio,
        sku: datos.sku,
        estado: datos.estado ?? 'activo',
        imagen: datos.imagen ?? null,
        categoria_id: datos.categoria_id ?? null,
        reglas_descuento: datos.reglas_descuento ?? null,
        ...(datos.fichas_tecnicas_id && {
          fichas_tecnicas: { connect: { id: datos.fichas_tecnicas_id } },
        }),
        ...(variantes.length > 0 && {
          variantes_producto: {
            create: variantes.map((v: any) => ({
              color: v.color,
              talla: v.talla,
              sku: v.sku,
              stock: v.stock ?? 0,
              estado: v.estado ?? 'activo',
            })),
          },
        }),
      },
      include: { variantes_producto: true },
    });

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'productos',
      registro_id: BigInt(producto.id),
      datos_despues: producto,
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un producto con ese SKU' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}