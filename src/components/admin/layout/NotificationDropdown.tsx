"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Package, Clock, AlertTriangle, CheckCircle2, MailOpen, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type TipoNotificacion = 
  | 'stock_bajo'
  | 'pedido_vencido'
  | 'pago_pendiente'
  | 'cotizacion_expirada'
  | 'orden_produccion'
  | 'confeccion_completada'
  | 'devolucion_solicitada'
  | 'sistema';

interface NotificationItem {
  id: string | number | bigint;
  usuario_id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leido: boolean;
  leido_at: string | null;
  referencia_tipo?: string | null;
  referencia_id?: string | number | bigint | null;
  url_destino?: string | null;
  created_at: string;
}

interface NotificationResponse {
  data: NotificationItem[];
  kpis: {
    sinLeer: number;
    total: number;
    urgentes: number;
    porTipo: {
      stock_bajo: number;
      orden_produccion: number;
      pedido_vencido: number;
      pago_pendiente: number;
    };
  };
}

const fetchNotifications = async (): Promise<NotificationResponse> => {
  const res = await fetch('/api/admin/notificaciones');
  if (!res.ok) throw new Error('Error al cargar alertas del sistema');
  return res.json();
};

const markAsRead = async (id: string | number): Promise<void> => {
  const res = await fetch(`/api/admin/notificaciones/${id}`, { 
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('Error al actualizar estado de notificación');
};

export function NotificationDropdown() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30000, 
  });

  const mutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Alerta marcada como leída");
    },
    onError: () => {
      toast.error("Error al actualizar estado");
    },
  });

  // SOLUCCIÓN AL RUNTIME ERROR: Acceso 100% seguro durante estados transitorios de carga
  const sinLeer = data?.kpis?.sinLeer ?? 0;
  const notificaciones = data?.data ?? [];

  const getIcon = (tipo: TipoNotificacion, leido: boolean) => {
    const iconClass = cn(
      "size-4",
      leido ? "text-stone-500" : "text-primary"
    );
    switch (tipo) {
      case 'stock_bajo': return <Package className={iconClass} />;
      case 'orden_produccion':
      case 'confeccion_completada': return <Clock className={iconClass} />;
      case 'pago_pendiente':
      case 'cotizacion_expirada': return <AlertTriangle className={iconClass} />;
      case 'pedido_vencido':
      case 'devolucion_solicitada': return <AlertTriangle className={iconClass} />;
      case 'sistema':
      default: return <Bell className={iconClass} />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex size-10 items-center justify-center rounded-full hover:bg-stone-100 transition-colors focus:outline-none">
          <Bell className="size-5 text-stone-600" />
          {sinLeer > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-primary/70 opacity-75" />
              <span className="relative inline-flex items-center justify-center rounded-full size-4 bg-primary text-[10px] font-black text-primary-foreground">
                {sinLeer > 99 ? '99+' : sinLeer}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] p-0 shadow-xl border-stone-200/60 rounded-2xl overflow-hidden z-[110] bg-white">
        
        {/* CABECERA FIJA */}
        <div className="px-5 py-4 border-b border-stone-100 bg-white flex justify-between items-center">
          <h4 className="text-xs font-black uppercase tracking-widest text-stone-950">Notificaciones</h4>
          {sinLeer > 0 && (
            <span className="text-[10px] font-black text-primary bg-rose-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle size={12}/>
              {sinLeer} {sinLeer === 1 ? 'Pendiente' : 'Pendientes'}
            </span>
          )}
        </div>

        {/* ÁREA SCROLLABLE */}
        <div className="max-h-[350px] overflow-y-auto bg-white custom-scrollbar">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-stone-400 text-xs font-bold uppercase tracking-wider gap-2">
              <Loader2 className="animate-spin text-primary" size={18} /> Sincronizando...
            </div>
          ) : error ? (
            <div className="h-40 flex items-center justify-center text-primary text-xs font-bold p-4 text-center uppercase tracking-wider">
              Error al cargar las notificaciones.
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-6">
              <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
              <p className="text-stone-900 text-xs font-black uppercase tracking-wider">¡Todo al día!</p>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-tight mt-0.5">No hay nuevas alertas.</p>
            </div>
          ) : (
            notificaciones.map((n) => (
              <div 
                key={String(n.id)} 
                className={cn(
                  "p-4 transition-colors flex items-start gap-4 group relative cursor-pointer border-b border-stone-50",
                  n.leido ? 'bg-white' : 'bg-rose-50/[0.25]',
                  'hover:bg-stone-50/70'
                )}
                onClick={() => {
                  if (n.url_destino) {
                    router.push(n.url_destino);
                  }
                  if (!n.leido) {
                    mutation.mutate(String(n.id));
                  }
                }}
              >
                {/* Icono Tipo */}
                <div className={cn(
                  "shrink-0 size-10 rounded-xl flex items-center justify-center border",
                  n.leido ? 'bg-stone-100 border-stone-200' : 'bg-white border-rose-100 shadow-sm'
                )}>
                  {getIcon(n.tipo, n.leido)}
                </div>
                
                {/* Contenido */}
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-sm font-bold leading-tight tracking-tight",
                      n.leido ? 'text-stone-700' : 'text-stone-950 font-black'
                    )}>
                      {n.titulo}
                    </p>
                    {!n.leido && (
                      <span className="size-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-normal mt-1">
                    {n.mensaje}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-2 font-bold uppercase tracking-wider">
                    {(() => {
                      const d = new Date(n.created_at);
                      if (isNaN(d.getTime())) return 'Fecha no disponible';
                      return `${d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })} • ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
                    })()}
                  </p>
                </div>

                {/* Acción Rápida (Hover) */}
                {!n.leido && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      mutation.mutate(String(n.id));
                    }}
                    className="absolute right-3 top-4 p-1.5 rounded-full bg-white border border-stone-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-50"
                    title="Marcar como leída"
                  >
                    <MailOpen size={14} className="text-stone-600" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* FOOTER */}
        <div className="p-2 border-t border-stone-100 bg-white">
          <Button 
            variant="ghost" 
            className="w-full text-[10px] font-black text-stone-500 hover:text-primary hover:bg-stone-50 uppercase tracking-widest rounded-xl py-5"
            onClick={() => router.push('/admin/Panel-Administrativo/notificaciones')}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}