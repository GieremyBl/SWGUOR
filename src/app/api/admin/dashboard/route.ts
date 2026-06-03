/**
 * app/api/admin/dashboard/route.ts  — App Router
 *
 * Reemplaza el archivo que compartiste, manteniendo exactamente la misma
 * estructura (requireServerRole, targetRole, DashboardService.getDashboardData)
 * pero con los tipos correctos y sin errores de compilación.
 *
 * Correcciones sobre el original:
 *  - Eliminado el cast `(auth).error` / `(auth).status` — se usan type guards
 *  - `days` tipado como number correctamente
 *  - `targetRole` restringido a RolUsuario en lugar de string suelto
 *  - Import de RolUsuario desde la fuente única (@/lib/constants/roles)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { DashboardService } from '@/lib/services/dashboard.service';
import type { RolUsuario } from '@/lib/constants/roles';

// Roles autorizados a ver el dashboard
const DASHBOARD_ROLES: RolUsuario[] = [
  'administrador',
  'gerente',
  'disenador',
  'cortador',
  'recepcionista',
  'almacenero',
  'ayudante',
  'representante_taller',
];

export async function GET(req: NextRequest) {
  // 1. Verificar autenticación y rol
  const auth = await requireServerRole(DASHBOARD_ROLES);

  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error ?? 'No autorizado' },
      { status: auth.status ?? 401 },
    );
  }

  const { user } = auth;

  // 2. Parámetros de query
  const days         = Math.min(Number(req.nextUrl.searchParams.get('days') ?? '30'), 365);
  const roleFromQuery = req.nextUrl.searchParams.get('role') as RolUsuario | null;

  // 3. Determinar el rol objetivo
  //    - Administrador y gerente pueden consultar cualquier dashboard pasando ?role=
  //    - El resto solo puede ver el suyo propio
  const canImpersonate = user.rol === 'administrador' || user.rol === 'gerente';
  const targetRole: RolUsuario =
    canImpersonate && roleFromQuery && DASHBOARD_ROLES.includes(roleFromQuery)
      ? roleFromQuery
      : (user.rol as RolUsuario);

  // 4. Obtener datos
  try {
    const data = await DashboardService.getDashboardData(targetRole, days);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[API_DASHBOARD_ERROR]', { targetRole, days, error: err });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}