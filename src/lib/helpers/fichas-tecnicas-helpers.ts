import type { ApiResponse } from '@/lib/schemas/fichas-tecnicas';

const FICHA_API = '/api/admin/fichas-tecnicas';

export interface ListarFichasParams {
  estado?:       string;
  busqueda?:     string;
  categoria_id?: string;
}

export interface FichaTecnicaListRow {
  id:                    string;
  version:               string;
  estado:                string;
  descripcion_detallada: string | null;
  sam_total:             number | null;
  costo_estimado:        number | null;
  ficha_url:             string | null;
  created_at:            string;
  productos:             { id: string; nombre: string; sku: string; imagen: string | null } | null;
  ficha_medidas:         { id: string }[];
  _count?:               { fichas_tecnicas_detalle: number };
}

export async function fetchFichasTecnicasList(params?: ListarFichasParams): Promise<{
  fichas: FichaTecnicaListRow[];
  categorias: { id: string | number; nombre: string }[];
}> {
  const query = new URLSearchParams();
  if (params?.estado)       query.set('estado', params.estado);
  if (params?.busqueda)     query.set('busqueda', params.busqueda);
  if (params?.categoria_id) query.set('categoria_id', params.categoria_id);

  const res = await fetch(`${FICHA_API}?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar fichas técnicas');
  const json = await res.json();
  return {
    fichas: (json.data ?? []) as FichaTecnicaListRow[],
    categorias: (json.categorias ?? []) as { id: string | number; nombre: string }[],
  };
}

export async function fetchFichaPorProducto(producto_id: string): Promise<any | null> {
  const res = await fetch(`${FICHA_API}?producto_id=${producto_id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar ficha');
  const result = await res.json();
  return result.data ?? null;
}

export async function createFichaTecnica(data: {
  producto_id:           string | number;
  version?:              string;
  descripcion_detallada?: string;
  sam_total?:            number;
  costo_estimado?:       number;
  ficha_url?:            string;
  imagen_geometral?:     string;
}): Promise<ApiResponse> {
  const res = await fetch(FICHA_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function updateFichaTecnica(
  id: string,
  data: Partial<{
    version:               string;
    descripcion_detallada: string;
    sam_total:             number;
    costo_estimado:        number;
    ficha_url:             string;
    imagen_geometral:      string;
    estado:                string;
  }>
): Promise<ApiResponse> {
  const res = await fetch(FICHA_API, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id, ...data }),
  });
  return res.json();
}

export {
  fetchFichaMedidas as fetchMedidas,
  saveFichaMedidasBulk as saveMedidas,
  deleteFichaMedida as deleteMedida,
} from '@/lib/helpers/ficha-medidas-helpers';