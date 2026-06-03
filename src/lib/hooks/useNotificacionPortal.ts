'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Notificacion } from '@/lib/schemas/notificaciones';
import { getSupabaseBrowserClient } from '@/lib/supabase';

// ── Tipos exclusivos del portal cliente ──────────────────────────────────────
// Los tipos admin (stock_bajo, orden_produccion, etc.) no llegan aquí
// porque las notificaciones se filtran por usuario_id y el cliente
// nunca recibe esos tipos desde los triggers del admin.

export type TipoNotificacionPortal =
    | 'cotizacion_aprobada'
    | 'cotizacion_rechazada'
    | 'pedido_confirmado'
    | 'pedido_listo'
    | 'pago_verificado'
    | 'pago_rechazado'
    | 'despacho_en_camino'
    | 'sistema';

interface RawNotificationInput {
    id: string | number;
    leido: boolean;
    leido_at?: string | null;
    [key: string]: unknown;
}

interface NotificacionesApiResponse {
    data: RawNotificationInput[];
    kpis?: {
        sinLeer?: number;
        [key: string]: unknown;
    } | null;
}

export function useNotificationsPortal(userId?: number) {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchRef = useRef<() => Promise<void>>(async () => { });

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/notificaciones?limite=15');
            if (!res.ok) return;

            const response: NotificacionesApiResponse = await res.json();
            const raw = Array.isArray(response?.data) ? response.data : [];

            const normalized: Notificacion[] = raw.map((n) => ({
                ...n,
                id: Number(n.id),
                leido_at: n.leido_at ? new Date(n.leido_at) : null,
            } as Notificacion));

            setNotificaciones(normalized);
            setUnreadCount(response.kpis?.sinLeer ?? normalized.filter((n) => !n.leido).length);
        } catch (error) {
            console.error('[useNotificationsPortal] fetch:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchRef.current = fetchNotifications;
    }, [fetchNotifications]);

    // ── Polling: fetch inicial + cada 45 s ────────────────────────────────────
    useEffect(() => {
        if (!userId) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 45_000);
        return () => clearInterval(interval);
    }, [fetchNotifications, userId]);

    // ── Realtime: escucha INSERT en notificaciones del usuario ─────────────────
    useEffect(() => {
        if (!userId) return;

        const supabase = getSupabaseBrowserClient();
        const canalName = `notif_portal_${userId}`;

        const existing = supabase.getChannels().find((c) => c.topic === `realtime:${canalName}`);
        if (existing) supabase.removeChannel(existing);

        const canal = supabase
            .channel(canalName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `usuario_id=eq.${userId}`,
                },
                () => { fetchRef.current(); },
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn(`[useNotificationsPortal] Error en canal ${canalName}`);
                }
            });

        return () => { supabase.removeChannel(canal); };
    }, [userId]);

    // ── Marcar una como leída ──────────────────────────────────────────────────
    const markAsRead = useCallback(async (id: number) => {
        try {
            const res = await fetch(`/api/notificaciones/${id}/leer`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('No se pudo actualizar');

            setNotificaciones((prev) =>
                prev.map((n) => n.id === id ? { ...n, leido: true, leido_at: new Date() } : n),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('[useNotificationsPortal] markAsRead:', error);
        }
    }, []);

    // ── Marcar todas como leídas ───────────────────────────────────────────────
    const markAllAsRead = useCallback(async () => {
        if (!userId || unreadCount === 0) return;
        try {
            const res = await fetch('/api/notificaciones', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Error al marcar todas como leídas');

            setNotificaciones((prev) =>
                prev.map((n) => !n.leido ? { ...n, leido: true, leido_at: new Date() } : n),
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('[useNotificationsPortal] markAllAsRead:', error);
        }
    }, [userId, unreadCount]);

    return {
        notificaciones,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
}