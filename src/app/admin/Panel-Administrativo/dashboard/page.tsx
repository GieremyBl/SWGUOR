"use client";

import { usePermissions } from '@/app/hooks/usePermissions';
import AdminDashboard from '@/components/admin/dashboards/DashboardAdmin';
import DashboardAyudante from '@/components/admin/dashboards/DashboardAyudante';
import DashboardCortador from '@/components/admin/dashboards/DashboardCortador';
import DashboardDiseñador from '@/components/admin/dashboards/DashboardDiseñador';
import DashboardRecepcionista from '@/components/admin/dashboards/DashboardRecepcionista';
import DashboardRepresentante from '@/components/admin/dashboards/DashboardRepresentante';

export default function DashboardPage() {
  const { usuario, isLoading, hasRole } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Usuario no encontrado</h1>
          <p className="text-gray-600">Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  // Renderizar dashboard según el rol del usuario
  if (hasRole('administrador')) {
    return <AdminDashboard />;
  }

  if (hasRole('ayudante')) {
    return <DashboardAyudante usuario={usuario} />;
  }

  if (hasRole('cortador')) {
    return <DashboardCortador usuario={usuario} />;
  }

  if (hasRole('diseñador')) {
    return <DashboardDiseñador usuario={usuario} />;
  }

  if (hasRole('recepcionista')) {
    return <DashboardRecepcionista usuario={usuario} />;
  }

  if (hasRole('representante_taller')) {
    return <DashboardRepresentante usuario={usuario} />;
  }

  // Fallback si no tiene rol asignado
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600">Tu rol no tiene acceso a un dashboard específico.</p>
      </div>
    </div>
  );
}
