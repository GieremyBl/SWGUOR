import type { GuorinoPedidoPreview } from '@/lib/services/guorino-pedido.service';
import type { GuorinoIncidenciaPreview } from '@/lib/services/guorino-incidencia.service';
import type { GuorinoUiBlock } from '@/lib/types/guorino-chat';

export function buildUiBlocksDesdePreviewIncidencia(
  preview: GuorinoIncidenciaPreview,
): GuorinoUiBlock[] {
  if (preview.errores.length > 0) {
    return preview.errores.map((error, index) => ({
      type: 'sugerencia' as const,
      sugerencia_id: `sug_inc_${preview.id}_${index}`,
      titulo: 'No se puede preparar el reporte',
      descripcion: error,
      items_sugeridos: [],
    }));
  }

  return [
    {
      type: 'incidencia_preview',
      preview_id: preview.id,
      resumen: `Incidencia pedido #${preview.pedido_id} · ${preview.tipo_label}`,
      pedido_id: String(preview.pedido_id),
      tipo: preview.tipo_label,
      cumple_reglas: preview.errores.length === 0,
    },
    {
      type: 'decision',
      decision_id: `dec_incidencia_${preview.id}`,
      titulo: 'Confirmar reporte de incidencia',
      descripcion:
        'Revise la previsualización PDF. Si los datos son correctos, acepte para registrar la incidencia en soporte.',
      affirmative_label: 'Aceptar reporte',
      negative_label: 'Denegar',
      accion: 'confirmar_incidencia',
      preview_id: preview.id,
    },
  ];
}

export function buildUiBlocksDesdePreview(preview: GuorinoPedidoPreview): GuorinoUiBlock[] {
  const blocks: GuorinoUiBlock[] = [];

  if (preview.errores.length > 0) {
    for (const sugerencia of preview.sugerencias) {
      blocks.push({
        type: 'sugerencia',
        sugerencia_id: sugerencia.id,
        titulo: sugerencia.titulo,
        descripcion: sugerencia.descripcion,
        items_sugeridos: sugerencia.items.map((item) => {
          const linea = preview.items.find((i) => i.producto_id === Number(item.producto_id));
          return {
            producto_id: String(item.producto_id),
            nombre: linea?.nombre ?? `Producto #${item.producto_id}`,
            cantidad: item.cantidad,
          };
        }),
      });
      blocks.push({
        type: 'decision',
        decision_id: `dec_${sugerencia.id}`,
        titulo: sugerencia.titulo,
        descripcion: sugerencia.descripcion,
        affirmative_label: 'Aceptar sugerencia',
        negative_label: 'Denegar',
        accion: 'aceptar_sugerencia',
        sugerencia_id: sugerencia.id,
      });
    }
    return blocks;
  }

  blocks.push({
    type: 'pedido_preview',
    preview_id: preview.id,
    resumen: `Pedido por ${preview.totales.total_unidades} uds · Total S/ ${preview.totales.total.toFixed(2)}`,
    total: preview.totales.total,
    total_unidades: preview.totales.total_unidades,
    cumple_reglas: preview.totales.cumple_moq_global && preview.errores.length === 0,
  });

  blocks.push({
    type: 'decision',
    decision_id: `dec_pedido_${preview.id}`,
    titulo: 'Confirmar pedido propuesto',
    descripcion:
      'Revise la previsualización PDF. Si los productos y cantidades son correctos, acepte para registrar el pedido.',
    affirmative_label: 'Aceptar pedido',
    negative_label: 'Denegar',
    accion: 'confirmar_pedido',
    preview_id: preview.id,
  });

  return blocks;
}
