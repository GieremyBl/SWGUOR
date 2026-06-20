export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { OrdenesProduccionService } from '@/lib/services/ordenes-produccion.service';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { ordenProduccionSchema } from '@/lib/schemas/ordenes-produccion';
import type { RolUsuario } from '@/lib/constants/roles';

const ROLES_LECTURA: RolUsuario[] = [
  'administrador', 'gerente', 'representante_taller', 'recepcionista', 'disenador', 'almacenero',
];
const ROLES_ESCRITURA: RolUsuario[] = ['administrador', 'gerente', 'representante_taller'];

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);

    // 1. Helper reutilizable para desinfectar strings y evitar inyecciones corruptas de Enums o IDs
    const desinfectarParametro = (val: string | null): string | undefined => {
      if (!val || val === 'all' || val === 'todos' || val === 'undefined' || val === 'null' || val.trim() === '') {
        return undefined;
      }
      return val.trim();
    };

    // 2. Extraer y limpiar parámetros de búsqueda y filtros relacionales
    const producto_id = desinfectarParametro(searchParams.get('producto_id'));
    const taller_id = desinfectarParametro(searchParams.get('taller_id'));
    const pedido_id = desinfectarParametro(searchParams.get('pedido_id'));
    const search = desinfectarParametro(searchParams.get('search'));

    // 3. Capturar de manera cruzada filtros operativos (etapa vs estado)
    // El Front-End suele llamarle "etapa" o "estado" indiferentemente a los selectores de arriba.
    const estado = desinfectarParametro(searchParams.get('estado'));
    const etapa = desinfectarParametro(searchParams.get('etapa'));

    // 4. Saneamiento estricto de paginación contra NaNs
    const rawPage = searchParams.get('page');
    const rawLimit = searchParams.get('limit');

    const page = rawPage && !isNaN(Number(rawPage)) ? Math.max(1, Number(rawPage)) : 1;
    const limit = rawLimit && !isNaN(Number(rawLimit)) ? Math.max(1, Number(rawLimit)) : 10;

    // 5. Consumir el Servicio usando parámetros limpios o undefined (Evita romper los Enums de Prisma)
    // Si estado contiene valores separados por coma, se pasa como array
    const estadoParam = estado?.includes(',') ? estado.split(',').map(s => s.trim()) : estado;

    const result = await OrdenesProduccionService.listar({
      producto_id,
      taller_id,
      pedido_id,
      estado: estadoParam,
      etapa,
      search,
      page,
      limit,
    });

    const [enProceso, completadas] = await Promise.all([
      prisma.ordenes_produccion.count({
        where: { estado: { in: ['borrador', 'confirmada', 'en_produccion', 'pausada'] } },
      }),
      prisma.ordenes_produccion.count({ where: { estado: 'completada' } }),
    ]);

    return NextResponse.json({
      success: true,
      ordenes: result?.data || [],
      meta: {
        ...(result?.meta || { total: 0, totalPages: 1, page, limit }),
        enProceso,
        completadas,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[GET /ordenes-produccion]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = ordenProduccionSchema.safeParse({
      ...body,
      producto_id: Number(body.producto_id),
      taller_id: Number(body.taller_id),
      ficha_id: Number(body.ficha_id),
      pedido_id: body.pedido_id != null && body.pedido_id !== ''
        ? Number(body.pedido_id)
        : undefined,
      cantidad_solicitada: Number(body.cantidad_solicitada),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const orden = await OrdenesProduccionService.crear({
      ...parsed.data,
      creado_por: auth.user.id,
    });

    return NextResponse.json({ success: true, data: orden }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const id = body.id;
    if (!id || !/^\d+$/.test(String(id))) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const { id: _id, ...updates } = body;
    const orden = await OrdenesProduccionService.actualizar(String(id), {
      fecha_entrega: updates.fecha_entrega,
      notas: updates.notas,
      estado: updates.estado,
      taller_id: updates.taller_id != null ? String(updates.taller_id) : undefined,
      cantidad_solicitada: updates.cantidad_solicitada != null
        ? Number(updates.cantidad_solicitada)
        : undefined,
    });

    return NextResponse.json({ success: true, data: orden });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}