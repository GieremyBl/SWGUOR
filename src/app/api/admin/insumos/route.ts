export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { InsumosService } from '@/lib/services/insumos.service';
import { InventarioService } from '@/lib/services/inventario.service';
import { auditoriaService } from '@/lib/services/auditoria.service';
import { prisma } from '@/lib/prisma';
import type { TipoInsumo, UnidadMedida } from '@prisma/client';

const INSUMOS_ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];
const LIMITE_MAXIMO = 200;

const TIPOS_VALIDOS = new Set<TipoInsumo>([
  'materia_prima', 'avio', 'empaque', 'suministro'
]);

async function validarCategoriaId(id: number): Promise<boolean> {
  const cat = await prisma.categoria_insumo.findUnique({ where: { id } });
  return cat !== null;
}

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(INSUMOS_ROLES);
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const rawCategoriaId = searchParams.get('categoria_id');
    const rawTipo = searchParams.get('tipo');
    const rawSort = searchParams.get('sort');
    const rawLimite = searchParams.get('limite');

    if (rawCategoriaId) {
      if (isNaN(Number(rawCategoriaId))) {
        return NextResponse.json({ error: 'categoria_id debe ser un número' }, { status: 400 });
      }
      const existe = await validarCategoriaId(Number(rawCategoriaId));
      if (!existe) {
        return NextResponse.json({ error: `categoria_id ${rawCategoriaId} no existe` }, { status: 400 });
      }
    }

    if (rawTipo && !TIPOS_VALIDOS.has(rawTipo as TipoInsumo)) {
      return NextResponse.json({ error: `tipo inválido: ${rawTipo}` }, { status: 400 });
    }
    if (rawSort && rawSort !== 'asc' && rawSort !== 'desc') {
      return NextResponse.json({ error: 'sort debe ser "asc" o "desc"' }, { status: 400 });
    }

    // NUEVO: tope de resultados, pensado para selectores tipo combobox.
    // Requiere que InsumosService.listar aplique `take: limite` en su query
    // de Prisma — sin ese cambio en el service, este valor no tiene efecto.
    let limite: number | undefined;
    if (rawLimite) {
      const n = Number(rawLimite);
      if (isNaN(n) || n <= 0) {
        return NextResponse.json({ error: 'limite debe ser un número positivo' }, { status: 400 });
      }
      limite = Math.min(n, LIMITE_MAXIMO);
    }

    const proveedorId = searchParams.get('proveedor_id');

    const [insumos, categorias] = await Promise.all([
      InsumosService.listar({
        categoria_id: rawCategoriaId ? Number(rawCategoriaId) : undefined,
        tipo: rawTipo ? (rawTipo as TipoInsumo) : undefined,
        busqueda: searchParams.get('busqueda') ?? undefined,
        bajo_stock: searchParams.get('bajo_stock') === 'true',
        proveedor_id: proveedorId ?? undefined,
        sort: rawSort ? (rawSort as 'asc' | 'desc') : undefined,
        limite,
      }),
      prisma.categoria_insumo.findMany({
        where: { activo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, data: { insumos, categorias } });
  } catch (error) {
    console.error('[GET /insumos]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireServerRole(INSUMOS_ROLES);
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json() as Record<string, unknown>;

    if (!body.nombre || typeof body.nombre !== 'string')
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });

    if (!body.tipo || !TIPOS_VALIDOS.has(body.tipo as TipoInsumo))
      return NextResponse.json({ error: 'El tipo es obligatorio y debe ser válido' }, { status: 400 });

    if (!body.categoria_id || isNaN(Number(body.categoria_id)))
      return NextResponse.json({ error: 'categoria_id es obligatorio' }, { status: 400 });

    const categoriaExiste = await prisma.categoria_insumo.findUnique({
      where: { id: Number(body.categoria_id) },
    });
    if (!categoriaExiste)
      return NextResponse.json({ error: 'La categoría indicada no existe' }, { status: 400 });

    const categoriaId = body.categoria_id != null ? Number(body.categoria_id) : NaN;
    if (!categoriaId || isNaN(categoriaId)) {
      return NextResponse.json({ error: 'categoria_id es obligatorio' }, { status: 400 });
    }
    if (!(await validarCategoriaId(categoriaId))) {
      return NextResponse.json({ error: `categoria_id ${categoriaId} no existe` }, { status: 400 });
    }

    const insumo = await InventarioService.crear({
      nombre: body.nombre,
      tipo: body.tipo as TipoInsumo,
      categoria_id: Number(body.categoria_id),                                          // ✅
      unidad_medida: body.unidad_medida as UnidadMedida | undefined,
      stock_actual: typeof body.stock_actual === 'number' ? body.stock_actual : undefined,
      stock_minimo: typeof body.stock_minimo === 'number' ? body.stock_minimo : undefined,
      stock_maximo: typeof body.stock_maximo === 'number' ? body.stock_maximo : undefined,
      precio_unitario: typeof body.precio_unitario === 'number' ? body.precio_unitario : undefined,
      proveedor_id: typeof body.proveedor_id === 'string' ? body.proveedor_id : undefined,
      ubicacion_almacen: typeof body.ubicacion_almacen === 'string' ? body.ubicacion_almacen : undefined,
      alerta_bajo_stock: typeof body.alerta_bajo_stock === 'boolean' ? body.alerta_bajo_stock : undefined,
    });

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'crear',
      tabla: 'insumo',
      registro_id: BigInt(insumo.id),
      datos_despues: insumo,
    });

    return NextResponse.json({ success: true, data: insumo }, { status: 201 });

  } catch (error) {
    console.error('[POST /insumos]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    );
  }
}