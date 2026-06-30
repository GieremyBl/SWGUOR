export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { TimelinePedido, EventoTimeline, EstadoEtapa } from '@/types/pedido-timeline.types';

/**
 * GET /api/admin/pedidos/[id]/timeline
 * Obtiene la cadena completa de seguimiento desde tablas de seguimiento (audit trail):
 * seguimiento_pedido → seguimiento_produccion → seguimiento_confeccion → guias_remision
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: pedidoId } = await params;
        const bigIntId = BigInt(pedidoId);

        // 1️⃣ Obtener pedido base
        const pedido = await prisma.pedidos.findUnique({
            where: { id: bigIntId },
            include: {
                clientes: true,
                ordenes_produccion: {
                    include: {
                        confecciones: true,
                    },
                },
            },
        });

        if (!pedido) {
            return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
        }

        const eventos: EventoTimeline[] = [];

        // ─── ETAPA 1: SEGUIMIENTO DEL PEDIDO ──────────────────────────────────
        const seguimientoPedido = await prisma.seguimiento_pedido.findMany({
            where: { pedido_id: bigIntId },
            include: { usuarios: true },
            orderBy: { created_at: 'asc' },
        });

        if (seguimientoPedido.length > 0) {
            seguimientoPedido.forEach((seg) => {
                eventos.push({
                    id: `seg-pedido-${seg.id}`,
                    etapa: 'pedido',
                    estado: seg.status as EstadoEtapa,
                    titulo: `Pedido #${pedido.id}`,
                    descripcion: seg.notas || `Estado: ${seg.status}`,
                    timestamp: seg.created_at,
                    usuario: seg.usuarios?.email || 'Sistema',
                    observacion: seg.notas || undefined,
                    detalles: {
                        totalOrdenes: pedido.ordenes_produccion.length,
                    },
                });
            });
        } else {
            // Fallback si no hay seguimiento registrado
            const createdAt = pedido.created_at || new Date();
            eventos.push({
                id: `pedido-${pedido.id}`,
                etapa: 'pedido',
                estado: (pedido.estado as EstadoEtapa) || 'pendiente',
                titulo: `Pedido #${pedido.id}`,
                descripcion: `Cliente: ${pedido.clientes?.razon_social || 'N/A'}`,
                timestamp: createdAt,
                detalles: {
                    totalOrdenes: pedido.ordenes_produccion.length,
                },
            });
        }

        // ─── ETAPA 2: SEGUIMIENTO DE PRODUCCIÓN ───────────────────────────────
        if (pedido.ordenes_produccion.length > 0) {
            const seguimientoProduccion = await prisma.seguimiento_produccion.findMany({
                where: {
                    orden_id: {
                        in: pedido.ordenes_produccion.map((o) => o.id),
                    },
                },
                include: { usuarios: true },
                orderBy: { created_at: 'asc' },
            });

            // Agrupar por orden y obtener el estado más reciente
            const ordenesMap = new Map<bigint, typeof seguimientoProduccion>();
            seguimientoProduccion.forEach((seg) => {
                if (!ordenesMap.has(seg.orden_id)) {
                    ordenesMap.set(seg.orden_id, []);
                }
                ordenesMap.get(seg.orden_id)?.push(seg);
            });

            if (ordenesMap.size > 0) {
                const primeraEtapa = seguimientoProduccion[0];
                const completadas = Array.from(ordenesMap.values()).filter(
                    (registros) =>
                        registros[registros.length - 1]?.completado_en !== null
                ).length;

                eventos.push({
                    id: `seg-produccion-${pedido.id}`,
                    etapa: 'produccion',
                    estado:
                        completadas === ordenesMap.size
                            ? 'completado'
                            : ordenesMap.size > 0
                                ? 'en_progreso'
                                : 'pendiente',
                    titulo: 'Órdenes de Producción',
                    descripcion: `${completadas} de ${pedido.ordenes_produccion.length} completadas`,
                    timestamp: primeraEtapa.created_at,
                    usuario: primeraEtapa.usuarios?.email || 'Sistema',
                    detalles: {
                        totalOrdenes: pedido.ordenes_produccion.length,
                        ordenesCompletadas: completadas,
                    },
                });
            }
        }

        // ─── ETAPA 3: SEGUIMIENTO DE CONFECCIÓN ───────────────────────────────
        if (pedido.ordenes_produccion.length > 0) {
            const confeccionIds = pedido.ordenes_produccion.flatMap((o) =>
                o.confecciones.map((c) => c.id)
            );

            if (confeccionIds.length > 0) {
                const seguimientoConfeccion = await prisma.seguimiento_confeccion.findMany({
                    where: {
                        confeccion_id: {
                            in: confeccionIds,
                        },
                    },
                    include: { usuarios: true },
                    orderBy: { created_at: 'asc' },
                });

                if (seguimientoConfeccion.length > 0) {
                    const confeccionesCompletadas = new Set(
                        (
                            await prisma.confecciones.findMany({
                                where: {
                                    id: { in: confeccionIds },
                                    estado: 'completada',
                                },
                            })
                        ).map((c) => c.id)
                    ).size;

                    const primeraEtapa = seguimientoConfeccion[0];
                    const createdAt = primeraEtapa.created_at || new Date();

                    eventos.push({
                        id: `seg-confeccion-${pedido.id}`,
                        etapa: 'confeccion',
                        estado:
                            confeccionesCompletadas === confeccionIds.length
                                ? 'completado'
                                : 'en_progreso',
                        titulo: 'Confecciones',
                        descripcion: `${confeccionesCompletadas} de ${confeccionIds.length} completadas`,
                        timestamp: createdAt,
                        usuario: primeraEtapa.usuarios?.email || 'Sistema',
                        detalles: {
                            totalConfecciones: confeccionIds.length,
                            confeccionesCompletadas: confeccionesCompletadas,
                        },
                    });
                }
            }
        }

        // ─── ETAPA 4 & 5: SEGUIMIENTO DE DESPACHO ─────────────────────────────
        const guias = await prisma.guias_remision.findMany({
            where: { pedido_id: bigIntId },
            orderBy: { created_at: 'desc' },
            take: 1,
        });

        if (guias.length > 0) {
            const guia = guias[0];

            // Mapear estados: borrador → pendiente, emitida → en_progreso, en_transito → en_progreso, entregada → completado, anulada → cancelado
            const estadoDespacho: EstadoEtapa =
                guia.estado === 'entregada'
                    ? 'completado'
                    : guia.estado === 'anulada'
                        ? 'cancelado'
                        : guia.estado === 'borrador'
                            ? 'pendiente'
                            : 'en_progreso';

            eventos.push({
                id: `seg-despacho-${pedido.id}`,
                etapa: 'despacho',
                estado: estadoDespacho,
                titulo: 'Despacho',
                descripcion: `Guía de Remisión #${guia.numero}`,
                timestamp: guia.fecha_emision,
                detalles: {
                    numeroGuia: guia.numero,
                    fechaEntrega: guia.fecha_entrega || undefined,
                },
            });

            // ─── ETAPA 5: ENTREGA ──────────────────────────────────────────────
            if (guia.fecha_entrega) {
                eventos.push({
                    id: `seg-entrega-${pedido.id}`,
                    etapa: 'entrega',
                    estado: 'completado',
                    titulo: 'Entrega Completada',
                    descripcion: 'Documento entregado al cliente',
                    timestamp: guia.fecha_entrega,
                    detalles: {
                        fechaEntrega: guia.fecha_entrega,
                    },
                });
            } else if (guia.estado === 'en_transito') {
                eventos.push({
                    id: `seg-entrega-${pedido.id}`,
                    etapa: 'entrega',
                    estado: 'en_progreso',
                    titulo: 'En Tránsito',
                    descripcion: 'Documento en ruta hacia el cliente',
                    timestamp: guia.fecha_traslado,
                });
            }
        }

        // ─── Ordenar eventos por timestamp ──────────────────────────────────
        eventos.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // ─── Calcular progreso global ──────────────────────────────────────
        const etapasCompletadas = eventos.filter((e) => e.estado === 'completado').length;
        const porcentajeProgreso =
            eventos.length > 0 ? Math.round((etapasCompletadas / eventos.length) * 100) : 0;

        // ─── Determinar estado global ──────────────────────────────────────
        let estadoGlobal: EstadoEtapa = 'pendiente';
        if (eventos.some((e) => e.estado === 'cancelado' || e.estado === 'rechazado')) {
            estadoGlobal = 'cancelado';
        } else if (etapasCompletadas === eventos.length) {
            estadoGlobal = 'completado';
        } else if (eventos.some((e) => e.estado === 'en_progreso')) {
            estadoGlobal = 'en_progreso';
        }

        const timeline: TimelinePedido = {
            pedidoId: String(pedido.id),
            numeroReferencia: `PED-${pedido.id}`,
            cliente: pedido.clientes?.razon_social || 'N/A',
            total: Number(pedido.total || 0),
            eventos,
            estadoGlobal,
            porcentajeProgreso,
            estimadoEntrega: guias[0]?.fecha_entrega || undefined,
        };

        return NextResponse.json(serializeBigInt(timeline));
    } catch (error: any) {
        console.error('[GET /api/admin/pedidos/:id/timeline]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}