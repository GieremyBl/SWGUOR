'use client';

import { useEffect, useState, useCallback } from 'react';

interface Opts {
  busqueda?:    string;
  categoriaId?: number;
  talla?:       string;
  limite?:      number;
}

export interface ProductoPortal {
  id:          string | number;
  nombre:      string;
  codigo?:     string;
  precio:      number;
  imagen_url?: string | null;
  tallas?:     string[];
  colores?:    string[];
  stock_total: number;
  categoria?: {
    id:     number;
    nombre: string;
  } | null;
}

interface APIProductosResponse {
  success: boolean;
  data:    ProductoPortal[];
  message?: string;
}

export function useProductosPortal({ busqueda = '', categoriaId, talla, limite = 24 }: Opts) {
  const [productos, setProductos] = useState<ProductoPortal[]>([]);
  const [loading, setLoading]     = useState<boolean>(false);

  const ejecutarFetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limite: String(limite) });
      if (busqueda)    params.set('busqueda',     busqueda);
      if (categoriaId) params.set('categoria_id', String(categoriaId));
      if (talla)       params.set('talla',        talla);

      const res = await window.fetch(`/api/ecommerce/productos?${params}`);
      if (!res.ok) throw new Error('Error al recuperar catálogo de productos');

      const body: APIProductosResponse = await res.json();
      setProductos(body.data ?? []);
    } catch (error) {
      console.error('Error en hook useProductosPortal:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda, categoriaId, talla, limite]);

  // Debounce controlado de llamadas a la API
  useEffect(() => {
    const temporizador = setTimeout(() => {
      ejecutarFetch();
    }, busqueda ? 300 : 0);

    return () => clearTimeout(temporizador);
  }, [ejecutarFetch, busqueda]);

  return { productos, loading };
}