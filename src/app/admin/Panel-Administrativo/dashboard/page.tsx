"use client";

import { useMemo } from "react";
import dynamic from 'next/dynamic';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Loader2, UserX, AlertTriangle } from "lucide-react";

const AdminDashboard        = dynamic(() => import('@/components/admin/dashboards/DashboardAdmin'));
const DashboardAyudante     = dynamic(() => import('@/components/admin/dashboards/DashboardAyudante'));
const DashboardCortador     = dynamic(() => import('@/components/admin/dashboards/DashboardCortador'));
const DashboardDiseñador    = dynamic(() => import('@/components/admin/dashboards/DashboardDiseñador'));
const DashboardRecepcionista= dynamic(() => import('@/components/admin/dashboards/DashboardRecepcionista'));
const DashboardRepresentante= dynamic(() => import('@/components/admin/dashboards/DashboardRepresentante'));

const DASHBOARDS_MAP: Record<string, React.ComponentType<any>> = {
  administrador:        AdminDashboard,
  ayudante:             DashboardAyudante,
  cortador:             DashboardCortador,
  disenador:            DashboardDiseñador,
  recepcionista:        DashboardRecepcionista,
  representante_taller: DashboardRepresentante,
};

export default function DashboardPage() {
  const { personal, isLoading } = usePermissions();

  const ActiveDashboard = useMemo(() => {
    if (!personal?.rol) return null;
    return DASHBOARDS_MAP[personal.rol] ?? null;
  }, [personal]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Cargando panel...</p>
      </div>
    );
  }

  if (!personal) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6">
        <div className="p-4 rounded-full bg-slate-100 mb-4">
          <UserX className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Sesión finalizada</h1>
        <p className="text-slate-500 text-sm mt-1">Por favor, inicia sesión nuevamente.</p>
      </div>
    );
  }

  if (!ActiveDashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6">
        <div className="p-4 rounded-full bg-amber-50 mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Acceso restringido</h2>
        <p className="text-slate-500 text-sm mt-1">
          El rol{' '}
          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
            {personal.rol}
          </code>{' '}
          no tiene un tablero configurado.
        </p>
      </div>
    );
  }

  return <ActiveDashboard personal={personal} />;
}