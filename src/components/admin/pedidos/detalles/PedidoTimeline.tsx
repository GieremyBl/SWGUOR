// components/admin/pedidos/detalles/PedidoTimeline.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
    ShoppingBag,
    Factory,
    Shirt,
    Truck,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Loader,
} from 'lucide-react';
import type { TimelinePedido, EventoTimeline, EtapaTimeline } from '@/types/pedido-timeline.types';

interface PedidoTimelineProps {
    pedidoId: string | number;
}

const ETAPA_ICONS: Record<EtapaTimeline, React.ReactNode> = {
    pedido: <ShoppingBag className="w-5 h-5" />,
    produccion: <Factory className="w-5 h-5" />,
    confeccion: <Shirt className="w-5 h-5" />,
    despacho: <Truck className="w-5 h-5" />,
    entrega: <CheckCircle2 className="w-5 h-5" />,
};

const ETAPA_LABELS: Record<EtapaTimeline, string> = {
    pedido: 'Pedido',
    produccion: 'Producción',
    confeccion: 'Confección',
    despacho: 'Despacho',
    entrega: 'Entrega',
};

function getEstadoColor(estado: string) {
    switch (estado) {
        case 'completado':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'en_progreso':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'cancelado':
        case 'rechazado':
            return 'bg-red-50 text-red-700 border-red-200';
        default:
            return 'bg-stone-50 text-stone-700 border-stone-200';
    }
}

function getEstadoIcon(estado: string) {
    switch (estado) {
        case 'completado':
            return <CheckCircle2 className="w-5 h-5" />;
        case 'en_progreso':
            return <Loader className="w-5 h-5 animate-spin" />;
        case 'cancelado':
            return <XCircle className="w-5 h-5" />;
        case 'rechazado':
            return <AlertCircle className="w-5 h-5" />;
        default:
            return <Clock className="w-5 h-5" />;
    }
}

export function PedidoTimeline({ pedidoId }: PedidoTimelineProps) {
    const [timeline, setTimeline] = useState<TimelinePedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let activo = true;

        async function fetchTimeline() {
            try {
                const res = await fetch(`/api/admin/pedidos/${pedidoId}/timeline`, {
                    cache: 'no-store',
                });

                if (!res.ok) {
                    throw new Error('Error al cargar timeline');
                }

                const data = await res.json();
                if (activo) {
                    setTimeline(data);
                }
            } catch (err: any) {
                if (activo) {
                    setError(err.message);
                }
            } finally {
                if (activo) {
                    setLoading(false);
                }
            }
        }

        fetchTimeline();
        return () => {
            activo = false;
        };
    }, [pedidoId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    if (error || !timeline) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error || 'Error al cargar seguimiento'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Barra de progreso */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stone-900">Progreso General</h3>
                    <span className="text-lg font-bold text-stone-900">{timeline.porcentajeProgreso}%</span>
                </div>
                <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${timeline.porcentajeProgreso}%` }}
                    />
                </div>
            </div>

            {/* Timeline vertical */}
            <div className="relative">
                {/* Línea conectora */}
                <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-stone-200" />

                {/* Eventos */}
                <div className="space-y-6">
                    {timeline.eventos.map((evento: EventoTimeline, idx: number) => {
                        const isLast = idx === timeline.eventos.length - 1;

                        return (
                            <div key={evento.id} className="relative pl-20">
                                {/* Círculo de estado */}
                                <div
                                    className={`absolute left-0 top-1 w-16 h-16 rounded-full border-4 flex items-center justify-center ${getEstadoColor(
                                        evento.estado
                                    )} bg-white`}
                                >
                                    <div className="text-stone-600">{ETAPA_ICONS[evento.etapa]}</div>
                                </div>

                                {/* Contenido */}
                                <div className="pt-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold text-stone-900">{evento.titulo}</h4>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                {evento.timestamp.toLocaleDateString('es-PE', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}{' '}
                                                {evento.timestamp.toLocaleTimeString('es-PE', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                                            {getEstadoIcon(evento.estado)}
                                            <span className="capitalize">{evento.estado.replace('_', ' ')}</span>
                                        </div>
                                    </div>

                                    {evento.descripcion && (
                                        <p className="text-sm text-stone-600 mb-2">{evento.descripcion}</p>
                                    )}

                                    {evento.usuario && (
                                        <p className="text-xs text-stone-500 mb-2">
                                            👤 <span className="font-medium">{evento.usuario}</span>
                                        </p>
                                    )}

                                    {evento.observacion && (
                                        <p className="text-xs text-stone-500 italic mb-2">"{evento.observacion}"</p>
                                    )}

                                    {/* Detalles específicos de etapa */}
                                    {evento.detalles && (
                                        <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2 text-xs">
                                            {evento.detalles.totalOrdenes !== undefined && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-stone-600">Órdenes:</span>
                                                    <span className="font-semibold text-stone-900">
                                                        {evento.detalles.ordenesCompletadas || 0}/{evento.detalles.totalOrdenes}
                                                    </span>
                                                </div>
                                            )}

                                            {evento.detalles.totalConfecciones !== undefined && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-stone-600">Confecciones:</span>
                                                    <span className="font-semibold text-stone-900">
                                                        {evento.detalles.confeccionesCompletadas || 0}/
                                                        {evento.detalles.totalConfecciones}
                                                    </span>
                                                </div>
                                            )}

                                            {evento.detalles.numeroGuia && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-stone-600">Guía:</span>
                                                    <span className="font-mono font-semibold text-stone-900">
                                                        {evento.detalles.numeroGuia}
                                                    </span>
                                                </div>
                                            )}

                                            {evento.detalles.fechaEntrega && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-stone-600">Entrega:</span>
                                                    <span className="font-semibold text-emerald-700">
                                                        {new Date(evento.detalles.fechaEntrega).toLocaleDateString('es-PE')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Resumen final */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-stone-200">
                <div className="p-3 bg-stone-50 rounded-lg">
                    <p className="text-xs text-stone-600 mb-1">Estado</p>
                    <p className="text-sm font-semibold text-stone-900 capitalize">
                        {timeline.estadoGlobal.replace('_', ' ')}
                    </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg">
                    <p className="text-xs text-stone-600 mb-1">Total</p>
                    <p className="text-sm font-semibold text-stone-900">S/ {timeline.total.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg">
                    <p className="text-xs text-stone-600 mb-1">Cliente</p>
                    <p className="text-xs font-semibold text-stone-900 truncate">{timeline.cliente}</p>
                </div>
                {timeline.estimadoEntrega && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-xs text-emerald-700 mb-1">Entrega Est.</p>
                        <p className="text-sm font-semibold text-emerald-900">
                            {new Date(timeline.estimadoEntrega).toLocaleDateString('es-PE')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}