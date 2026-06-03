'use server';

import { revalidatePath } from 'next/cache';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { liberarReservaStockAdmin } from '@/lib/services/reserva-stock-admin.service';

const ROLES: RolUsuario[] = ['administrador', 'gerente', 'almacenero'];

export async function liberarReservaStockAction(reservaId: string) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return { success: false as const, error: 'Sin permisos para liberar reservas' };
  }

  const id = BigInt(reservaId);
  if (id <= BigInt(0)) {
    return { success: false as const, error: 'ID de reserva inválido' };
  }

  try {
    await liberarReservaStockAdmin(id);
    revalidatePath('/admin/Panel-Administrativo/inventario/reservas');
    revalidatePath('/admin/inventario/reservas');
    return { success: true as const };
  } catch (e: unknown) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : 'No se pudo liberar la reserva',
    };
  }
}
