"use client";

import { useMemo } from "react";
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Loader2, ShieldAlert, UserX, Sparkles } from "lucide-react";

// Importación de los Dashboards por Rol
import AdminDashboard from '@/components/admin/dashboards/DashboardAdmin';
import DashboardAyudante from '@/components/admin/dashboards/DashboardAyudante';
import DashboardCortador from '@/components/admin/dashboards/DashboardCortador';
import DashboardDiseñador from '@/components/admin/dashboards/DashboardDiseñador';
import DashboardRecepcionista from '@/components/admin/dashboards/DashboardRecepcionista';
import DashboardRepresentante from '@/components/admin/dashboards/DashboardRepresentante';

const DASHBOARDS_MAP: Record<string, React.ComponentType<any>> = {
  administrador: AdminDashboard,
  ayudante: DashboardAyudante,
  cortador: DashboardCortador,
  diseñador: DashboardDiseñador,
  recepcionista: DashboardRecepcionista,
  representante_taller: DashboardRepresentante,
};

export default function DashboardPage() {
  const { usuario, isLoading, hasRole } = usePermissions();

  const ActiveDashboard = useMemo(() => {
    if (!usuario) return null;
    const roleKey = Object.keys(DASHBOARDS_MAP).find(role => hasRole(role));
    return roleKey ? DASHBOARDS_MAP[roleKey] : null;
  }, [usuario, hasRole]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-pink-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Accesos GUOR...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
        <UserX className="w-10 h-10 text-red-500 mb-4" />
        <h1 className="text-xl font-black text-slate-900 uppercase">Sesión Expirada</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header de Bienvenida Impactante */}
      <div className="bg-white border-b border-slate-100 px-8 py-10 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-pink-100 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-pink-600" />
            </div>
            <span className="text-[10px] font-black text-pink-600 uppercase tracking-[0.4em]">
              Panel de Control Interno
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">
            Bienvenido, <span className="text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-pink-600 to-slate-900">
              {usuario.nombre_completo || "Usuario"}
            </span>
          </h1>
          
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            Sistema de Gestión de Producción • {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Renderizado del Dashboard Específico */}
      <div className="px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {ActiveDashboard ? (
            <ActiveDashboard usuario={usuario} />
          ) : (
            <div className="bg-white p-12 rounded-[3rem] text-center border border-slate-100 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-900 uppercase">Rol no configurado</h2>
              <p className="text-slate-400 text-sm mt-2">Tu acceso está limitado. Contacta con soporte técnico.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}