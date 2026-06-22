'use client';

import { cn } from '@/lib/utils';
import type { GuorinoConversacion } from '@/lib/types/guorino-chat';

interface Props {
  conversaciones: GuorinoConversacion[];
  activaId: string | null;
  onSelect: (id: string) => void;
  onNueva: () => void;
  collapsed?: boolean;
  className?: string;
}

function formatearFecha(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function GuorinoChatHistory({
  conversaciones,
  activaId,
  onSelect,
  onNueva,
  collapsed = false,
  className,
}: Props) {
  if (collapsed) return null;

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[#e8e3da] bg-[#f8f6f2] shrink-0',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-[#e8e3da]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#a89060]">
          Historial
        </p>
        <button
          type="button"
          onClick={onNueva}
          className="text-[10px] font-bold uppercase tracking-wide text-[#5a4a2a] hover:text-[#1a1409]"
        >
          Nueva
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversaciones.length === 0 && (
          <p className="text-[11px] text-slate-500 px-2 py-4 text-center">
            Sin conversaciones previas
          </p>
        )}
        {conversaciones.map((conv) => {
          const activa = conv.id === activaId;
          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full text-left rounded-xl px-3 py-2.5 transition-colors',
                activa
                  ? 'bg-white border border-[#D4AF37]/50 shadow-sm'
                  : 'hover:bg-white/80 border border-transparent',
              )}
            >
              <p className="text-[12px] font-semibold text-[#1a1409] truncate">{conv.titulo}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{formatearFecha(conv.updated_at)}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
