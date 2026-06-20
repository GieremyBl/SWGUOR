'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  clienteSolicitoHumano,
  etiquetaEmisorAdmin,
  type MensajeChatPedidoUI,
  requiereAtencionChat,
} from '@/lib/helpers/pedido-chat-ui.helper';

interface Props {
  pedidoId: number | string;
  onPendienteChange?: (pendiente: boolean) => void;
}

function esAdmin(emisor: string): boolean {
  return emisor.toLowerCase() === 'admin';
}

export function ChatAsistenciaAdmin({ pedidoId, onPendienteChange }: Props) {
  const [mensajes, setMensajes] = useState<MensajeChatPedidoUI[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [texto, setTexto] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const actualizarEstadoPendiente = useCallback(
    (lista: MensajeChatPedidoUI[]) => {
      onPendienteChange?.(requiereAtencionChat(lista));
    },
    [onPendienteChange],
  );

  const scrollAlFinal = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargandoHistorial(true);
      try {
        const res = await fetch(`/api/pedidos/${pedidoId}/chat`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? 'No se pudo cargar el chat');
        }
        const lista = Array.isArray(json.data) ? json.data : [];
        if (activo) {
          setMensajes(lista);
          actualizarEstadoPendiente(lista);
        }
      } catch (e: unknown) {
        if (activo) {
          toast.error(e instanceof Error ? e.message : 'Error al cargar asistencia');
        }
      } finally {
        if (activo) setCargandoHistorial(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [pedidoId, actualizarEstadoPendiente]);

  useEffect(() => {
    scrollAlFinal();
  }, [mensajes, enviando, cargandoHistorial, scrollAlFinal]);

  const handleEnviar = async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    setTexto('');
    setEnviando(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenido,
          emisor: 'admin',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? 'No se pudo enviar el mensaje');
      }
      if (Array.isArray(json.data)) {
        setMensajes(json.data);
        actualizarEstadoPendiente(json.data);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar');
      setTexto(contenido);
    } finally {
      setEnviando(false);
    }
  };

  const mostrarBannerHumano = !cargandoHistorial && clienteSolicitoHumano(mensajes);

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white overflow-hidden min-h-[420px]">
      {mostrarBannerHumano && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-sm text-amber-900">
          El cliente solicitó intervención humana en este pedido.
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[min(52vh,480px)]"
      >
        {cargandoHistorial && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-pink-600 mr-2" />
            <span className="text-sm">Cargando conversación...</span>
          </div>
        )}

        {!cargandoHistorial && mensajes.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            Sin mensajes en este pedido. El historial aparecerá cuando el cliente use asistencia.
          </div>
        )}

        {mensajes.map((m) => {
          const admin = esAdmin(m.emisor);
          return (
            <div
              key={m.id}
              className={cn('flex', admin ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
                  admin
                    ? 'rounded-tr-sm bg-violet-600 text-white'
                    : 'rounded-tl-sm bg-gray-100 border border-gray-200 text-gray-800',
                )}
              >
                <p
                  className={cn(
                    'text-[10px] font-black uppercase tracking-wider mb-1',
                    admin ? 'text-violet-200' : 'text-gray-400',
                  )}
                >
                  {etiquetaEmisorAdmin(m.emisor)}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.contenido}</p>
              </div>
            </div>
          );
        })}

        {enviando && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-tr-sm bg-violet-100 border border-violet-200 px-4 py-3 flex items-center gap-2 text-violet-700 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 p-4">
        <div className="flex gap-2">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEnviar();
              }
            }}
            placeholder="Responder al cliente..."
            disabled={enviando}
            className="rounded-xl border-gray-200 text-sm bg-white"
          />
          <Button
            type="button"
            onClick={handleEnviar}
            disabled={enviando || !texto.trim()}
            className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shrink-0 px-4"
          >
            {enviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
