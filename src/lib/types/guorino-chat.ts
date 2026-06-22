export type GuorinoChatRole = 'user' | 'bot';

export type GuorinoUiBlock =
  | {
      type: 'pedido_preview';
      preview_id: string;
      resumen: string;
      total: number;
      total_unidades: number;
      cumple_reglas: boolean;
    }
  | {
      type: 'decision';
      decision_id: string;
      titulo: string;
      descripcion: string;
      affirmative_label?: string;
      negative_label?: string;
      accion:
        | 'confirmar_pedido'
        | 'rechazar_pedido'
        | 'aceptar_sugerencia'
        | 'rechazar_sugerencia'
        | 'confirmar_incidencia'
        | 'rechazar_incidencia';
      preview_id?: string;
      sugerencia_id?: string;
    }
  | {
      type: 'incidencia_preview';
      preview_id: string;
      resumen: string;
      pedido_id: string;
      tipo: string;
      cumple_reglas: boolean;
    }
  | {
      type: 'incidencia_confirmada';
      incidencia_id: string;
      mensaje: string;
    }
  | {
      type: 'pedido_confirmado';
      pedido_id: string;
      mensaje: string;
    }
  | {
      type: 'sugerencia';
      sugerencia_id: string;
      titulo: string;
      descripcion: string;
      items_sugeridos: Array<{ producto_id: string; nombre: string; cantidad: number }>;
    };

export interface GuorinoChatMessage {
  id: string;
  role: GuorinoChatRole;
  content: string;
  created_at: string;
  ui_blocks?: GuorinoUiBlock[];
}

export interface GuorinoConversacion {
  id: string;
  titulo: string;
  mensajes: GuorinoChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface GuorinoConversacionesStore {
  activa_id: string | null;
  conversaciones: GuorinoConversacion[];
}
