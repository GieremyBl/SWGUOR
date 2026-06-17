import { EstadoProducto } from '@prisma/client';
import type { Categoria } from './categorias.service';
import type { VarianteProducto } from './variantes.service';

// ─── Interfaces Reales de la BD ───────────────────────────────────────────────
export interface FichaTecnica {
  id: number;
  id_producto?: number | null;
  version?: string | null;
  descripcion_detallada?: string | null;
  sam_total?: number | null;
  costo_estimado?: number | null;
  imagen_geometral?: string | null;
  estado?: string | null;
  created_at?: string;
}

export interface AlmacenStockRef {
  id: number;
  almacen_id: number;
  producto_id: number | null;
  cantidad: number;
  updated_at: string;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number; // ✅ SE QUEDA: Es el stock consolidado real de tu tabla física
  estado: 'activo' | 'inactivo';
  destacado?: boolean;
  imagen?: string | null;
  categoria_id?: number | null;
  moq?: number;
  reglas_descuento?: unknown; // jsonb en Postgres
  colores_disponibles?: string[]; // jsonb en Postgres
  tallas_disponibles?: string[]; // jsonb en Postgres
  created_at?: string;
  updated_at?: string;

  // Relaciones opcionales que vienen en el include de tu API
  categorias?: Categoria;
  variantes_producto?: VarianteProducto[];
  fichas_tecnicas?: FichaTecnica | null;
  almacen_stocks?: AlmacenStockRef[]; // Desglose por si el admin quiere auditar almacenes
}

export interface ProductosListResponse {
  productos: Producto[];
  categorias: Categoria[];
}

export interface ProductoCreateInput {
  producto: Omit<Producto, 'id' | 'categorias' | 'variantes_producto' | 'fichas_tecnicas' | 'almacen_stocks'>;
  variantes?: Omit<VarianteProducto, 'id' | 'producto_id' | 'created_at'>[];
  nueva_ficha_relacional?: Partial<FichaTecnica>;
}

export interface ProductoUpdateInput {
  producto: Partial<Producto>;
  variantes?: (Partial<VarianteProducto> & { id?: number })[];
}

export interface ProductosFiltros {
  categoriaId?: string;
  busqueda?: string;
  estado?: string;
  color?: string;
  talla?: string;
  almacenId?: string; // 🔍 Opcional: Por si quieres que tu API filtre stock local en vez de global
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class ProductosService {
  private static baseUrl = '/api/admin/productos';

  static async listar(filtros?: ProductosFiltros): Promise<ProductosListResponse> {
    try {
      const params = new URLSearchParams();
      if (filtros?.categoriaId) params.set('categoriaId', filtros.categoriaId);
      if (filtros?.busqueda) params.set('busqueda', filtros.busqueda);
      if (filtros?.estado) params.set('estado', filtros.estado);
      if (filtros?.color) params.set('color', filtros.color);
      if (filtros?.talla) params.set('talla', filtros.talla);
      if (filtros?.almacenId) params.set('almacenId', filtros.almacenId);

      const url = `${this.baseUrl}?${params.toString()}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[ProductosService] Error listing:', error);
      return { productos: [], categorias: [] };
    }
  }

  static async obtenerPorId(id: number, almacenId?: number): Promise<Producto | null> {
    try {
      const params = new URLSearchParams();
      if (almacenId) params.set('almacenId', almacenId.toString());

      const url = `${this.baseUrl}/${id}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[ProductosService] Error fetching by ID:', error);
      return null;
    }
  }

  static async crear(data: ProductoCreateInput): Promise<Producto | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[ProductosService] Error creating:', error);
      return null;
    }
  }

  static async actualizar(id: number, data: ProductoUpdateInput): Promise<Producto | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[ProductosService] Error updating:', error);
      return null;
    }
  }

  static async toggleEstado(id: number, estado: EstadoProducto): Promise<Producto | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('[ProductosService] Error toggling estado:', error);
      return null;
    }
  }

  static async eliminar(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return true;
    } catch (error) {
      console.error('[ProductosService] Error deleting:', error);
      return false;
    }
  }
}