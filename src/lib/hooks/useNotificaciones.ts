'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Notificacion } from '@/lib/schemas/notificaciones';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { TipoNotificacion } from '@prisma/client';
export type TipoNotificacionAdmin = TipoNotificacion;

interface NotificacionesApiResponse {
  data: Notificacion[];
  kpis?: {
    sinLeer?: number;
    [key: string]: unknown;
  } | null;
}

export function useNotifications(userId?: number) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchRef = useRef<() => Promise<void>>(async () => { });

  const fetchNotifications = useCallback(async () => {
    if (!userId || unauthorized) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notificaciones?usuario_id=${userId}`);

      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
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
      console.error('[useNotifications] fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, unauthorized]);

  useEffect(() => {
    fetchRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    setUnauthorized(false);
  }, [userId]);

  useEffect(() => {
    if (!userId || unauthorized) return;
    fetchNotifications();
  }, [fetchNotifications, userId, unauthorized]);

  useEffect(() => {
    if (!userId || unauthorized) return;

    const supabase = getSupabaseBrowserClient();
    const canalName = `notif_admin_${userId}`;

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
        if (status === 'CHANNEL_ERROR')
          console.warn(`[useNotifications] Error en canal ${canalName}`);
      });

    return () => { supabase.removeChannel(canal); };
  }, [userId, unauthorized]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/admin/notificaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('No se pudo actualizar la alerta');

      setNotificaciones((prev) =>
        prev.map((n) => n.id === id ? { ...n, leido: true, leido_at: new Date() } : n),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[useNotifications] markAsRead:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;
    try {
      const res = await fetch('/api/admin/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: userId }),
      });
      if (!res.ok) throw new Error('Error al actualizar lote masivo');

      setNotificaciones((prev) =>
        prev.map((n) => !n.leido ? { ...n, leido: true, leido_at: new Date() } : n),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('[useNotifications] markAllAsRead:', error);
    }
  }, [userId, unreadCount]);

  return { notificaciones, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}