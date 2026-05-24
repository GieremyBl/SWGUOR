'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import NotificacionesTable from '@/components/admin/notificaciones/NotificacionesTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Notificacion } from '@/lib/schemas/notificaciones';

export default function NotificacionesPage() {
  const { can } = usePermissions();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadNotificaciones = async () => {
    try {
      const res = await fetch('/api/admin/notificaciones');
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
      loadNotificaciones();
    } else {
      setLoading(false);
    }
  }, [can]);

  const handleSave = async (data: unknown) => {
    try {
      const res = await fetch('/api/admin/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al guardar');

      toast.success('Notificación enviada');
      setDialogOpen(false);
      loadNotificaciones();
    } catch (error) {
      toast.error('Error al enviar notificación');
      console.error(error);
    }
  };

  if (!can('view', 'notificaciones')) {
    return <div className="p-6">Acceso denegado</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">Gestiona las notificaciones del sistema</p>
        </div>
        {can('create', 'notificaciones') && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Notificación
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm p-4">Cargando...</div>
      ) : (
        <NotificacionesTable data={notificaciones} />
      )}
    </div>
  );
}