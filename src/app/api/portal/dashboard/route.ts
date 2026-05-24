export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';

async function obtenerClienteSesion() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status };
  }

  const clienteDb = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true, razon_social: true, nombre_comercial: true },
  });

  if (!clienteDb) {
    return { error: 'cliente_no_encontrado' as const, status: 404 };
  }

  return {
    auth_user_id: auth.user.authId,
    usuario_id:   auth.user.id,
    cliente_id:   clienteDb.id,
    cliente:      clienteDb,
  };
}

export async function GET() {
  try {
    const sesion = await obtenerClienteSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status }
      );
    }

    const clienteId = sesion.cliente_id;

    // 1. Obtener cotizaciones recientes (máx 6)
    const cotizacionesRaw = await prisma.cotizaciones.findMany({
      where: { cliente_id: clienteId },
      select: {
        id: true,
        numero: true,
        total: true,
        estado: true,
        created_at: true,
        moneda: true,
        _count: {
          select: { cotizacion_items: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 6,
    });

    const cotizaciones = cotizacionesRaw.map(c => ({
      id: Number(c.id),
      numero: c.numero,
      total: c.total ? Number(c.total) : null,
      estado: c.estado,
      created_at: c.created_at,
      moneda: c.moneda,
      total_items: c._count.cotizacion_items,
    }));

    // 2. Obtener pedidos recientes (máx 5)
    const pedidosRaw = await prisma.pedidos.findMany({
      where: { cliente_id: clienteId },
      select: {
        id: true,
        estado: true,
        total: true,
        created_at: true,
        total_unidades: true,
        moneda: true,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    const pedidos = pedidosRaw.map(p => ({
      id: Number(p.id),
      estado: p.estado,
      total: p.total ? Number(p.total) : 0,
      created_at: p.created_at,
      total_unidades: p.total_unidades ? Number(p.total_unidades) : 0,
      moneda: p.moneda,
    }));

    // 3. Obtener conteo de KPIs
    const [cotStats, pedStats, despachosCount, totalGastadoAggregate] = await Promise.all([
      // Cotizaciones pendientes (borrador o enviada)
      prisma.cotizaciones.count({
        where: {
          cliente_id: clienteId,
          estado: { in: ['borrador', 'enviada'] },
        },
      }),
      // Todos los estados de pedidos para filtrar en memoria
      prisma.pedidos.findMany({
        where: { cliente_id: clienteId },
        select: { estado: true },
      }),
      // Despachos en ruta vinculados a pedidos del cliente
      prisma.despachos.count({
        where: {
          estado: 'en_ruta',
          pedidos: {
            cliente_id: clienteId,
          },
        },
      }),
      // Suma total gastada en pedidos entregados
      prisma.pedidos.aggregate({
        where: {
          cliente_id: clienteId,
          estado: 'entregado',
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    const pedidosEnProduccion = pedStats.filter(p => p.estado === 'en_produccion').length;
    const pedidosListos = pedStats.filter(p => p.estado === 'listo_para_despacho').length;
    const totalGastado = Number(totalGastadoAggregate?._sum?.total ?? 0);

    const stats = {
      cotizaciones_pendientes: cotStats,
      pedidos_en_produccion: pedidosEnProduccion,
      pedidos_listos: pedidosListos,
      despachos_en_ruta: despachosCount,
      total_gastado: totalGastado,
    };

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        cotizaciones,
        pedidos,
        stats,
      }),
    });
  } catch (error: any) {
    console.error('[Portal Dashboard API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
