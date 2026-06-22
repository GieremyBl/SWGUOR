import { prisma } from '@/lib/prisma';
import { TIPO_INCIDENCIA_CLIENTE_LABELS } from '@/lib/constants/incidencias-cliente';
import { crearIncidenciaClienteSchema } from '@/lib/schemas/incidencias-cliente';
import { IncidenciasClienteService } from '@/lib/services/incidencias-cliente.service';
import type { TipoIncidenciaCliente } from '@prisma/client';

const PREVIEW_TTL_MS = 30 * 60 * 1000;

export const SEVERIDADES_INCIDENCIA_GUORINO = ['baja', 'media', 'alta'] as const;
export type SeveridadIncidenciaGuorino = (typeof SEVERIDADES_INCIDENCIA_GUORINO)[number];

export interface GuorinoIncidenciaPreview {
  id: string;
  cliente_id: string;
  created_at: string;
  expira_en: string;
  pedido_id: number;
  pedido_estado: string | null;
  tipo: TipoIncidenciaCliente;
  tipo_label: string;
  severidad: SeveridadIncidenciaGuorino;
  descripcion: string;
  descripcion_final: string;
  errores: string[];
}

function clavePreview(clienteId: bigint, previewId: string) {
  return `guorino_incidencia_preview_${clienteId}_${previewId}`;
}

function formatearDescripcion(
  severidad: SeveridadIncidenciaGuorino,
  descripcion: string,
): string {
  return `[Severidad: ${severidad}] ${descripcion.trim()}`;
}

async function guardarPreview(clienteId: bigint, preview: GuorinoIncidenciaPreview) {
  await prisma.configuracion_sistema.upsert({
    where: { clave: clavePreview(clienteId, preview.id) },
    create: {
      clave: clavePreview(clienteId, preview.id),
      valor: JSON.stringify(preview),
      categoria: 'guorino',
      tipo_dato: 'json',
      descripcion: 'Borrador de incidencia Guorino',
    },
    update: { valor: JSON.stringify(preview), updated_at: new Date() },
  });
}

async function leerPreview(
  clienteId: bigint,
  previewId: string,
): Promise<GuorinoIncidenciaPreview | null> {
  const row = await prisma.configuracion_sistema.findUnique({
    where: { clave: clavePreview(clienteId, previewId) },
    select: { valor: true },
  });
  if (!row?.valor) return null;
  try {
    const preview = JSON.parse(row.valor) as GuorinoIncidenciaPreview;
    if (new Date(preview.expira_en).getTime() < Date.now()) return null;
    return preview;
  } catch {
    return null;
  }
}

async function eliminarPreview(clienteId: bigint, previewId: string) {
  await prisma.configuracion_sistema.deleteMany({
    where: { clave: clavePreview(clienteId, previewId) },
  });
}

export async function prepararIncidenciaGuorino(params: {
  clienteId: bigint;
  pedido_id: number;
  tipo: string;
  descripcion: string;
  severidad?: string;
}): Promise<GuorinoIncidenciaPreview> {
  const errores: string[] = [];
  const severidad = SEVERIDADES_INCIDENCIA_GUORINO.includes(
    params.severidad as SeveridadIncidenciaGuorino,
  )
    ? (params.severidad as SeveridadIncidenciaGuorino)
    : 'media';

  const tipoRaw = params.tipo as TipoIncidenciaCliente;
  const tipoValido = TIPO_INCIDENCIA_CLIENTE_LABELS[tipoRaw] ? tipoRaw : null;
  if (!tipoValido) {
    errores.push('Tipo de incidencia no válido.');
  }

  const descripcion = params.descripcion?.trim() ?? '';
  if (descripcion.length < 10) {
    errores.push('La descripción debe tener al menos 10 caracteres.');
  }

  const pedido = await prisma.pedidos.findFirst({
    where: { id: BigInt(params.pedido_id), cliente_id: params.clienteId },
    select: { id: true, estado: true },
  });

  if (!pedido) {
    errores.push('El pedido no existe o no pertenece a su cuenta.');
  }

  const ahora = new Date();
  const previewId = `inc_prev_${Date.now()}`;
  const descripcionFinal = formatearDescripcion(severidad, descripcion);

  const preview: GuorinoIncidenciaPreview = {
    id: previewId,
    cliente_id: String(params.clienteId),
    created_at: ahora.toISOString(),
    expira_en: new Date(ahora.getTime() + PREVIEW_TTL_MS).toISOString(),
    pedido_id: params.pedido_id,
    pedido_estado: pedido?.estado ?? null,
    tipo: tipoValido ?? 'otro',
    tipo_label: tipoValido ? TIPO_INCIDENCIA_CLIENTE_LABELS[tipoValido] : 'Otro',
    severidad,
    descripcion,
    descripcion_final: descripcionFinal,
    errores,
  };

  await guardarPreview(params.clienteId, preview);
  return preview;
}

export async function obtenerPreviewIncidenciaGuorino(
  clienteId: bigint,
  previewId: string,
): Promise<GuorinoIncidenciaPreview | null> {
  const preview = await leerPreview(clienteId, previewId);
  if (!preview || preview.cliente_id !== String(clienteId)) return null;
  return preview;
}

export async function confirmarIncidenciaGuorino(params: {
  clienteId: bigint;
  previewId: string;
}): Promise<{ incidenciaId: bigint }> {
  const preview = await leerPreview(params.clienteId, params.previewId);
  if (!preview) {
    throw new Error(
      'La previsualización de la incidencia expiró. Solicite a Guorino armar el reporte nuevamente.',
    );
  }

  if (preview.errores.length > 0) {
    throw new Error('No se puede registrar la incidencia porque hay datos inválidos.');
  }

  const input = crearIncidenciaClienteSchema.parse({
    pedido_id: preview.pedido_id,
    tipo: preview.tipo,
    descripcion: preview.descripcion_final,
    evidencia_url: [],
  });

  const creada = await IncidenciasClienteService.crearParaCliente(params.clienteId, input);
  await eliminarPreview(params.clienteId, params.previewId);

  return { incidenciaId: BigInt(creada.id as string | number) };
}

export async function rechazarPreviewIncidenciaGuorino(clienteId: bigint, previewId: string) {
  await eliminarPreview(clienteId, previewId);
}
