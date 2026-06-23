export type EtapaConfeccion =
    | 'recepcion_cortes'
    | 'confeccion_y_remalle'
    | 'acabado_y_limpieza'
    | 'planchado_y_empaque'
    | 'entregado_a_guor';

export interface ConfeccionData {
    id: string; // o number (BigInt de Prisma se suele parsear como string en JSON)
    prenda: string;
    cantidad: number;
    estado: EtapaConfeccion;
}

export const ETAPAS_CONFIG: Record<EtapaConfeccion, { orden: number; titulo: string; color: string; bgLight: string }> = {
    'recepcion_cortes': { orden: 1, titulo: 'Recepción Cortes', color: 'text-blue-600 bg-blue-600', bgLight: 'bg-blue-50' },
    'confeccion_y_remalle': { orden: 2, titulo: 'Confección y Remalle', color: 'text-amber-600 bg-amber-600', bgLight: 'bg-amber-50' },
    'acabado_y_limpieza': { orden: 3, titulo: 'Acabado y Limpieza', color: 'text-purple-600 bg-purple-600', bgLight: 'bg-purple-50' },
    'planchado_y_empaque': { orden: 4, titulo: 'Planchado y Empaque', color: 'text-orange-600 bg-orange-600', bgLight: 'bg-orange-50' },
    'entregado_a_guor': { orden: 5, titulo: 'Entregado a GUOR', color: 'text-green-600 bg-green-600', bgLight: 'bg-green-50' },
};

export const LISTA_ETAPAS = Object.keys(ETAPAS_CONFIG) as EtapaConfeccion[];