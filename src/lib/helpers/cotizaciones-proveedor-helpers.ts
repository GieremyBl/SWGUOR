'use client';

import type {
  ActualizarCotizacionProveedorInput,
  CrearCotizacionProveedorInput,
} from '@/lib/schemas/cotizaciones-proveedor';

const API = '/api/admin/cotizaciones-proveedor';

export interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: { total: number; page: number; totalPages: number };
  error?: string;
}

export interface ApiItemResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 1. Agregamos el genérico <T = Record<string, unknown>> para mantener la compatibilidad por defecto
export async function fetchCotizacionesProveedor<T = Record<string, unknown>>(
  page: number,
  limit: number,
  busqueda: string,
  estado: string,
): Promise<ApiListResponse<T>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(busqueda && { busqueda }),
    ...(estado && { estado }),
  });
  const res = await fetch(`${API}?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar cotizaciones');
  
  // Al retornar, casteamos la respuesta JSON al tipo de la promesa esperado
  return res.json() as Promise<ApiListResponse<T>>;
}

// 2. Agregamos el genérico <T = Record<string, unknown>> para el detalle
export async function fetchCotizacionProveedorDetalle<T = Record<string, unknown>>(
  id: string | number,
): Promise<ApiItemResponse<T>> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  return res.json() as Promise<ApiItemResponse<T>>;
}

export async function crearCotizacionProveedor(
  data: CrearCotizacionProveedorInput,
): Promise<ApiItemResponse<{ id: string | number }>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<ApiItemResponse<{ id: string | number }>>;
}

export async function actualizarCotizacionProveedor(
  id: string | number,
  data: ActualizarCotizacionProveedorInput,
): Promise<ApiItemResponse<void>> { // Cambiado de 'unknown' a 'void' o un tipo específico si tu API devuelve algo
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<ApiItemResponse<void>>;
}

export async function cambiarEstadoCotizacionProveedor(
  id: string | number,
  estado: string,
): Promise<ApiItemResponse<void>> { // Cambiado de 'unknown' a 'void'
  const res = await fetch(`${API}/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  return res.json() as Promise<ApiItemResponse<void>>;
}

export async function anularCotizacionProveedor(
  id: string | number,
): Promise<ApiItemResponse<void>> { // Cambiado de 'unknown' a 'void'
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  return res.json() as Promise<ApiItemResponse<void>>;
}

export async function subirPdfCotizacionProveedor(
  id: string | number,
  file: File,
): Promise<ApiItemResponse<{ pdf_url: string }>> {
  const formData = new FormData();
  formData.append('pdf', file);
  const res = await fetch(`${API}/${id}/documento`, {
    method: 'POST',
    body: formData,
  });
  return res.json() as Promise<ApiItemResponse<{ pdf_url: string }>>;
}