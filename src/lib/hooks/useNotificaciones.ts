'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Notificacion } from '@/lib/schemas/notificaciones';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export function useNotifications(userId?: number) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ Ref estable para que el canal realtime nunca dependa de fetchNotifications
  const fetchRef = useRef<() => Promise<void>>(async () => { });

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notificaciones?usuario_id=${userId}`);
      if (!res.ok) return;

      const response = await res.json();
      const raw: any[] = response && Array.isArray(response.data) ? response.data : [];

      const normalized: Notificacion[] = raw.map((n) => ({
        ...n,
        id: Number(n.id),
        leido_at: n.leido_at ? new Date(n.leido_at) : null,
      }));

      setNotificaciones(normalized);
      setUnreadCount(response.kpis?.sinLeer ?? normalized.filter((n) => !n.leido).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ✅ Mantener ref siempre actualizada sin re-crear el canal
  useEffect(() => {
    fetchRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // 1. Fetch inicial + polling cada 45s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 2. Realtime — solo depende de userId, usa ref para llamar fetch
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();
    const canalName = `notif_portal_${userId}`;

    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${canalName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

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
        () => {
          // ✅ Llama a través de ref — no crea dependencia en el efecto
          fetchRef.current();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(`[Notificaciones] Error en canal ${canalName}`);
        }
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId]); // ✅ Solo userId — estable, no recrea el canal en cada render

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/notificaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('No se pudo actualizar la alerta');

      setNotificaciones((prev) =>
        prev.map((n) => n.id === id ? { ...n, leido: true, leido_at: new Date() } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;
    try {
      const res = await fetch(`/api/admin/notificaciones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: userId }),
      });
      if (!res.ok) throw new Error('Error al actualizar lote masivo');

      setNotificaciones((prev) =>
        prev.map((n) => !n.leido ? { ...n, leido: true, leido_at: new Date() } : n)
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notificaciones,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}