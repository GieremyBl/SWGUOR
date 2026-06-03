'use server';

import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import {
  mapFiltrosMovimientosToListar,
  type FiltrosMovimientosInput,
} from '@/lib/helpers/movimientos-filtros.helper';
import {
  MovimientosInventarioService,
  type RegistrarParams,
} from '@/lib/services/movimientos-inventario.service';
import type { TipoMovimiento } from '@prisma/client';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];

export type ObtenerMovimientosResult =
  | { success: true; data: Awaited<ReturnType<typeof MovimientosInventarioService.listarDesdeFiltros>> }
  | { success: false; error: string; data: [] };

export async function obtenerMovimientos(
  filtros: FiltrosMovimientosInput = {},
): Promise<ObtenerMovimientosResult> {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false, error: 'Sin permisos para consultar movimientos', data: [] };
  }

  try {
    const data = await MovimientosInventarioService.listarDesdeFiltros(filtros);
    return { success: true, data };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al cargar movimientos';
    console.error('[obtenerMovimientos]', e);
    return { success: false, error: message, data: [] };
  }
}

/**
 * Registra un movimiento y actualiza stock en la misma transacción (productos.stock
 * o insumo/materiales vía RPC + triggers).
 */
export async function registrarMovimientoInventario(
  params: RegistrarParams,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false, error: 'Sin permisos' };
  }

  try {
    await MovimientosInventarioService.registrar({
      ...params,
      usuario_id: params.usuario_id ?? auth.user.id,
    });
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'No se pudo registrar el movimiento';
    console.error('[registrarMovimientoInventario]', e);
    return { success: false, error: message };
  }
}

export async function obtenerEstadisticasMovimientos(
  filtros: FiltrosMovimientosInput = {},
) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false as const, error: 'Sin permisos', data: null };
  }

  try {
    const mapped = mapFiltrosMovimientosToListar(filtros);
    const data = await MovimientosInventarioService.obtenerResumen({
      desde: mapped.desde,
      hasta: mapped.hasta,
      tipo_movimiento: mapped.tipo_movimiento as TipoMovimiento | undefined,
    });
    return { success: true as const, data };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al cargar estadísticas';
    return { success: false as const, error: message, data: null };
  }
}
