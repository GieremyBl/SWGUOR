export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServerAuth } from '@/lib/auth/server';
import { notificacionesService } from '@/lib/services/notificaciones.service';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { ReferenciaNotificacion, TipoNotificacion } from '@prisma/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePagination(sp: URLSearchParams) {
  return {
    limit:  Math.min(Math.max(Number(sp.get('limit')  ?? 50), 1), 100),
    offset: Math.max(Number(sp.get('offset') ?? 0), 0),
  };
}

// ── GET ───────────────────────────────────────────────────────────────────────
//
//  ?action=scan             → escanear incidencias del sistema, persistir y devolver KPIs
//  ?action=stats            → { unread: number }
//  ?action=no-leidas        → solo no leídas paginadas
//  (sin action)             → lista paginada completa

export async function GET(req: NextRequest) {
  const auth = await requireServerAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const usuarioId = auth.user?.id;
  if (!usuarioId)
    return NextResponse.json({ error: 'No se pudo identificar al usuario' }, { status: 401 });

  const usuarioBigInt = BigInt(usuarioId);

  try {
    const { searchParams } = new URL(req.url);
    const action           = searchParams.get('action');
    const { limit, offset } = parsePagination(searchParams);

    // ── Scan: detectar incidencias y persistir ─────────────────────────────
    if (action === 'scan') {
      const SEMANA = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [insumosBajoStock, pedidosPendientes, despachosAtrasados, ordenesVencidas] =
        await Promise.all([
          prisma.insumo.findMany({
            where:   { stock_actual: { lte: prisma.insumo.fields.stock_minimo } },
            select:  { id: true, nombre: true, stock_actual: true, stock_minimo: true },
            orderBy: { stock_actual: 'asc' },
            take:    20,
          }),
          prisma.pedidos.findMany({
            where:   { estado: 'pendiente' },
            include: { clientes: { select: { razon_social: true } } },
            orderBy: { created_at: 'desc' },
            take:    20,
          }),
          prisma.despachos.findMany({
            where:   { fecha_despacho: { lt: new Date() }, estado: { not: 'entregado' } },
            orderBy: { fecha_despacho: 'asc' },
            take:    20,
          }),
          prisma.ordenes_compra.findMany({
            where:   { saldo_pendiente: { gt: 0 }, created_at: { lt: SEMANA } },
            include: { proveedores: { select: { razon_social: true } } },
            take:    20,
          }),
        ]);

      type Incidencia = {
        usuario_id:      number;
        tipo:            TipoNotificacion;
        titulo:          string;
        mensaje:         string;
        referencia_tipo: ReferenciaNotificacion;
        referencia_id:   bigint;
        url_destino:     string;
      };

      const incidencias: Incidencia[] = [
        ...insumosBajoStock.map((i) => ({
          usuario_id:      usuarioId,
          tipo:            'stock_bajo'      as TipoNotificacion,
          titulo:          'ALERTA DE STOCK',
          mensaje:         `${i.nombre} está por debajo del mínimo (${i.stock_actual}/${i.stock_minimo}).`,
          referencia_tipo: 'PRODUCTO'        as ReferenciaNotificacion,
          referencia_id:   i.id,
          url_destino:     '/admin/Panel-Administrativo/inventario',
        })),
        ...pedidosPendientes.map((p) => ({
          usuario_id:      usuarioId,
          tipo:            'orden_produccion' as TipoNotificacion,
          titulo:          'PEDIDO PENDIENTE',
          mensaje:         `Pedido de ${p.clientes?.razon_social ?? 'Cliente'} esperando gestión.`,
          referencia_tipo: 'PEDIDO'           as ReferenciaNotificacion,
          referencia_id:   p.id,
          url_destino:     '/admin/Panel-Administrativo/pedidos',
        })),
        ...despachosAtrasados.map((d) => ({
          usuario_id:      usuarioId,
          tipo:            'pedido_vencido'  as TipoNotificacion,
          titulo:          'DESPACHO ATRASADO',
          mensaje:         `Envío atrasado para el pedido #${d.pedido_id.toString()}.`,
          referencia_tipo: 'PEDIDO'           as ReferenciaNotificacion,
          referencia_id:   d.id,
          url_destino:     '/admin/Panel-Administrativo/despachos',
        })),
        ...ordenesVencidas.map((o) => ({
          usuario_id:      usuarioId,
          tipo:            'pago_pendiente'  as TipoNotificacion,
          titulo:          'PAGO VENCIDO A PROVEEDOR',
          mensaje:         `Compra a ${o.proveedores?.razon_social ?? 'Proveedor'} con saldo pendiente.`,
          referencia_tipo: 'PAGO'             as ReferenciaNotificacion,
          referencia_id:   o.id,
          url_destino:     '/admin/Panel-Administrativo/cotizaciones-proveedor',
        })),
      ];

      // Persistir solo incidencias nuevas (evitar duplicados no leídos)
      for (const inc of incidencias) {
        const yaExiste = await prisma.notificaciones.findFirst({
          where: {
            usuario_id:      usuarioBigInt,
            referencia_tipo: inc.referencia_tipo,
            referencia_id:   inc.referencia_id,
            leido:           false,
          },
        });
        if (!yaExiste) await notificacionesService.crear(inc);
      }

      const [notificacionesDb, sinLeerCount] = await Promise.all([
        notificacionesService.obtenerPorUsuario(usuarioId, { limite: 30 }),
        notificacionesService.obtenerNoLeidas(usuarioId),
      ]);

      const kpis = {
        sinLeer:         sinLeerCount,
        total:           notificacionesDb.length,
        urgentes:        notificacionesDb.filter((n) => n.tipo === 'pedido_vencido' && !n.leido).length,
        porTipo: {
          stock_bajo:       notificacionesDb.filter((n) => n.tipo === 'stock_bajo').length,
          orden_produccion: notificacionesDb.filter((n) => n.tipo === 'orden_produccion').length,
          pedido_vencido:   notificacionesDb.filter((n) => n.tipo === 'pedido_vencido').length,
          pago_pendiente:   notificacionesDb.filter((n) => n.tipo === 'pago_pendiente').length,
        },
      };

      return NextResponse.json(
        serializeBigInt({ success: true, data: notificacionesDb, kpis, count: notificacionesDb.length })
      );
    }

    // ── Stats: solo conteo de no leídas ───────────────────────────────────
    if (action === 'stats') {
      const unread = await prisma.notificaciones.count({
        where: { usuario_id: usuarioBigInt, leido: false },
      });
      return NextResponse.json({ success: true, data: { unread } });
    }

    // ── Lista: no leídas o completa ────────────────────────────────────────
    const soloNoLeidas = action === 'no-leidas';
    const where = soloNoLeidas
      ? { usuario_id: usuarioBigInt, leido: false }
      : { usuario_id: usuarioBigInt };

    const [total, rows] = await Promise.all([
      prisma.notificaciones.count({ where }),
      prisma.notificaciones.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take:    limit,
        skip:    offset,
      }),
    ]);

    return NextResponse.json(
      serializeBigInt({ success: true, data: rows, total, limit, offset })
    );

  } catch (error: any) {
    console.error('[GET /notificaciones]', error);
    return NextResponse.json({ error: error.message ?? 'Error interno', data: [] }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
//  Crear notificación manual

export async function POST(req: NextRequest) {
  const auth = await requireServerAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();

    if (!body.usuarioId || !body.tipo || !body.titulo || !body.mensaje || !body.referenciaType)
      return NextResponse.json(
        { error: 'usuarioId, tipo, titulo, mensaje y referenciaType son obligatorios' },
        { status: 400 }
      );

    const notificacion = await prisma.notificaciones.create({
      data: {
        usuario_id:      BigInt(body.usuarioId),
        tipo:            body.tipo            as TipoNotificacion,
        titulo:          body.titulo          as string,
        mensaje:         body.mensaje         as string,
        referencia_tipo: body.referenciaType  as ReferenciaNotificacion,
        referencia_id:   body.referenciaId    ? BigInt(body.referenciaId) : undefined,
        url_destino:     body.urlDestino      ?? null,
        leido:           false,
      },
    });

    return NextResponse.json(
      serializeBigInt({ success: true, data: notificacion, message: 'Notificación creada exitosamente' }),
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[POST /notificaciones]', error);
    return NextResponse.json({ error: error.message ?? 'Error al crear notificación' }, { status: 500 });
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────
//  ?action=marcar-leida         → body: { notificacionId } | { notificacionIds[] }
//  ?action=marcar-todas-leidas  → marca todas del usuario autenticado

export async function PUT(req: NextRequest) {
  const auth = await requireServerAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const usuarioBigInt = BigInt(auth.user!.id);

  try {
    const body   = await req.json();
    const action = new URL(req.url).searchParams.get('action');
    const ahora  = new Date();

    if (action === 'marcar-leida') {
      if (body.notificacionId) {
        await prisma.notificaciones.update({
          where: { id: BigInt(body.notificacionId) },
          data:  { leido: true, leido_at: ahora },
        });
      } else if (Array.isArray(body.notificacionIds) && body.notificacionIds.length) {
        await prisma.notificaciones.updateMany({
          where: { id: { in: (body.notificacionIds as (string | number)[]).map(BigInt) } },
          data:  { leido: true, leido_at: ahora },
        });
      } else {
        return NextResponse.json(
          { error: 'Se requiere notificacionId o notificacionIds' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, message: 'Notificación(es) marcada(s) como leída(s)' });
    }

    if (action === 'marcar-todas-leidas') {
      await notificacionesService.marcarTodasComoLeidas(auth.user!.id);
      return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('[PUT /notificaciones]', error);
    return NextResponse.json({ error: error.message ?? 'Error al actualizar notificación' }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
//  Alias rápido de marcar-todas-leidas (usado por NotificationDropdown)

export async function PATCH(req: NextRequest) {
  const auth = await requireServerAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!auth.user?.id)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    await notificacionesService.marcarTodasComoLeidas(auth.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
//  body: { notificacionId } | { notificacionIds[] }

export async function DELETE(req: NextRequest) {
  const auth = await requireServerAuth();
  if (!auth.success)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();

    if (body.notificacionId) {
      await prisma.notificaciones.delete({
        where: { id: BigInt(body.notificacionId) },
      });
    } else if (Array.isArray(body.notificacionIds) && body.notificacionIds.length) {
      await prisma.notificaciones.deleteMany({
        where: { id: { in: (body.notificacionIds as (string | number)[]).map(BigInt) } },
      });
    } else {
      return NextResponse.json(
        { error: 'Se requiere notificacionId o notificacionIds' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Notificación(es) eliminada(s) exitosamente' });

  } catch (error: any) {
    console.error('[DELETE /notificaciones]', error);
    return NextResponse.json({ error: error.message ?? 'Error al eliminar notificación' }, { status: 500 });
  }
}