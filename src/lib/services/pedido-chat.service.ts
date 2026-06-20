import { getGeminiFlashModel } from '@/lib/gemini';
import { resolveGeminiModelId } from '@/lib/helpers/gemini-models.helper';
import { EMPRESA_GUOR } from '@/lib/constants/empresa';
import type { ServerAuthUser } from '@/lib/auth/server';
import type { ModoAccesoPedido } from '@/lib/helpers/pedido-acceso.helper';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';

export const MENSAJE_ESCALACION_HUMANO =
  'He notificado a nuestro equipo. Un asesor humano te responderá por este mismo medio a la brevedad.';

export type MensajeChatPedido = {
  id: string;
  pedido_id: string;
  usuario_id: number | null;
  emisor: string;
  contenido: string;
  solicita_humano: boolean;
  created_at: string;
};

export class PedidoChatError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.name = 'PedidoChatError';
    this.code = code;
    this.status = status;
  }
}

function mapMensaje(row: {
  id: bigint;
  pedido_id: bigint;
  usuario_id: bigint | null;
  emisor: string;
  contenido: string;
  solicita_humano: boolean;
  created_at: Date;
}): MensajeChatPedido {
  const serializado = serializeBigInt(row) as Record<string, unknown>;
  return {
    id: String(serializado.id),
    pedido_id: String(serializado.pedido_id),
    usuario_id: serializado.usuario_id != null ? Number(serializado.usuario_id) : null,
    emisor: String(serializado.emisor),
    contenido: String(serializado.contenido),
    solicita_humano: Boolean(serializado.solicita_humano),
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(serializado.created_at),
  };
}

export async function listarMensajesChatPedido(
  pedidoId: bigint,
): Promise<MensajeChatPedido[]> {
  const rows = await prisma.mensajes_soporte.findMany({
    where: { pedido_id: pedidoId },
    orderBy: { created_at: 'asc' },
  });
  return rows.map(mapMensaje);
}

function buildSystemPrompt(pedido: {
  id: bigint;
  estado: string | null;
  saldo_pendiente: unknown;
  total: unknown;
}): string {
  const estado = pedido.estado ?? 'desconocido';
  const total = Number(pedido.total ?? 0);
  const saldo = Number(pedido.saldo_pendiente ?? 0);

  return [
    `Eres el asistente virtual de soporte de ${EMPRESA_GUOR.razon_social}.`,
    'Respondes en español, tono corporativo, cordial y conciso (máximo 3 párrafos cortos).',
    'Solo hablas del pedido del cliente; no inventes datos ni promesas que no estén en el contexto.',
    'Si no puedes resolver algo, indica que un asesor humano puede ayudar por este mismo chat.',
    '',
    'Contexto del pedido:',
    `- ID pedido: ${String(pedido.id)}`,
    `- Estado actual: ${estado}`,
    `- Total del pedido: S/ ${total.toFixed(2)}`,
    `- Saldo pendiente: S/ ${saldo.toFixed(2)}`,
  ].join('\n');
}

export async function generarRespuestaGeminiPedido(
  mensajeCliente: string,
  pedido: {
    id: bigint;
    estado: string | null;
    saldo_pendiente: unknown;
    total: unknown;
  },
): Promise<string> {
  const modelId = await resolveGeminiModelId({ purpose: 'default' });
  const model = getGeminiFlashModel(modelId);
  const systemPrompt = buildSystemPrompt(pedido);

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${systemPrompt}\n\nMensaje del cliente:\n${mensajeCliente}`,
          },
        ],
      },
    ],
  });

  const texto = result.response.text()?.trim();
  if (!texto) {
    throw new PedidoChatError('respuesta_vacia', 500, 'Gemini no devolvió texto');
  }
  return texto;
}

export type ProcesarMensajeChatResult = { tipo: 'historial'; mensajes: MensajeChatPedido[] };

export async function procesarMensajeChatPedido(params: {
  pedidoId: bigint;
  auth: ServerAuthUser;
  modo: ModoAccesoPedido;
  esClienteDueño: boolean;
  contenido: string;
  emisor: string;
  solicita_humano: boolean;
}): Promise<ProcesarMensajeChatResult> {
  const contenido = params.contenido?.trim();
  if (!contenido) {
    throw new PedidoChatError('contenido_requerido', 400);
  }

  const emisor = params.emisor?.trim().toLowerCase();
  if (emisor !== 'admin' && emisor !== 'cliente') {
    throw new PedidoChatError('emisor_invalido', 400);
  }

  if (emisor === 'admin' && params.modo !== 'staff') {
    throw new PedidoChatError('sin_permisos', 403);
  }

  if (emisor === 'cliente' && !params.esClienteDueño) {
    throw new PedidoChatError('sin_permisos', 403);
  }

  await prisma.mensajes_soporte.create({
    data: {
      pedido_id: params.pedidoId,
      usuario_id: BigInt(params.auth.id),
      emisor,
      contenido,
      solicita_humano: emisor === 'cliente' && Boolean(params.solicita_humano),
    },
  });

  if (emisor === 'admin') {
    const mensajes = await listarMensajesChatPedido(params.pedidoId);
    return { tipo: 'historial', mensajes };
  }

  if (params.solicita_humano) {
    await prisma.mensajes_soporte.create({
      data: {
        pedido_id: params.pedidoId,
        emisor: 'bot',
        contenido: MENSAJE_ESCALACION_HUMANO,
        solicita_humano: false,
      },
    });
    const mensajes = await listarMensajesChatPedido(params.pedidoId);
    return { tipo: 'historial', mensajes };
  }

  const pedido = await prisma.pedidos.findUnique({
    where: { id: params.pedidoId },
    select: {
      id: true,
      estado: true,
      saldo_pendiente: true,
      total: true,
    },
  });

  if (!pedido) {
    throw new PedidoChatError('pedido_no_encontrado', 404);
  }

  let respuestaBot: string;
  try {
    respuestaBot = await generarRespuestaGeminiPedido(contenido, pedido);
  } catch (error) {
    console.error('[pedido-chat] Gemini error:', error);
    throw new PedidoChatError(
      'error_gemini',
      500,
      'No se pudo generar la respuesta automática',
    );
  }

  await prisma.mensajes_soporte.create({
    data: {
      pedido_id: params.pedidoId,
      emisor: 'bot',
      contenido: respuestaBot,
      solicita_humano: false,
    },
  });

  const mensajes = await listarMensajesChatPedido(params.pedidoId);
  return { tipo: 'historial', mensajes };
}

export function isPedidoChatError(error: unknown): error is PedidoChatError {
  return error instanceof PedidoChatError;
}
