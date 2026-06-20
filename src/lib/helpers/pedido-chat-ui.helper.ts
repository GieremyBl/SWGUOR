export type MensajeChatPedidoUI = {
  id: string;
  pedido_id: string;
  usuario_id: number | null;
  emisor: string;
  contenido: string;
  solicita_humano: boolean;
  created_at: string;
};

export function ultimoMensajeCliente(
  mensajes: MensajeChatPedidoUI[],
): MensajeChatPedidoUI | null {
  for (let i = mensajes.length - 1; i >= 0; i -= 1) {
    if (mensajes[i].emisor.toLowerCase() === 'cliente') {
      return mensajes[i];
    }
  }
  return null;
}

/** Indicador de tab: solicitud humana o último mensaje sin respuesta de staff */
export function requiereAtencionChat(mensajes: MensajeChatPedidoUI[]): boolean {
  if (mensajes.length === 0) return false;

  const tieneSolicitudHumana = mensajes.some(
    (m) => m.emisor.toLowerCase() === 'cliente' && m.solicita_humano,
  );
  const ultimo = mensajes[mensajes.length - 1];
  const ultimoEsCliente = ultimo.emisor.toLowerCase() === 'cliente';

  return tieneSolicitudHumana || ultimoEsCliente;
}

export function clienteSolicitoHumano(mensajes: MensajeChatPedidoUI[]): boolean {
  const ultimoCliente = ultimoMensajeCliente(mensajes);
  return Boolean(ultimoCliente?.solicita_humano);
}

export function etiquetaEmisorAdmin(emisor: string): string {
  const e = emisor.toLowerCase();
  if (e === 'admin') return 'Soporte GUOR';
  if (e === 'bot') return 'Asistente virtual';
  if (e === 'cliente') return 'Cliente';
  return emisor;
}
