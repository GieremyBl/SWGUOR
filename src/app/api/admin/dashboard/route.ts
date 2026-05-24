import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/auth/server';
import { DashboardService } from '@/lib/services/dashboard.service';
import { RolUsuario } from '@/lib/constants/roles';

const DASHBOARD_ROLES: RolUsuario[] = [
  'administrador', 'gerente', 'disenador', 'cortador',
  'recepcionista', 'almacenero', 'ayudante', 'representante_taller'
];

export async function GET(req: NextRequest) {
  // 1. Verificar autenticación y obtener el usuario (con su rol)
  const auth = await requireServerRole(DASHBOARD_ROLES);

  if (!auth.success) {
    // Si no es exitoso, 'auth' tiene error y status
    return NextResponse.json(
      { error: (auth).error || 'No autorizado' },
      { status: (auth).status || 401 }
    );
  }

  // Ahora sabemos que auth.success es true y auth.user existe
  const { user } = auth;
  const days = Number(req.nextUrl.searchParams.get('days') ?? '30');
  const roleFromQuery = req.nextUrl.searchParams.get('role');

  // Usar el rol del usuario o el de la query si es administrador (para ver otros dashboards)
  const targetRole = (user.rol === 'administrador' || user.rol === 'gerente')
    ? (roleFromQuery || user.rol)
    : user.rol;

  try {
    const data = await DashboardService.getDashboardData(targetRole as string, days);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API_DASHBOARD_ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}