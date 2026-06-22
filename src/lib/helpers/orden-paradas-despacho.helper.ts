import { parsearDireccionDespachoPeru } from '@/lib/helpers/direccion-despacho-peru.helper';

/** Distritos considerados más cercanos al almacén GUOR (Lima este). */
const DISTRITOS_CERCANOS_ALMACEN = [
  'san juan de lurigancho',
  'ate',
  'el agustino',
  'santa anita',
  'la victoria',
  'lima',
  'breña',
  'san miguel',
  'magdalena',
  'jesus maria',
] as const;

export interface DespachoParadaOrden {
  despacho_id: bigint;
  direccion_entrega: string;
}

function normalizarDistrito(direccion: string): string {
  const { distrito } = parsearDireccionDespachoPeru(direccion);
  return distrito.trim().toLowerCase();
}

/** Puntaje menor = parada más cercana (heurística por distrito). */
export function puntajeProximidadDespacho(direccion: string): number {
  const distrito = normalizarDistrito(direccion);
  if (!distrito) return 500;

  const idxCercano = DISTRITOS_CERCANOS_ALMACEN.findIndex((d) =>
    distrito.includes(d),
  );
  if (idxCercano >= 0) return idxCercano;

  return 100 + distrito.charCodeAt(0);
}

export function ordenarDespachosPorProximidad(
  items: DespachoParadaOrden[],
): DespachoParadaOrden[] {
  return [...items].sort((a, b) => {
    const diff =
      puntajeProximidadDespacho(a.direccion_entrega) -
      puntajeProximidadDespacho(b.direccion_entrega);
    if (diff !== 0) return diff;
    return a.direccion_entrega.localeCompare(b.direccion_entrega, 'es');
  });
}

export function construirOrdenParadas(
  items: DespachoParadaOrden[],
  paradasManuales?: Array<{ despacho_id: bigint; numero_parada: number }>,
): Array<{ despacho_id: bigint; numero_parada: number }> {
  if (paradasManuales && paradasManuales.length === items.length) {
    return [...paradasManuales].sort((a, b) => a.numero_parada - b.numero_parada);
  }

  const ordenados = ordenarDespachosPorProximidad(items);
  return ordenados.map((item, index) => ({
    despacho_id: item.despacho_id,
    numero_parada: index + 1,
  }));
}
