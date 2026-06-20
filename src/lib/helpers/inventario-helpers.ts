import type { ApiResponse } from "@/lib/schemas/inventario";

const API = "/api/admin/inventario";

// ── INSUMOS ───────────────────────────────────────────────────────────────────

export async function fetchInsumos(params?: {
  tipo?:      string;
  categoria?: string;
  busqueda?:  string;
  stockBajo?: boolean;
  sortOrder?: "asc" | "desc" | "none";
}): Promise<{ insumos: any[]; proveedores: any[] }> {
  const query = new URLSearchParams();
  if (params?.tipo)                                     query.set("tipo",       params.tipo);
  if (params?.categoria)                                query.set("categoria_id", params.categoria);
  if (params?.busqueda)                                 query.set("busqueda",   params.busqueda);
  if (params?.stockBajo)                                query.set("stock_bajo", "true");
  if (params?.sortOrder && params.sortOrder !== "none") query.set("sort",       params.sortOrder);

  const res = await fetch(`${API}?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar insumos");
  const json = await res.json();
  return {
    insumos: json.data?.insumos ?? [],
    proveedores: json.data?.proveedores ?? [],
  };
}

export async function fetchInsumoById(id: string): Promise<any> {
  const res = await fetch(`${API}/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Insumo no encontrado");
  const result = await res.json();
  return result.data ?? result;
}

export async function createInsumo(data: any): Promise<ApiResponse> {
  const res = await fetch(API, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function updateInsumo(
  id: string,
  data: {
    nombre?:           string;
    tipo?:             string;
    categoria_id?: number;
    unidad_medida?:    string;
    stock_minimo?:     number;
    stock_maximo?:     number | null;
    precio_unitario?:  number | null;
    proveedor_id?:     number | null;
    ubicacion_almacen?: string | null;
    alerta_bajo_stock?: boolean;
  }
): Promise<ApiResponse> {
  const res = await fetch(`${API}/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  return res.json();
}

export async function deleteInsumo(id: string): Promise<ApiResponse> {
  const res = await fetch(`${API}/${id}`, { method: "DELETE" });
  return res.json();
}

// ── STOCK ─────────────────────────────────────────────────────────────────────

export async function ajustarStock(id: string, data: any) {
  // Traducimos 'sumar'/'restar' a stock_delta para el servicio de backend
  const payload: any = {
    id,
    motivo: data.motivo,
    costo_unitario: data.costo_unitario,
    precio_unitario: data.precio_unitario,
  };

  if (data.operacion === "sumar") payload.stock_delta = data.cantidad;
  else if (data.operacion === "restar") payload.stock_delta = -data.cantidad;
  else payload.stock_actual = data.cantidad;

  const res = await fetch(`/api/admin/movimientos-inventario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── MOVIMIENTOS ───────────────────────────────────────────────────────────────

export async function fetchMovimientos(params?: {
  insumoId?: string;
  desde?:    string;
  hasta?:    string;
  limite?:   number;
}): Promise<{ movimientos: any[] }> {
  const query = new URLSearchParams();
  if (params?.insumoId) query.set("insumo_id", params.insumoId);
  if (params?.desde)    query.set("desde",     params.desde);
  if (params?.hasta)    query.set("hasta",     params.hasta);
  if (params?.limite)   query.set("limite",    String(params.limite));

  const res = await fetch(`/api/admin/movimientos-inventario?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar movimientos");
  return res.json();
}