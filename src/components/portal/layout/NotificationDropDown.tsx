'use client';

import { useState } from 'react';
import {
  Bell, Check, FileText, Truck, Layers, Info,
  CheckCircle2, Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePortal } from '@/lib/hooks/usePortal';
import { useNotificationsPortal } from '@/lib/hooks/useNotificacionPortal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ── Helpers visuales ─────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, {
  icon: React.ElementType;
  bg: string;
  iconColor: string;
  badge: string;
  label: string;
}> = {
  cotizacion: {
    icon: FileText,
    bg: 'bg-guor-50 border-guor-200',
    iconColor: 'text-guor-600',
    badge: 'bg-guor-100 text-guor-700',
    label: 'Cotización',
  },
  pedido: {
    icon: Layers,
    bg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Pedido',
  },
  orden_produccion: {
    icon: Layers,
    bg: 'bg-indigo-50 border-indigo-100',
    iconColor: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
    label: 'Producción',
  },
  pedido_vencido: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Listo',
  },
  sistema: {
    icon: Info,
    bg: 'bg-slate-50 border-slate-100',
    iconColor: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-600',
    label: 'Sistema',
  },
  despacho: {
    icon: Truck,
    bg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Despacho',
  },
};

const getTipoConfig = (tipo: string) =>
  TIPO_CONFIG[tipo] ?? {
    icon: Info,
    bg: 'bg-slate-50 border-slate-100',
    iconColor: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-600',
    label: 'Sistema',
  };

const formatFecha = (iso: string | Date) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
};

// ── Componente ────────────────────────────────────────────────────────────────
const MAX_DROPDOWN = 5;

export function NotificationDropdown() {
  const { cliente } = usePortal();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [marcandoTodo, setMarcandoTodo] = useState(false);

  const usuarioId = cliente?.usuario_id;

  // ── ÚNICA FUENTE DE LA VERDAD (Limpio y sin useEffects aquí adentro) ──
  const {
    notificaciones,
    unreadCount: pendientes,
    loading: cargando,
    markAsRead,
    markAllAsRead,
  } = useNotificationsPortal(usuarioId);


  const handleClickNotificacion = async (
    id: number,
    url: string | null | undefined,
    leido: boolean,
  ) => {
    if (!leido) await markAsRead(id);
    setIsOpen(false);
    if (url) router.push(url);
  };

  const visibles = notificaciones.slice(0, MAX_DROPDOWN);

  const handleMarcarTodasComoLeidas = async () => {
    setMarcandoTodo(true);
    await markAllAsRead();
    setMarcandoTodo(false);
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notificaciones"
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full transition-all focus:outline-none',
          isOpen
            ? 'bg-guor-100 text-guor-600'
            : 'text-guor-soft hover:text-guor-600 hover:bg-guor-50'
        )}
      >
        <Bell size={19} strokeWidth={1.8} />
        {pendientes > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-guor-400/60 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full size-[18px] bg-guor-600 text-[9px] font-black text-white border-2 border-white">
              {pendientes > 9 ? '9+' : pendientes}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-[360px] bg-white border border-guor-line rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-guor-50/80 to-white border-b border-guor-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-guor-600" strokeWidth={2.5} />
                <span className="text-[10px] font-black text-guor-ink uppercase tracking-widest">
                  Notificaciones
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pendientes > 0 && (
                  <>
                    <span className="text-[9px] font-black text-guor-700 bg-guor-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {pendientes} {pendientes === 1 ? 'nueva' : 'nuevas'}
                    </span>
                    <button
                      onClick={handleMarcarTodasComoLeidas}
                      disabled={marcandoTodo}
                      className="flex items-center gap-1 text-[9px] font-bold text-guor-600 hover:text-guor-700 uppercase tracking-wide transition-colors disabled:opacity-50"
                    >
                      {marcandoTodo ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Check size={10} />
                      )}
                      Todo leído
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto max-h-[360px] divide-y divide-guor-line/40">
              {cargando && notificaciones.length === 0 && (
                <div className="h-36 flex flex-col items-center justify-center gap-2 text-guor-soft">
                  <Loader2 size={20} className="animate-spin text-guor-600" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Cargando alertas…</p>
                </div>
              )}

              {!cargando && notificaciones.length === 0 && (
                <div className="h-36 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                  <p className="text-[10px] font-black text-guor-soft uppercase tracking-widest">¡Todo al día!</p>
                  <p className="text-[9px] text-guor-300 font-bold uppercase tracking-wide">Sin alertas pendientes</p>
                </div>
              )}

              {visibles.map((n) => {
                const cfg = getTipoConfig(n.tipo);
                const Icon = cfg.icon;

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() =>
                      handleClickNotificacion(
                        Number(n.id),
                        n.url_destino,
                        n.leido,
                      )
                    }
                    className={cn(
                      'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors',
                      n.leido
                        ? 'bg-white hover:bg-guor-bg'
                        : 'bg-guor-50/40 hover:bg-guor-50/70',
                    )}
                  >
                    <div className={cn('shrink-0 size-9 rounded-xl border flex items-center justify-center mt-0.5', cfg.bg)}>
                      <Icon size={14} className={cfg.iconColor} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={cn('text-[9px] font-black uppercase tracking-wider px-1.5 py-px rounded-full', cfg.badge)}>
                          {cfg.label}
                        </span>
                        {!n.leido && <span className="size-1.5 rounded-full bg-guor-500 shrink-0" />}
                      </div>

                      <p className={cn(
                        'text-xs leading-snug break-words',
                        n.leido ? 'text-guor-soft font-medium' : 'text-guor-ink font-bold',
                      )}>
                        {n.titulo}
                      </p>

                      <p className="text-[11px] text-guor-soft mt-0.5 break-words leading-snug">
                        {n.mensaje}
                      </p>

                      <p className="text-[9px] font-bold text-guor-300 uppercase tracking-wider mt-1.5">
                        {formatFecha(n.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })}

              {notificaciones.length > MAX_DROPDOWN && (
                <p className="text-center text-[10px] text-guor-soft py-2 border-t border-guor-line/40">
                  +{notificaciones.length - MAX_DROPDOWN} más en tu bandeja
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}