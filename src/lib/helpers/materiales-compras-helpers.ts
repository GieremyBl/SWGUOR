const API = '/api/admin/materiales';

export interface ListarMaterialesParams {
  tipo?: string;
  busqueda?: string;
  stockBajo?: boolean;
  proveedorId?: string;
}

export interface MaterialCompraRow {
  id: string;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  composicion?: string | null;
  gramaje?: number | null;
  color?: string | null;
  unidad_medida: string;
  stock_actual: number | string;
  stock_minimo: number | string;
  precio_unitario?: number | string | null;
  proveedor_id?: string | null;
  proveedores?: { id: string; razon_social: string } | null;
  _count?: { ordenes_compra_items: number };
}

export interface MaterialDetalleRow extends MaterialCompraRow {
  ancho_total?: number | string | null;
  ancho_util?: number | string | null;
  codigo_color?: string | null;
  ubicacion_almacen?: string | null;
  alerta_bajo_stock?: boolean | null;
  almacen_stock?: Array<{
    id: string;
    cantidad: number | string;
    almacenes?: { id: string; nombre: string } | null;
  }>;
  proveedores?: { id: string; razon_social: string; ruc?: string } | null;
  ordenes_compra_items?: Array<{
    id: string;
    cantidad_pedida: number | string;
    cantidad_recibida: number | string;
    precio_unitario: number | string;
    subtotal?: number | string | null;
    ordenes_compra: {
      id: string;
      estado: string;
      estado_pago: string;
      total_orden: number | string;
      fecha_prometida?: string | null;
      created_at: string;
      proveedores?: { id: string; razon_social: string } | null;
    };
  }>;
  _count?: { ordenes_compra_items: number; movimientos_inventario: number };
}

export async function fetchMaterialesCompras(params?: ListarMaterialesParams): Promise<MaterialCompraRow[]> {
  const query = new URLSearchParams();
  if (params?.tipo) query.set('tipo', params.tipo);
  if (params?.busqueda) query.set('busqueda', params.busqueda);
  if (params?.stockBajo) query.set('stockBajo', 'true');
  if (params?.proveedorId) query.set('proveedor_id', params.proveedorId);

  const res = await fetch(`${API}?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar materiales');
  const json = await res.json();
  return (json.data ?? []) as MaterialCompraRow[];
}

export async function fetchMaterialDetalleCompras(id: string): Promise<MaterialDetalleRow> {
  const res = await fetch(`${API}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Material no encontrado');
  const json = await res.json();
  return (json.data ?? json) as MaterialDetalleRow;
}

export async function createMaterialCompras(data: Record<string, unknown>) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMaterialCompras(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
