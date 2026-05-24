import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { requireAdmin } from '@/lib/auth/server';
import {
  obtenerAuditoriaRegistro,
  obtenerAuditoriaReciente,
} from "@/lib/helpers/rpc-helpers";
import {
  aprobarFichaTecnica,
  marcarFichaObsoleta,
  notificarCotizacionExpirada,
  notificarDevolucionSolicitada,
  notificarStockBajo,
  notificarPagoPendiente,
  notificarConfeccionCompletada,
} from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

// ============================================================================
// GET - Listado Global Paginado O Consultas por RPC (Recientes / Registro)
// ============================================================================
export async function GET(req: NextRequest) {
  // Verificación de seguridad requerida por el archivo original de listado
  const auth = await requireAdmin();
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const limitParam = searchParams.get('limit');

    // --- ENTRADA A: Operaciones Especiales RPC ---
    if (action === "reciente") {
      const limit = limitParam || "50";
      const auditorias = await obtenerAuditoriaReciente(Number(limit));
      return NextResponse.json({
        success: true,
        data: auditorias,
        total: auditorias.length,
      });
    }

    if (action === "registro") {
      const tabla = searchParams.get("tabla");
      const registroId = searchParams.get("registroId");
      if (tabla && registroId) {
        const auditorias = await obtenerAuditoriaRegistro(tabla, Number(registroId));
        return NextResponse.json({
          success: true,
          data: auditorias,
          total: auditorias.length,
        });
      }
      return NextResponse.json({ error: "Parámetros inválidos para consulta de registro" }, { status: 400 });
    }

    // --- ENTRADA B: Listado con Paginación y Filtros de Prisma ---
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(limitParam || '50');
    const table = searchParams.get('table');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (action) where.accion = action;
    if (table) where.tabla = table;
    if (userId) where.usuario_id = BigInt(userId);

    const [registros, total] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        include: {
          usuarios: {
            select: {
              email: true,
              personal_interno: {
                select: { nombre_completo: true }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditoria.count({ where }),
    ]);

    return NextResponse.json(serializeBigInt({
      data: registros,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }));

  } catch (error: any) {
    console.error('[API_AUDITORIA] Error en GET:', error);
    return NextResponse.json({ error: error.message || "Error al obtener auditoría" }, { status: 500 });
  }
}

// ============================================================================
// POST - Cambios de Estado, Flujos de Fichas y Notificaciones Transversales
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operacion } = body;

    // Aprobar ficha técnica
    if (operacion === "aprobar-ficha") {
      const fichaActualizada = await aprobarFichaTecnica(Number(body.fichaId), Number(body.usuarioId));

      return NextResponse.json(
        {
          success: true,
          data: fichaActualizada,
          message: "Ficha técnica aprobada exitosamente",
        },
        { status: 200 }
      );
    }

    // Marcar ficha como obsoleta
    if (operacion === "obsoleta-ficha") {
      const fichaActualizada = await marcarFichaObsoleta(Number(body.fichaId));

      return NextResponse.json(
        {
          success: true,
          data: fichaActualizada,
          message: "Ficha técnica marcada como obsoleta",
        },
        { status: 200 }
      );
    }

    // Notificar eventos: Cotizaciones
    if (operacion === "notificar-cotizacion-expirada") {
      await notificarCotizacionExpirada({
        cotizacionId: Number(body.cotizacionId),
        cotizacionNumero: body.cotizacionNumero,
      });

      return NextResponse.json({
        success: true,
        message: "Notificaciones de cotización expirada enviadas",
      });
    }

    // Notificar eventos: Alertas de Stock
    if (operacion === "notificar-stock-bajo") {
      await notificarStockBajo({
        itemId: Number(body.itemId),
        itemNombre: body.itemNombre,
        stockActual: Number(body.stockActual),
        stockMinimo: Number(body.stockMinimo),
        tipoItem: body.tipoItem,
      });

      return NextResponse.json({
        success: true,
        message: "Notificaciones de stock bajo enviadas",
      });
    }

    // Notificar eventos: Devoluciones
    if (operacion === "notificar-devolucion") {
      await notificarDevolucionSolicitada({
        devolucionId: Number(body.devolucionId),
        clienteId: Number(body.clienteId),
        productoNombre: body.productoNombre,
      });

      return NextResponse.json({
        success: true,
        message: "Notificaciones de devolución enviadas",
      });
    }

    // Notificar eventos: Pagos pendientes a Talleres Externos
    if (operacion === "notificar-pago-taller") {
      await notificarPagoPendiente({
        confeccionId: Number(body.confeccionId),
        tallerNombre: body.tallerNombre,
        monto: Number(body.monto),
      });

      return NextResponse.json({
        success: true,
        message: "Notificaciones de pago a taller enviadas",
      });
    }

    // Notificar eventos: Fin de Confección en Líneas de Producción
    if (operacion === "notificar-confeccion-completada") {
      await notificarConfeccionCompletada({
        confeccionId: Number(body.confeccionId),
        pedidoId: Number(body.pedidoId),
      });

      return NextResponse.json({
        success: true,
        message: "Notificación de confección completada enviada",
      });
    }

    return NextResponse.json(
      { error: "Operación no reconocida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en POST operaciones RPC:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al ejecutar operación: ${message}` },
      { status: 500 }
    );
  }
}