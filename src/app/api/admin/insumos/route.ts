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

const TIPOS_VALIDOS = new Set<TipoInsumo>([
  'materia_prima', 'avio', 'empaque', 'suministro'
]);

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(INSUMOS_ROLES);
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const rawCategoriaId = searchParams.get('categoria_id');
    const rawTipo = searchParams.get('tipo');
    const rawSort = searchParams.get('sort');
    const proveedorId = searchParams.get('proveedor_id');

    // Validar categoria_id como número
    if (rawCategoriaId && isNaN(Number(rawCategoriaId)))
      return NextResponse.json({ error: 'categoria_id debe ser un número' }, { status: 400 });

    // Validar que la categoría exista en la tabla
    if (rawCategoriaId) {
      const existe = await prisma.categoria_insumo.findUnique({
        where: { id: Number(rawCategoriaId) },
      });
      if (!existe)
        return NextResponse.json({ error: `categoria_id ${rawCategoriaId} no existe` }, { status: 400 });
    }

    if (rawTipo && !TIPOS_VALIDOS.has(rawTipo as TipoInsumo))
      return NextResponse.json({ error: `tipo inválido: ${rawTipo}` }, { status: 400 });

    if (rawSort && rawSort !== 'asc' && rawSort !== 'desc')
      return NextResponse.json({ error: 'sort debe ser "asc" o "desc"' }, { status: 400 });

    if (proveedorId && !/^\d+$/.test(proveedorId))
      return NextResponse.json({ error: 'proveedor_id inválido' }, { status: 400 });

    const insumos = await InsumosService.listar({
      categoria_id: rawCategoriaId !== null ? Number(rawCategoriaId) : undefined,
      tipo: rawTipo ? (rawTipo as TipoInsumo) : undefined,
      busqueda: searchParams.get('busqueda') ?? undefined,
      bajo_stock: searchParams.get('bajo_stock') === 'true',
      proveedor_id: proveedorId !== null ? proveedorId : undefined,
      sort: rawSort ? (rawSort as 'asc' | 'desc') : undefined,
    });

    return NextResponse.json({ success: true, data: { insumos } });

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