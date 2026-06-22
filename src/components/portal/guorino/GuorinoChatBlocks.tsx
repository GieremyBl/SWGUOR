'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GuorinoDecisionButtons } from '@/components/portal/guorino/GuorinoDecisionButtons';
import { descargarPreviewPedidoGuorinoPDF } from '@/lib/helpers/guorino-pedido-pdf.helper';
import { descargarPreviewIncidenciaGuorinoPDF } from '@/lib/helpers/guorino-incidencia-pdf.helper';
import type { GuorinoPedidoPreview } from '@/lib/services/guorino-pedido.service';
import type { GuorinoIncidenciaPreview } from '@/lib/services/guorino-incidencia.service';
import type { GuorinoUiBlock } from '@/lib/types/guorino-chat';

interface Props {
  blocks: GuorinoUiBlock[];
  onPedidoConfirmado?: (pedidoId: string, previewId?: string) => void;
  onIncidenciaConfirmada?: (incidenciaId: string, previewId?: string) => void;
  onDecision?: (mensaje: string) => void;
}

export function GuorinoChatBlocks({
  blocks,
  onPedidoConfirmado,
  onIncidenciaConfirmada,
  onDecision,
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pedidoConfirmadoId, setPedidoConfirmadoId] = useState<string | null>(null);
  const [incidenciaConfirmadaId, setIncidenciaConfirmadaId] = useState<string | null>(null);

  const descargarPdf = async (previewId: string) => {
    setLoadingId(`pdf_${previewId}`);
    try {
      const res = await fetch(`/api/portal/guorino/pedidos/${previewId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar la previsualización');
      await descargarPreviewPedidoGuorinoPDF(
        json.data as GuorinoPedidoPreview,
        json.cliente,
      );
      toast.success('PDF de previsualización descargado');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al generar PDF');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmarPedido = async (previewId: string, decisionId: string) => {
    setLoadingId(decisionId);
    try {
      const res = await fetch(`/api/portal/guorino/pedidos/${previewId}/confirmar`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo confirmar el pedido');
      const pedidoId = String(json.data.pedido_id);
      setPedidoConfirmadoId(pedidoId);
      onPedidoConfirmado?.(pedidoId, previewId);
      toast.success('Pedido confirmado');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al confirmar');
    } finally {
      setLoadingId(null);
    }
  };

  const rechazarPedido = async (previewId: string, decisionId: string) => {
    setLoadingId(decisionId);
    try {
      await fetch(`/api/portal/guorino/pedidos/${previewId}/rechazar`, { method: 'POST' });
      onDecision?.('Entendido. No registraré ese pedido. ¿Desea ajustar cantidades o productos?');
      toast.message('Pedido descartado');
    } catch {
      toast.error('No se pudo descartar la previsualización');
    } finally {
      setLoadingId(null);
    }
  };

  const descargarPdfIncidencia = async (previewId: string) => {
    setLoadingId(`pdf_inc_${previewId}`);
    try {
      const res = await fetch(`/api/portal/guorino/incidencias/${previewId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar la previsualización');
      await descargarPreviewIncidenciaGuorinoPDF(
        json.data as GuorinoIncidenciaPreview,
        json.cliente,
      );
      toast.success('PDF de incidencia descargado');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al generar PDF');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmarIncidencia = async (previewId: string, decisionId: string) => {
    setLoadingId(decisionId);
    try {
      const res = await fetch(`/api/portal/guorino/incidencias/${previewId}/confirmar`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo registrar la incidencia');
      const incidenciaId = String(json.data.incidencia_id);
      setIncidenciaConfirmadaId(incidenciaId);
      onIncidenciaConfirmada?.(incidenciaId, previewId);
      toast.success('Incidencia registrada');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al confirmar');
    } finally {
      setLoadingId(null);
    }
  };

  const rechazarIncidencia = async (previewId: string, decisionId: string) => {
    setLoadingId(decisionId);
    try {
      await fetch(`/api/portal/guorino/incidencias/${previewId}/rechazar`, { method: 'POST' });
      onDecision?.('Entendido. No registraré esa incidencia. ¿Desea modificar los datos del reporte?');
      toast.message('Reporte descartado');
    } catch {
      toast.error('No se pudo descartar la previsualización');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-2 mt-2">
      {blocks.map((block, index) => {
        if (block.type === 'incidencia_preview') {
          return (
            <div
              key={`${block.preview_id}-${index}`}
              className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 shadow-sm"
            >
              <p className="text-[11px] font-bold text-[#1a1409]">{block.resumen}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Pedido #{block.pedido_id} · {block.tipo}
              </p>
              <button
                type="button"
                onClick={() => descargarPdfIncidencia(block.preview_id)}
                disabled={loadingId === `pdf_inc_${block.preview_id}`}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-300/50 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-800 hover:border-rose-400"
              >
                {loadingId === `pdf_inc_${block.preview_id}` ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                Previsualizar PDF
              </button>
            </div>
          );
        }

        if (block.type === 'pedido_preview') {
          return (
            <div
              key={`${block.preview_id}-${index}`}
              className="rounded-xl border border-[#e8e3da] bg-white p-3 shadow-sm"
            >
              <p className="text-[11px] font-bold text-[#1a1409]">{block.resumen}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {block.cumple_reglas
                  ? 'Cumple stock y reglas de negocio.'
                  : 'Revise advertencias antes de confirmar.'}
              </p>
              <button
                type="button"
                onClick={() => descargarPdf(block.preview_id)}
                disabled={loadingId === `pdf_${block.preview_id}`}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#fffdf8] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#5a4a2a] hover:border-[#D4AF37]"
              >
                {loadingId === `pdf_${block.preview_id}` ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                Previsualizar PDF
              </button>
            </div>
          );
        }

        if (block.type === 'decision') {
          if (block.accion === 'confirmar_pedido' && block.preview_id && pedidoConfirmadoId) {
            return (
              <div
                key={block.decision_id}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
              >
                <p className="text-[11px] font-bold text-emerald-800">
                  Pedido #{pedidoConfirmadoId} registrado
                </p>
                <Link
                  href={`/portal/pedidos/${pedidoConfirmadoId}`}
                  className="mt-2 inline-flex rounded-lg bg-[#1a1409] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#D4AF37]"
                >
                  Ir al detalle del pedido
                </Link>
              </div>
            );
          }

          if (block.accion === 'confirmar_incidencia' && block.preview_id && incidenciaConfirmadaId) {
            return (
              <div
                key={block.decision_id}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
              >
                <p className="text-[11px] font-bold text-emerald-800">
                  Incidencia #{incidenciaConfirmadaId} registrada
                </p>
                <Link
                  href="/portal/soporte"
                  className="mt-2 inline-flex rounded-lg bg-[#1a1409] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#D4AF37]"
                >
                  Ver en soporte
                </Link>
              </div>
            );
          }

          return (
            <div key={block.decision_id} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-bold text-slate-800">{block.titulo}</p>
              <p className="text-[10px] text-slate-500 mt-1">{block.descripcion}</p>
              <GuorinoDecisionButtons
                affirmativeLabel={block.affirmative_label}
                negativeLabel={block.negative_label}
                loading={loadingId === block.decision_id}
                onAffirmative={() => {
                  if (block.accion === 'confirmar_pedido' && block.preview_id) {
                    void confirmarPedido(block.preview_id, block.decision_id);
                  } else if (block.accion === 'confirmar_incidencia' && block.preview_id) {
                    void confirmarIncidencia(block.preview_id, block.decision_id);
                  } else if (block.accion === 'aceptar_sugerencia' && block.sugerencia_id) {
                    const sug = blocks.find(
                      (b) => b.type === 'sugerencia' && b.sugerencia_id === block.sugerencia_id,
                    );
                    if (sug?.type === 'sugerencia' && sug.items_sugeridos.length > 0) {
                      const detalle = sug.items_sugeridos
                        .map((i) => `${i.nombre} (ID ${i.producto_id}) x ${i.cantidad}`)
                        .join('; ');
                      onDecision?.(
                        `Acepto la sugerencia. Por favor prepara el pedido con: ${detalle}`,
                      );
                    } else {
                      onDecision?.('Acepto la sugerencia. Por favor, prepare el pedido con esos ajustes.');
                    }
                  } else {
                    onDecision?.('Acepto la sugerencia. Por favor, prepare el pedido con esos ajustes.');
                  }
                }}
                onNegative={() => {
                  if (block.accion === 'confirmar_pedido' && block.preview_id) {
                    void rechazarPedido(block.preview_id, block.decision_id);
                  } else if (block.accion === 'confirmar_incidencia' && block.preview_id) {
                    void rechazarIncidencia(block.preview_id, block.decision_id);
                  } else if (
                    block.accion === 'rechazar_sugerencia' ||
                    block.accion === 'aceptar_sugerencia'
                  ) {
                    onDecision?.('No deseo aplicar esa sugerencia. Indíqueme otra alternativa.');
                  } else {
                    onDecision?.('No deseo aplicar esa sugerencia. Indíqueme otra alternativa.');
                  }
                }}
              />
            </div>
          );
        }

        if (block.type === 'sugerencia') {
          return (
            <div
              key={block.sugerencia_id}
              className="rounded-xl border border-amber-200 bg-amber-50/80 p-3"
            >
              <p className="text-[11px] font-bold text-amber-900">{block.titulo}</p>
              <p className="text-[10px] text-amber-800 mt-1">{block.descripcion}</p>
            </div>
          );
        }

        if (block.type === 'incidencia_confirmada') {
          return (
            <div
              key={block.incidencia_id}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
            >
              <p className="text-[11px] font-bold text-emerald-800">{block.mensaje}</p>
              <Link
                href="/portal/soporte"
                className="mt-2 inline-flex rounded-lg bg-[#1a1409] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#D4AF37]"
              >
                Ver en soporte
              </Link>
            </div>
          );
        }

        if (block.type === 'pedido_confirmado') {
          return (
            <div
              key={block.pedido_id}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
            >
              <p className="text-[11px] font-bold text-emerald-800">{block.mensaje}</p>
              <Link
                href={`/portal/pedidos/${block.pedido_id}`}
                className="mt-2 inline-flex rounded-lg bg-[#1a1409] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#D4AF37]"
              >
                Ir al detalle del pedido
              </Link>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
