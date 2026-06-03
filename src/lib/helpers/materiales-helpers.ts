import { 
  Material, 
  MaterialCatalogo, 
  MaterialFormValues, 
  AjustarStockValues 
} from '@/lib/schemas/material';

const API = '/api/admin/materiales';

interface FetchMaterialesParams {
  tipo?: string;
  busqueda?: string;
  stockBajo?: boolean;
}

/**
 * Obtiene la lista simplificada de materiales para catálogos/selects
 */
export async function fetchMateriales(params?: FetchMaterialesParams): Promise<MaterialCatalogo[]> {
  const query = new URLSearchParams();
  if (params?.tipo && params.tipo !== 'todos') query.set('tipo', params.tipo);
  if (params?.busqueda)                             query.set('busqueda', params.busqueda);
  if (params?.stockBajo)                            query.set('stockBajo', 'true');

  const res = await fetch(`${API}?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar materiales');
  
  const result = await res.json();
  // El helper ya extrae '.data', devolviendo el arreglo plano estricto
  return (result.data as MaterialCatalogo[]) ?? [];
}

/**
 * Obtiene el detalle completo de un material por su ID (Tipado con la interfaz de Dominio)
 */
export async function fetchMaterialById(id: string): Promise<Material> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Material no encontrado');
  
  const result = await res.json();
  return result.data as Material;
}

/**
 * Crea un material validando la estructura exacta con los tipos de Zod
 */
export async function createMaterial(data: MaterialFormValues): Promise<{ success: boolean; data?: Material; error?: string }> {
  const res = await fetch(API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}

/**
 * Actualiza un material usando los valores del formulario de Zod
 */
export async function updateMaterial(id: string, data: MaterialFormValues): Promise<{ success: boolean; data?: Material; error?: string }> {
  const res = await fetch(API, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id, ...data }),
  });
  return res.json();
}

/**
 * Elimina un material del sistema
 */
export async function deleteMaterial(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' });
  return res.json();
}

/**
 * Ajusta el stock usando el tipo estricto inferido de ajustarStockSchema de Zod
 */
export async function ajustarStockMaterial(
  id: string,
  data: Omit<AjustarStockValues, 'id'> // Reutiliza el esquema de Zod omitiendo el ID que va por URL
): Promise<{ success: boolean; nuevoStock?: number; error?: string }> {
  const res = await fetch(`${API}/${id}/stock`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return res.json();
}