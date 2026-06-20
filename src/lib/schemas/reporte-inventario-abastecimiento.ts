import { z } from 'zod';
import { REPORTE_INVENTARIO_FILTRO_TODOS } from '@/lib/constants/reporte-inventario';

export const reporteInventarioQuerySchema = z.object({
  categoria_id: z
    .union([z.literal(REPORTE_INVENTARIO_FILTRO_TODOS), z.coerce.number().int().positive()])
    .default(REPORTE_INVENTARIO_FILTRO_TODOS),
  almacen_id: z
    .union([z.literal(REPORTE_INVENTARIO_FILTRO_TODOS), z.coerce.number().int().positive()])
    .default(REPORTE_INVENTARIO_FILTRO_TODOS),
});

export type ReporteInventarioQuery = z.infer<typeof reporteInventarioQuerySchema>;

export interface ReporteInventarioKpis {
  articulos_bajo_minimo: number;
  valorizacion_total: number;
  movimientos_24h: number;
  almacen_mayor_ocupacion: {
    id: number;
    nombre: string;
    porcentaje: number;
  } | null;
}

export interface ReporteInventarioAlerta {
  stock_id: number;
  tipo: 'insumo' | 'material';
  item_id: number;
  nombre: string;
  categoria: string | null;
  almacen_id: number;
  almacen_nombre: string;
  cantidad: number;
  stock_minimo: number;
  stock_maximo: number;
  porcentaje_stock: number;
  deficit: number;
}

export interface ReporteInventarioOcupacionAlmacen {
  almacen_id: number;
  nombre: string;
  ocupacion_actual: number;
  capacidad_maxima: number;
  porcentaje_ocupacion: number;
  unidad: string;
}

export interface ReporteInventarioFiltroOpcion {
  value: number;
  label: string;
}

export interface ReporteInventarioAbastecimientoResponse {
  success: true;
  kpis: ReporteInventarioKpis;
  alertas_rojas: ReporteInventarioAlerta[];
  ocupacion_almacenes: ReporteInventarioOcupacionAlmacen[];
  filtros: {
    categorias: ReporteInventarioFiltroOpcion[];
    almacenes: ReporteInventarioFiltroOpcion[];
  };
}
