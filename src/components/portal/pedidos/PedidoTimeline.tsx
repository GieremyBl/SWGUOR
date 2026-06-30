'use client';

import React, { useEffect, useState } from 'react';
import {
    ShoppingBag,
    Factory,
    Shirt,
    Truck,
    CheckCircle2,
    Loader,
    AlertCircle,
} from 'lucide-react';

type EstadoPedidoReal = 'pendiente' | 'en_produccion' | 'listo_para_despacho' | 'entregado' | 'cancelado' | 'pagado' | 'preparando' | 'en_ruta';

type EtapaPortal = 'pedido' | 'produccion' | 'confeccion' | 'despacho' | 'entrega';

const ESTADO_A_ETAPA: Record<EstadoPedidoReal, EtapaPortal> = {
    'pendiente': 'pedido',
    'pagado': 'pedido',
    'en_produccion': 'produccion',
    'listo_para_despacho': 'confeccion',
    'preparando': 'despacho',
    'en_ruta': 'despacho',
    'entregado': 'despacho',
    'cancelado': 'pedido',
};

const ETAPA_INDICE: Record<EtapaPortal, number> = {
    'pedido': 0,
    'produccion': 1,
    'confeccion': 2,
    'despacho': 3,
    'entrega': 4,
};

interface EtapaConfig {
    id: EtapaPortal;
    icon: React.ReactNode;
    label: string;
    descripcion: string;
}

const ETAPAS: EtapaConfig[] = [
    {
        id: 'pedido',
        icon: <ShoppingBag className="w-5 h-5" />,
        label: 'Pedido',
        descripcion: 'Tu pedido ha sido confirmado',
    },
    {
        id: 'produccion',
        icon: <Factory className="w-5 h-5" />,
        label: 'Producción',
        descripcion: 'En proceso de fabricación',
    },
    {
        id: 'confeccion',
        icon: <Shirt className="w-5 h-5" />,
        label: 'Control de Calidad',
        descripcion: 'Verificando la calidad del producto',
    },
    {
        id: 'despacho',
        icon: <Truck className="w-5 h-5" />,
        label: 'Preparando Envío',
        descripcion: 'Tu pedido se está preparando para enviar',
    },
    {
        id: 'entrega',
        icon: <CheckCircle2 className="w-5 h-5" />,
        label: 'En Tránsito',
        descripcion: 'Tu pedido está en camino o ya fue entregado',
    },
];

interface TimelineData {
    eventos: Array<{
        etapa: EtapaPortal;
        estado: string;
    }>;
    porcentajeProgreso: number;
    estadoGlobal: string;
    estadoPedidoActual?: EstadoPedidoReal;
}

interface PedidoTimelinePortalProps {
    pedidoId: string | number;
    estadoPedido?: EstadoPedidoReal; // Opcional: pasar el estado del pedido directamente
}

export function PedidoTimelinePortal({ pedidoId, estadoPedido }: PedidoTimelinePortalProps) {
    const [data, setData] = useState<TimelineData | null>(null);
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
                    throw new Error('Error al cargar seguimiento');
                }

                const json = await res.json();
                if (activo) {
                    setData(json);
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
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm text-stone-500">Cargando seguimiento...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-900">Error</p>
                        <p className="text-xs text-red-700 mt-1">{error || 'No se pudo cargar el seguimiento'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Usar estado del pedido si se pasa directamente, sino usar del API
    const estadoActual = (estadoPedido || data.estadoPedidoActual) as EstadoPedidoReal;
    const etapaActual = ESTADO_A_ETAPA[estadoActual] || 'pedido';
    const indiceActual = ETAPA_INDICE[etapaActual];

    // Calcular progreso: (indice actual / 4) * 100
    const progreso = Math.min(((indiceActual + 1) / ETAPAS.length) * 100, 100);

    // Mapear descripciones por estado real
    const getDescripcionPorEstado = (estado: EstadoPedidoReal): string => {
        const descripciones: Record<EstadoPedidoReal, string> = {
            'pendiente': 'Tu pedido está siendo confirmado',
            'pagado': 'Pago confirmado, tu pedido entrará en producción',
            'en_produccion': 'Tu pedido se está fabricando',
            'listo_para_despacho': 'Tu pedido pasó el control de calidad',
            'preparando': 'Tu pedido se está preparando para enviar',
            'en_ruta': 'Tu pedido está en camino',
            'entregado': 'Tu pedido ha sido entregado',
            'cancelado': 'Tu pedido ha sido cancelado',
        };
        return descripciones[estado] || 'Procesando tu pedido...';
    };

    return (
        <div className="space-y-6">
            {/* Barra de Progreso */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stone-900">Progreso de tu Pedido</h3>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold">
                        {Math.round(progreso)}%
                    </span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                        style={{ width: `${progreso}%` }}
                    />
                </div>
            </div>

            {/* Timeline Horizontal */}
            <div className="relative">
                {/* Línea de conexión (solo escritorio) */}
                <div className="hidden md:block absolute top-6 left-[2.75rem] right-[2.75rem] h-0.5 bg-stone-200 -z-10" />

                {/* Etapas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-2">
                    {ETAPAS.map((etapa, idx) => {
                        const isCompleted = idx < indiceActual;
                        const isActive = idx === indiceActual;

                        return (
                            <div key={etapa.id} className="flex flex-col items-center gap-2">
                                {/* Círculo de Estado */}
                                <div
                                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted
                                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : isActive
                                            ? 'bg-white border-emerald-500 text-emerald-600 ring-4 ring-emerald-100 scale-110'
                                            : 'bg-stone-50 border-stone-300 text-stone-400'
                                        }`}
                                >
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : etapa.icon}
                                </div>

                                {/* Texto */}
                                <div className="text-center">
                                    <p
                                        className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${isCompleted || isActive ? 'text-stone-900' : 'text-stone-400'
                                            }`}
                                    >
                                        {etapa.label}
                                    </p>
                                    {isActive && (
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5 animate-pulse">
                                            En curso
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Estado Actual */}
            <div className={`p-4 rounded-lg border ${estadoActual === 'cancelado'
                ? 'bg-red-50 border-red-200'
                : 'bg-emerald-50 border-emerald-200'
                }`}>
                <p className={`text-xs uppercase font-bold tracking-wide ${estadoActual === 'cancelado'
                    ? 'text-red-700'
                    : 'text-emerald-700'
                    }`}>
                    Estado Actual
                </p>
                <p className={`text-sm font-semibold mt-1 ${estadoActual === 'cancelado'
                    ? 'text-red-900'
                    : 'text-emerald-900'
                    }`}>
                    {getDescripcionPorEstado(estadoActual)}
                </p>
            </div>
        </div>
    );
}