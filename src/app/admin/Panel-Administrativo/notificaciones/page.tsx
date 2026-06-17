'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import NotificacionesTable from '@/components/admin/notificaciones/NotificacionesTable';
import type { Notificacion } from '@/lib/schemas/notificaciones';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';

export default function NotificacionesPage() {
  const { can } = usePermissions();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotificaciones = async (scan = false) => {
    try {
      const url = scan
        ? '/api/admin/notificaciones?action=scan'
        : '/api/admin/notificaciones';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar');
      const response = await res.json();
      const raw: any[] = Array.isArray(response.data) ? response.data : [];

      const normalized: Notificacion[] = raw.map((n) => ({
        id: Number(n.id),       // bigint → number
        usuario_id: Number(n.usuario_id),
        tipo: n.tipo,
        titulo: n.titulo,
        mensaje: n.mensaje,
        leido: n.leido ?? false,
        leido_at: n.leido_at ? new Date(n.leido_at) : null,
        referencia_tipo: n.referencia_tipo ?? null,
        referencia_id: n.referencia_id != null ? Number(n.referencia_id) : null,
        url_destino: n.url_destino ?? null,
        created_at: new Date(n.created_at),
      }));

      setNotificaciones(normalized);
    } catch (error) {
      toast.error('Error al cargar notificaciones');
      console.error(error);
      setNotificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (can('view', 'notificaciones')) {
      loadNotificaciones(true);
    } else {
      setLoading(false);
    }
  }, [can]);

  if (!can('view', 'notificaciones')) {
    return <div className="p-6">Acceso denegado</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Notificaciones"
        description="Gestiona las notificaciones del sistema"
        showAction={false}
      />

      {loading ? (
        <div className="text-slate-400 text-sm p-4">Cargando...</div>
      ) : (
        <NotificacionesTable data={notificaciones} />
      )}
    </div>
  );
}