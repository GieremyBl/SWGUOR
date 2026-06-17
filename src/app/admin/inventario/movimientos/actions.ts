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
import type { TipoMovimiento, ReferenciaMovimiento } from '@prisma/client';

const ROLES: RolUsuario[] = [
  'administrador',
  'gerente',
  'almacenero',
  'cortador',
  'disenador',
  'recepcionista',
  'representante_taller',
  'ayudante',
  'cliente'
];

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
 * Interface para normalizar el payload que viene del componente Cliente (Formulario)
 */
interface FormularioMovimientoInput {
  almacen_id: string;
  tipo_movimiento: string;
  referencia_tipo: string;
  cantidad: number;
  motivo: string;
  usuario_id?: string;
  producto_id?: string;
  insumo_id?: string;
  material_id?: string;
}

/**
 * Registra un movimiento y actualiza stock en la misma transacción.
 */
export async function registrarMovimientoInventario(
  params: FormularioMovimientoInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await requireServerRole(ROLES);
  if (!auth.success || !auth.user?.id) {
    return { success: false, error: 'Sin permisos para registrar movimientos' };
  }

  try {
    const payloadCompresible: RegistrarParams = {
      almacen_id: params.almacen_id,
      tipo_movimiento: params.tipo_movimiento as TipoMovimiento,
      referencia_tipo: params.referencia_tipo as ReferenciaMovimiento,
      cantidad: params.cantidad,
      motivo: params.motivo,
      usuario_id: params.usuario_id ?? auth.user.id,
      ...(params.producto_id && { producto_id: params.producto_id }),
      ...(params.insumo_id && { insumo_id: params.insumo_id }),
      ...(params.material_id && { material_id: params.material_id }),
    };

    await MovimientosInventarioService.registrar(payloadCompresible);
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