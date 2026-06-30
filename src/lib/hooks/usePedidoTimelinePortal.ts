// hooks/portal/usePedidoTimelinePortal.ts
import { useEffect, useState } from 'react';
import type { EstadoPedido } from '@prisma/client';

interface TimelineData {
    pedidoId: string;
    numeroReferencia: string;
    cliente: string;
    total: number;
    eventos: Array<{
        id: string;
        etapa: 'pedido' | 'produccion' | 'confeccion' | 'despacho' | 'entrega';
        estado: EstadoPedido;
        titulo: string;
        descripcion: string;
        timestamp: Date;
        usuario?: string;
        detalles?: Record<string, any>;
    }>;
    estadoGlobal: EstadoPedido;
    porcentajeProgreso: number;
    estimadoEntrega?: Date;
}

interface UsePedidoTimelinePortalReturn {
    data: TimelineData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function usePedidoTimelinePortal(
    pedidoId: string | number
): UsePedidoTimelinePortalReturn {
    const [data, setData] = useState<TimelineData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTimeline = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/admin/pedidos/${pedidoId}/timeline`, {
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error('Error al cargar el seguimiento');
            }

            const json: TimelineData = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let activo = true;

        const loadTimeline = async () => {
            await fetchTimeline();
        };

        if (activo) {
            loadTimeline();
        }

        return () => {
            activo = false;
        };
    }, [pedidoId]);

    return {
        data,
        loading,
        error,
        refetch: fetchTimeline,
    };
}