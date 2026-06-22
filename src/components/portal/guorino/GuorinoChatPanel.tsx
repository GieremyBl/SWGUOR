'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, History, Loader2, Trash2, X } from 'lucide-react';
import { GuorinoChatBlocks } from '@/components/portal/guorino/GuorinoChatBlocks';
import { GuorinoChatHistory } from '@/components/portal/guorino/GuorinoChatHistory';
import { GUORINO_MENSAJE_INICIAL, GUORINO_PREGUNTAS_FRECUENTES } from '@/lib/constants/guorino-chat';
import { useGuorinoChat } from '@/lib/hooks/useGuorinoChat';
import { cn } from '@/lib/utils';
import type { GuorinoChatMessage } from '@/lib/types/guorino-chat';

const GuorinoIcon = ({ size = 18, color = '#D4AF37' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L15 8.5L22 9.3L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.3L9 8.5Z" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <line x1="22" y1="2" x2="11" y2="13" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#D4AF37" />
  </svg>
);

interface Props {
  variant?: 'widget' | 'page';
  onClose?: () => void;
  showHistory?: boolean;
  className?: string;
}

function GuorinoMensajeBubble({ mensaje }: { mensaje: GuorinoChatMessage }) {
  const esUsuario = mensaje.role === 'user';
  return (
    <div className={cn('flex', esUsuario ? 'justify-end' : 'justify-start')}>
      <div
        className="text-[12.5px] leading-relaxed whitespace-pre-wrap"
        style={{
          maxWidth: '90%',
          padding: '11px 15px',
          borderRadius: esUsuario ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: esUsuario ? '#1a1409' : '#fff',
          color: esUsuario ? '#f5e6c0' : '#2c2010',
          border: esUsuario ? 'none' : '0.5px solid #e8e3da',
        }}
      >
        {mensaje.content}
      </div>
    </div>
  );
}

export function GuorinoChatPanel({
  variant = 'widget',
  onClose,
  showHistory,
  className,
}: Props) {
  const mostrarHistorial = showHistory ?? variant === 'page';
  const {
    mensajes,
    historial,
    conversacionId,
    loading,
    syncing,
    enviarMensaje,
    limpiarChat,
    activarConversacion,
    iniciarNuevaConversacion,
    marcarPedidoConfirmado,
    marcarIncidenciaConfirmada,
  } = useGuorinoChat({ autoCargar: true });

  const [mensaje, setMensaje] = useState('');
  const [historialAbierto, setHistorialAbierto] = useState(mostrarHistorial);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, loading]);

  const handleEnviar = (texto: string) => {
    void enviarMensaje(texto);
    setMensaje('');
  };

  const handleDecision = (texto: string) => {
    void enviarMensaje(texto);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar(mensaje);
    }
  };

  const soloInicial =
    mensajes.length === 1 && mensajes[0]?.id === GUORINO_MENSAJE_INICIAL.id;

  const contenidoMensajes = (
    <>
      {mensajes.map((m) => (
        <div key={m.id}>
          <GuorinoMensajeBubble mensaje={m} />
          {m.ui_blocks && m.ui_blocks.length > 0 && m.role === 'bot' && (
            <div className="pl-1">
              <GuorinoChatBlocks
                blocks={m.ui_blocks}
                onDecision={handleDecision}
                onPedidoConfirmado={(pedidoId, previewId) => {
                  const previewBlock = m.ui_blocks?.find(
                    (b) => b.type === 'pedido_preview',
                  );
                  const pid =
                    previewId ??
                    (previewBlock?.type === 'pedido_preview' ? previewBlock.preview_id : '');
                  if (pid) void marcarPedidoConfirmado(pedidoId, pid);
                }}
                onIncidenciaConfirmada={(incidenciaId, previewId) => {
                  const previewBlock = m.ui_blocks?.find(
                    (b) => b.type === 'incidencia_preview',
                  );
                  const pid =
                    previewId ??
                    (previewBlock?.type === 'incidencia_preview' ? previewBlock.preview_id : '');
                  if (pid) void marcarIncidenciaConfirmada(incidenciaId, pid);
                }}
              />
            </div>
          )}
        </div>
      ))}

      {soloInicial && (
        <div className="flex flex-col gap-1.5 mt-1">
          <p className="text-[9px] font-bold text-[#a89060] uppercase tracking-wider pl-0.5">
            Consultas frecuentes
          </p>
          {GUORINO_PREGUNTAS_FRECUENTES.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => handleEnviar(q.prompt)}
              disabled={loading}
              className="flex items-center justify-between w-full text-left transition-all disabled:opacity-50 rounded-[10px] px-3 py-2 bg-white border border-[#ddd8ce] text-[11.5px] text-[#5a4a2a] font-medium hover:border-[#D4AF37] hover:text-[#1a1409]"
            >
              {q.label}
              <ArrowRight size={13} color="#D4AF37" />
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[#a89060] text-[11px]">
          <Loader2 size={13} className="animate-spin" />
          <span>Guorino está escribiendo…</span>
        </div>
      )}
    </>
  );

  const header = (
    <div className="flex items-center gap-3 px-5 py-4 shrink-0 bg-[#1a1409]">
      <div
        className="flex items-center justify-center shrink-0 w-10 h-10 rounded-full"
        style={{ background: '#2c2010', border: '1.5px solid #D4AF37' }}
      >
        <GuorinoIcon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white tracking-wide">Guorino — Asesor GUOR</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-[7px] h-[7px] rounded-full bg-emerald-500 inline-block" />
          <span className="text-[10px] text-[#D4AF37] font-medium">En línea · Responde al instante</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {mostrarHistorial && (
          <button
            type="button"
            title="Historial"
            onClick={() => setHistorialAbierto((v) => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2c2010] hover:opacity-80"
          >
            <History size={14} color="#a89060" />
          </button>
        )}
        <button
          type="button"
          title="Limpiar chat"
          disabled={syncing}
          onClick={() => void limpiarChat()}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2c2010] hover:opacity-80 disabled:opacity-50"
        >
          <Trash2 size={14} color="#a89060" />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2c2010] hover:opacity-80"
          >
            <X size={14} color="#a89060" />
          </button>
        )}
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center gap-2 px-3 py-3 shrink-0 bg-white border-t border-[#ede8e0]">
      <input
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading || syncing}
        placeholder="Escriba su consulta o pedido…"
        className="flex-1 outline-none disabled:opacity-60 bg-[#f5f2ed] border border-[#e2ddd5] rounded-[22px] px-4 py-2.5 text-xs text-[#2c2010]"
      />
      <button
        type="button"
        onClick={() => handleEnviar(mensaje)}
        disabled={loading || syncing || !mensaje.trim()}
        className="w-[38px] h-[38px] rounded-full bg-[#1a1409] flex items-center justify-center shrink-0 disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform"
      >
        {loading ? (
          <Loader2 size={16} color="#D4AF37" className="animate-spin" />
        ) : (
          <SendIcon />
        )}
      </button>
    </div>
  );

  if (variant === 'page') {
    return (
      <div
        ref={panelRef}
        className={cn(
          'flex h-[calc(100vh-8rem)] min-h-[520px] rounded-2xl border border-[#e2ddd5] overflow-hidden bg-white shadow-sm',
          className,
        )}
      >
        {historialAbierto && (
          <GuorinoChatHistory
            className="w-[240px]"
            conversaciones={historial}
            activaId={conversacionId}
            onSelect={(id) => void activarConversacion(id)}
            onNueva={() => void iniciarNuevaConversacion()}
          />
        )}
        <div className="flex flex-col flex-1 min-w-0">
          {header}
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 bg-[#faf9f7]">
            {contenidoMensajes}
          </div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'flex flex-col overflow-hidden',
        className,
      )}
      style={{
        width: historialAbierto ? 520 : 360,
        height: 560,
        borderRadius: 28,
        border: '0.5px solid #e2ddd5',
        background: '#fff',
        boxShadow: '0 8px 40px rgba(26,20,9,0.13)',
      }}
    >
      <div className="flex flex-1 min-h-0">
        {historialAbierto && (
          <GuorinoChatHistory
            className="w-[160px]"
            conversaciones={historial}
            activaId={conversacionId}
            onSelect={(id) => void activarConversacion(id)}
            onNueva={() => void iniciarNuevaConversacion()}
          />
        )}
        <div className="flex flex-col flex-1 min-w-0">
          {header}
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 bg-[#faf9f7]">
            {contenidoMensajes}
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}

export { GuorinoIcon };
