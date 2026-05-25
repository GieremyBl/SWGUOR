'use server';

import { z } from 'zod';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import {
  crearCotizacionProveedorSchema,
  type CrearCotizacionProveedorInput,
} from '@/lib/schemas/cotizaciones-proveedor';
import { proveedorSchema } from '@/lib/schemas/proveedor';
import { cotizacionesProveedorService } from '@/lib/services/cotizaciones-proveedor.service';
import type { CotizacionExtraccionIA } from '@/lib/schemas/cotizacion-extraccion-ia';
import { cotizacionExtraccionIASchema } from '@/lib/schemas/cotizacion-extraccion-ia';
import {
  buscarProveedoresSimilares,
  crearProveedorDesdeExtraccion,
  encontrarProveedorPorExtraccion,
} from '@/lib/services/proveedor-cotizacion.service';
import { serializeBigInt } from '@/lib/utils/serialize';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];

const registrarCotizacionPayloadSchema = crearCotizacionProveedorSchema.extend({
  proveedor_nuevo: proveedorSchema.omit({ id: true }).optional(),
});

export type RegistrarCotizacionPayload = z.infer<typeof registrarCotizacionPayloadSchema>;

export async function resolverProveedorExtraccionAction(payload: unknown) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false as const, error: auth.error };
  }

  const parsed = cotizacionExtraccionIASchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false as const, error: 'Extracción inválida' };
  }

  try {
    const data = await encontrarProveedorPorExtraccion(parsed.data as CotizacionExtraccionIA);
    return { success: true as const, data };
  } catch (e: unknown) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : 'Error al resolver proveedor',
    };
  }
}

export async function buscarProveedoresCotizacionAction(busqueda: string) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false as const, error: auth.error };
  }

  try {
    const data = await buscarProveedoresSimilares(busqueda, 25);
    return { success: true as const, data };
  } catch (e: unknown) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : 'Error al buscar proveedores',
    };
  }
}

export async function crearProveedorCotizacionAction(
  payload: z.infer<typeof proveedorSchema>,
) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false as const, error: auth.error };
  }

  const parsed = proveedorSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Datos de proveedor inválidos',
    };
  }

  try {
    const data = await crearProveedorDesdeExtraccion({
      ruc: parsed.data.ruc,
      razon_social: parsed.data.razon_social,
      contacto: parsed.data.contacto,
      telefono: parsed.data.telefono,
      email: parsed.data.email,
      direccion: parsed.data.direccion,
      categoria_suministro: parsed.data.categoria_suministro,
    });
    return { success: true as const, data };
  } catch (e: unknown) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : 'No se pudo crear el proveedor',
    };
  }
}

export async function registrarCotizacionProveedorAction(
  payload: RegistrarCotizacionPayload,
) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false as const, error: auth.error };
  }

  const parsed = registrarCotizacionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }

  try {
    let proveedorId = parsed.data.proveedor_id;

    if ((!proveedorId || proveedorId <= 0) && parsed.data.proveedor_nuevo) {
      const nuevo = await crearProveedorDesdeExtraccion(parsed.data.proveedor_nuevo);
      proveedorId = Number(nuevo.id);
    }

    if (!proveedorId || proveedorId <= 0) {
      return { success: false as const, error: 'Seleccione o registre un proveedor' };
    }

    const input: CrearCotizacionProveedorInput = {
      ...parsed.data,
      proveedor_id: proveedorId,
    };

    const cotizacion = await cotizacionesProveedorService.crear(
      input,
      auth.user.authId,
    );

    return {
      success: true as const,
      data: serializeBigInt({ id: String(cotizacion.id) }),
    };
  } catch (e: unknown) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : 'Error al registrar cotización',
    };
  }
}
