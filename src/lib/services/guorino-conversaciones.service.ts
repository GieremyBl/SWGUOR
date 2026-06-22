import { prisma } from '@/lib/prisma';
import type {
  GuorinoChatMessage,
  GuorinoConversacion,
  GuorinoConversacionesStore,
} from '@/lib/types/guorino-chat';

const CATEGORIA = 'guorino';
const MAX_CONVERSACIONES = 30;

function claveConversaciones(clienteId: bigint): string {
  return `guorino_conversaciones_${clienteId}`;
}

function storeVacio(): GuorinoConversacionesStore {
  return { activa_id: null, conversaciones: [] };
}

function parseStore(raw: string | null | undefined): GuorinoConversacionesStore {
  if (!raw?.trim()) return storeVacio();
  try {
    const parsed = JSON.parse(raw) as GuorinoConversacionesStore;
    if (!Array.isArray(parsed.conversaciones)) return storeVacio();
    return {
      activa_id: parsed.activa_id ?? null,
      conversaciones: parsed.conversaciones,
    };
  } catch {
    return storeVacio();
  }
}

async function leerStore(clienteId: bigint): Promise<GuorinoConversacionesStore> {
  const row = await prisma.configuracion_sistema.findUnique({
    where: { clave: claveConversaciones(clienteId) },
    select: { valor: true },
  });
  return parseStore(row?.valor);
}

async function guardarStore(clienteId: bigint, store: GuorinoConversacionesStore) {
  const valor = JSON.stringify({
    activa_id: store.activa_id,
    conversaciones: store.conversaciones.slice(0, MAX_CONVERSACIONES),
  });

  await prisma.configuracion_sistema.upsert({
    where: { clave: claveConversaciones(clienteId) },
    create: {
      clave: claveConversaciones(clienteId),
      valor,
      categoria: CATEGORIA,
      tipo_dato: 'json',
      descripcion: 'Historial de chat Guorino por cliente',
    },
    update: { valor, updated_at: new Date() },
  });
}

function tituloDesdeMensaje(mensaje: string): string {
  const limpio = mensaje.trim().replace(/\s+/g, ' ');
  if (!limpio) return 'Conversación sin título';
  return limpio.length > 48 ? `${limpio.slice(0, 48)}…` : limpio;
}

export async function listarConversacionesGuorino(
  clienteId: bigint,
): Promise<GuorinoConversacionesStore> {
  return leerStore(clienteId);
}

export async function obtenerConversacionActivaGuorino(
  clienteId: bigint,
): Promise<GuorinoConversacion | null> {
  const store = await leerStore(clienteId);
  if (!store.activa_id) return null;
  return store.conversaciones.find((c) => c.id === store.activa_id) ?? null;
}

export async function iniciarConversacionGuorino(
  clienteId: bigint,
  mensajeInicial?: GuorinoChatMessage,
): Promise<GuorinoConversacion> {
  const store = await leerStore(clienteId);
  const ahora = new Date().toISOString();
  const nueva: GuorinoConversacion = {
    id: `conv_${Date.now()}`,
    titulo: mensajeInicial?.role === 'user' ? tituloDesdeMensaje(mensajeInicial.content) : 'Nueva conversación',
    mensajes: mensajeInicial ? [mensajeInicial] : [],
    created_at: ahora,
    updated_at: ahora,
  };

  store.conversaciones.unshift(nueva);
  store.activa_id = nueva.id;
  await guardarStore(clienteId, store);
  return nueva;
}

export async function guardarMensajesConversacionGuorino(
  clienteId: bigint,
  conversacionId: string,
  mensajes: GuorinoChatMessage[],
) {
  const store = await leerStore(clienteId);
  const idx = store.conversaciones.findIndex((c) => c.id === conversacionId);
  if (idx < 0) return null;

  const primerUsuario = mensajes.find((m) => m.role === 'user');
  store.conversaciones[idx] = {
    ...store.conversaciones[idx],
    mensajes,
    titulo: primerUsuario ? tituloDesdeMensaje(primerUsuario.content) : store.conversaciones[idx].titulo,
    updated_at: new Date().toISOString(),
  };
  store.activa_id = conversacionId;
  await guardarStore(clienteId, store);
  return store.conversaciones[idx];
}

export async function archivarConversacionActivaGuorino(clienteId: bigint) {
  const store = await leerStore(clienteId);
  store.activa_id = null;
  await guardarStore(clienteId, store);
  return store;
}

export async function activarConversacionGuorino(clienteId: bigint, conversacionId: string) {
  const store = await leerStore(clienteId);
  const existe = store.conversaciones.some((c) => c.id === conversacionId);
  if (!existe) return null;
  store.activa_id = conversacionId;
  await guardarStore(clienteId, store);
  return store.conversaciones.find((c) => c.id === conversacionId) ?? null;
}
