import type { GuorinoChatMessage } from '@/lib/types/guorino-chat';

export const GUORINO_MENSAJE_INICIAL: GuorinoChatMessage = {
  id: 'msg_inicial',
  role: 'bot',
  content:
    'Bienvenido a GUOR. Soy Guorino, su asesor comercial. Puedo consultar stock, cotizar, generar pedidos y reportar incidencias con previsualización para su confirmación. ¿En qué puedo asistirle hoy?',
  created_at: new Date().toISOString(),
};

export const GUORINO_PREGUNTAS_FRECUENTES = [
  { label: 'Descuentos por volumen', prompt: '¿Cuáles son las escalas de descuentos por volumen de compra?' },
  { label: 'Stock disponible', prompt: '¿Tienen disponibilidad de los modelos de temporada actual?' },
  { label: 'Realizar un pedido', prompt: 'Necesito realizar un pedido. ¿Qué pasos debo seguir?' },
  { label: 'Reportar incidencia', prompt: 'Tuve un problema con uno de mis pedidos y quiero reportar una incidencia.' },
  { label: 'Estado de mis pedidos', prompt: '¿Cuál es el estado de mis últimos pedidos?' },
];

function nuevoIdMensaje(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function crearMensajeUsuario(content: string): GuorinoChatMessage {
  return {
    id: nuevoIdMensaje(),
    role: 'user',
    content,
    created_at: new Date().toISOString(),
  };
}

export function crearMensajeBot(
  content: string,
  ui_blocks?: GuorinoChatMessage['ui_blocks'],
): GuorinoChatMessage {
  return {
    id: nuevoIdMensaje(),
    role: 'bot',
    content,
    created_at: new Date().toISOString(),
    ui_blocks,
  };
}
