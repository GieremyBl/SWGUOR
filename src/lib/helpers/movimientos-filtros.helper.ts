import type { ReferenciaMovimiento, TipoMovimiento } from '@prisma/client';

export interface ListarMovimientosParams {
  desde?: Date;
  hasta?: Date;
  tipo_movimiento?: TipoMovimiento;
  referencia_tipo?: ReferenciaMovimiento;
  producto_id?: string;
  insumo_id?: string;
  material_id?: string;
  usuario_id?: string;
  almacen_id?: string;
  busqueda?: string;
  limite?: number;
}

export type FiltrosMovimientosInput = {
  search?: string;
  busqueda?: string;
  tipo_movimiento?: string;
  tipoMovimiento?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  desde?: string;
  hasta?: string;
  referencia_tipo?: string;
  referenciaMovimiento?: string;
  tipoItem?: 'producto' | 'insumo' | 'material';
  limite?: number;
};

const TIPOS_BASICOS = new Set(['entrada', 'salida', 'ajuste']);

function normalizarTipoMovimiento(raw?: string): TipoMovimiento | undefined {
  if (!raw?.trim()) return undefined;
  const v = raw.trim().toLowerCase();
  if (TIPOS_BASICOS.has(v)) return v as TipoMovimiento;
  return undefined;
}

function parseFechaInicio(value: string): Date {
  const d = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function parseFechaFin(value: string): Date {
  const d = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

export function mapFiltrosMovimientosToListar(
  filtros: FiltrosMovimientosInput = {},
): ListarMovimientosParams {
  const search = filtros.search?.trim() || filtros.busqueda?.trim();
  const tipoRaw = filtros.tipo_movimiento ?? filtros.tipoMovimiento;
  const desdeRaw = filtros.fecha_inicio ?? filtros.desde;
  const hastaRaw = filtros.fecha_fin ?? filtros.hasta;
  const referencia = filtros.referencia_tipo ?? filtros.referenciaMovimiento;

  const params: ListarMovimientosParams = {};

  if (search) params.busqueda = search;
  const tipo = normalizarTipoMovimiento(tipoRaw);
  if (tipo) params.tipo_movimiento = tipo;
  if (referencia) params.referencia_tipo = referencia as ReferenciaMovimiento;
  if (filtros.tipoItem === 'producto') params.producto_id = 'any';
  if (filtros.tipoItem === 'insumo') params.insumo_id = 'any';
  if (filtros.tipoItem === 'material') params.material_id = 'any';
  if (desdeRaw) params.desde = parseFechaInicio(desdeRaw);
  if (hastaRaw) params.hasta = parseFechaFin(hastaRaw);
  if (filtros.limite) params.limite = filtros.limite;

  return params;
}

export function filtrosMovimientosVacios(filtros: FiltrosMovimientosInput = {}): boolean {
  const mapped = mapFiltrosMovimientosToListar(filtros);
  return (
    !mapped.busqueda &&
    !mapped.tipo_movimiento &&
    !mapped.referencia_tipo &&
    !mapped.producto_id &&
    !mapped.insumo_id &&
    !mapped.material_id &&
    !mapped.desde &&
    !mapped.hasta
  );
}
