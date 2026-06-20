import type { ReporteInventarioAlerta } from '@/lib/schemas/reporte-inventario-abastecimiento';

export function resolverStockMinimo(
  minimoAlmacen: unknown,
  minimoMaestro: unknown,
): number {
  const minimoAlmacenNum = Number(minimoAlmacen ?? 0);
  if (minimoAlmacenNum > 0) return minimoAlmacenNum;
  return Number(minimoMaestro ?? 0);
}

export function resolverStockMaximo(
  maximoMaestro: unknown,
  stockMinimo: number,
): number {
  const maximo = Number(maximoMaestro ?? 0);
  if (maximo > 0) return maximo;
  return stockMinimo > 0 ? stockMinimo * 2 : 1;
}

export function estaBajoStockMinimo(cantidad: number, stockMinimo: number): boolean {
  if (stockMinimo <= 0) return false;
  return cantidad <= stockMinimo;
}

export function calcularPorcentajeStock(cantidad: number, maximo: number): number {
  if (maximo <= 0) return 0;
  return Math.min(100, (cantidad / maximo) * 100);
}

export function calcularDeficit(cantidad: number, stockMinimo: number): number {
  return Math.max(stockMinimo - cantidad, 0);
}

export function calcularValorizacion(cantidad: number, precioUnitario: unknown): number {
  return cantidad * Number(precioUnitario ?? 0);
}

export function calcularOcupacionAlmacen(
  ocupacionActual: number,
  capacidadTotal: unknown,
): { capacidadMaxima: number; porcentaje: number } {
  const capacidad = Number(capacidadTotal ?? 0);
  const capacidadMaxima = capacidad > 0 ? capacidad : Math.max(ocupacionActual, 1);
  const porcentaje = capacidadMaxima > 0 ? Math.min(100, (ocupacionActual / capacidadMaxima) * 100) : 0;
  return { capacidadMaxima, porcentaje };
}

export function ordenarAlertasPorUrgencia(alertas: ReporteInventarioAlerta[]): ReporteInventarioAlerta[] {
  return [...alertas].sort((a, b) => {
    if (a.porcentaje_stock !== b.porcentaje_stock) {
      return a.porcentaje_stock - b.porcentaje_stock;
    }
    return b.deficit - a.deficit;
  });
}

export function formatValorizacionInventario(value: number): string {
  return `S/ ${value.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
