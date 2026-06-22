'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePortal } from '@/lib/hooks/usePortal';
import {
  GUORINO_MENSAJE_INICIAL,
  crearMensajeBot,
  crearMensajeUsuario,
} from '@/lib/constants/guorino-chat';
import type { GuorinoChatMessage, GuorinoConversacion } from '@/lib/types/guorino-chat';

interface UseGuorinoChatOptions {
  autoCargar?: boolean;
}

export function useGuorinoChat(options: UseGuorinoChatOptions = {}) {
  const { autoCargar = true } = options;
  const { cliente } = usePortal();
  const esCliente = Boolean(cliente?.id);

  const [mensajes, setMensajes] = useState<GuorinoChatMessage[]>([GUORINO_MENSAJE_INICIAL]);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [historial, setHistorial] = useState<GuorinoConversacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorSync, setErrorSync] = useState<string | null>(null);
  const mensajesRef = useRef(mensajes);
  mensajesRef.current = mensajes;

  const persistirMensajes = useCallback(
    async (convId: string, msgs: GuorinoChatMessage[]) => {
      if (!esCliente) return;
      await fetch('/api/portal/guorino/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'guardar', conversacion_id: convId, mensajes: msgs }),
      });
    },
    [esCliente],
  );

  const refrescarHistorial = useCallback(async () => {
    if (!esCliente) return;
    const res = await fetch('/api/portal/guorino/conversaciones');
    if (!res.ok) return;
    const json = await res.json();
    setHistorial(json.data?.conversaciones ?? []);
    return json.data as {
      activa_id: string | null;
      conversacion_activa: GuorinoConversacion | null;
    };
  }, [esCliente]);

  const iniciarNuevaConversacion = useCallback(async () => {
    if (!esCliente) {
      setMensajes([GUORINO_MENSAJE_INICIAL]);
      setConversacionId(null);
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch('/api/portal/guorino/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'nueva' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo crear la conversación');

      const conv = json.data as GuorinoConversacion;
      const iniciales = [GUORINO_MENSAJE_INICIAL];
      setConversacionId(conv.id);
      setMensajes(iniciales);
      await persistirMensajes(conv.id, iniciales);
      await refrescarHistorial();
    } finally {
      setSyncing(false);
    }
  }, [esCliente, persistirMensajes, refrescarHistorial]);

  const cargarConversaciones = useCallback(async () => {
    if (!esCliente) return;
    setSyncing(true);
    setErrorSync(null);
    try {
      const data = await refrescarHistorial();
      if (data?.conversacion_activa?.mensajes?.length) {
        setConversacionId(data.conversacion_activa.id);
        setMensajes(data.conversacion_activa.mensajes);
        return;
      }
      await iniciarNuevaConversacion();
    } catch {
      setErrorSync('No se pudo cargar el historial de Guorino.');
    } finally {
      setSyncing(false);
    }
  }, [esCliente, iniciarNuevaConversacion, refrescarHistorial]);

  useEffect(() => {
    if (autoCargar && esCliente) {
      void cargarConversaciones();
    }
  }, [autoCargar, esCliente, cargarConversaciones]);

  const limpiarChat = useCallback(async () => {
    if (!esCliente) {
      setMensajes([GUORINO_MENSAJE_INICIAL]);
      return;
    }
    setSyncing(true);
    try {
      await fetch('/api/portal/guorino/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'limpiar' }),
      });
      await iniciarNuevaConversacion();
    } finally {
      setSyncing(false);
    }
  }, [esCliente, iniciarNuevaConversacion]);

  const activarConversacion = useCallback(
    async (id: string) => {
      if (!esCliente) return;
      setSyncing(true);
      try {
        const res = await fetch('/api/portal/guorino/conversaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion: 'activar', conversacion_id: id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        const conv = json.data as GuorinoConversacion;
        setConversacionId(conv.id);
        setMensajes(conv.mensajes.length ? conv.mensajes : [GUORINO_MENSAJE_INICIAL]);
        await refrescarHistorial();
      } finally {
        setSyncing(false);
      }
    },
    [esCliente, refrescarHistorial],
  );

  const enviarMensaje = useCallback(
    async (texto: string) => {
      const textoTrimmed = texto.trim();
      if (!textoTrimmed || loading) return;

      let convId = conversacionId;
      if (esCliente && !convId) {
        const res = await fetch('/api/portal/guorino/conversaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion: 'nueva' }),
        });
        const json = await res.json();
        convId = json.data?.id ?? null;
        setConversacionId(convId);
      }

      const mensajeUsuario = crearMensajeUsuario(textoTrimmed);
      const nuevosMensajes = [...mensajesRef.current, mensajeUsuario];
      setMensajes(nuevosMensajes);
      setLoading(true);

      try {
        const historialParaAPI = nuevosMensajes
          .slice(1)
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          }));

        const res = await fetch('/api/portal/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historialParaAPI, cliente_id: cliente?.id }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            setMensajes((prev) => [
              ...prev,
              crearMensajeBot('Su sesión ha expirado. Por favor, inicie sesión nuevamente.'),
            ]);
            return;
          }
          throw new Error(errData.error || `Error ${res.status}`);
        }

        const data = await res.json();
        const respuesta = crearMensajeBot(data.text ?? 'Sin respuesta.', data.ui_blocks);
        const conRespuesta = [...nuevosMensajes, respuesta];
        setMensajes(conRespuesta);

        if (esCliente && convId) {
          await persistirMensajes(convId, conRespuesta);
          await refrescarHistorial();
        }
      } catch {
        setMensajes((prev) => [
          ...prev,
          crearMensajeBot('No pude procesar su consulta. Por favor, intente nuevamente.'),
        ]);
      } finally {
        setLoading(false);
      }
    },
    [cliente?.id, conversacionId, esCliente, loading, persistirMensajes, refrescarHistorial],
  );

  const marcarPedidoConfirmado = useCallback(
    async (pedidoId: string, previewId: string) => {
      setMensajes((prev) => {
        const updated = prev.map((m) => {
          if (!m.ui_blocks?.some((b) => b.type === 'pedido_preview' && b.preview_id === previewId)) {
            return m;
          }
          const nuevosBlocks = [
            ...m.ui_blocks.filter(
              (b) =>
                !(
                  b.type === 'decision' &&
                  b.accion === 'confirmar_pedido' &&
                  b.preview_id === previewId
                ),
            ),
            {
              type: 'pedido_confirmado' as const,
              pedido_id: pedidoId,
              mensaje: `Pedido #${pedidoId} registrado correctamente.`,
            },
          ];
          return { ...m, ui_blocks: nuevosBlocks };
        });

        if (esCliente && conversacionId) {
          void persistirMensajes(conversacionId, updated);
        }
        return updated;
      });
      await refrescarHistorial();
    },
    [conversacionId, esCliente, persistirMensajes, refrescarHistorial],
  );

  const marcarIncidenciaConfirmada = useCallback(
    async (incidenciaId: string, previewId: string) => {
      setMensajes((prev) => {
        const updated = prev.map((m) => {
          if (
            !m.ui_blocks?.some(
              (b) => b.type === 'incidencia_preview' && b.preview_id === previewId,
            )
          ) {
            return m;
          }
          const nuevosBlocks = [
            ...m.ui_blocks.filter(
              (b) =>
                !(
                  b.type === 'decision' &&
                  b.accion === 'confirmar_incidencia' &&
                  b.preview_id === previewId
                ),
            ),
            {
              type: 'incidencia_confirmada' as const,
              incidencia_id: incidenciaId,
              mensaje: `Incidencia #${incidenciaId} registrada en soporte.`,
            },
          ];
          return { ...m, ui_blocks: nuevosBlocks };
        });

        if (esCliente && conversacionId) {
          void persistirMensajes(conversacionId, updated);
        }
        return updated;
      });
      await refrescarHistorial();
    },
    [conversacionId, esCliente, persistirMensajes, refrescarHistorial],
  );

  return {
    mensajes,
    historial,
    conversacionId,
    loading,
    syncing,
    errorSync,
    esCliente,
    enviarMensaje,
    limpiarChat,
    activarConversacion,
    iniciarNuevaConversacion,
    cargarConversaciones,
    marcarPedidoConfirmado,
    marcarIncidenciaConfirmada,
  };
}
