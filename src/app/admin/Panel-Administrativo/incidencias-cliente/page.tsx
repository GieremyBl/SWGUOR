'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import { IncidenciaClienteDetailModal } from '@/components/admin/incidencias-cliente/IncidenciaClienteDetailModal';
import { IncidenciasClienteTable } from '@/components/admin/incidencias-cliente/IncidenciasClienteTable';
import {
  IncidenciasClienteToolbar,
  type IncidenciasClienteFiltros,
} from '@/components/admin/incidencias-cliente/IncidenciasClienteToolbar';
import {
  INCIDENCIAS_CLIENTE_ROLES_RESPONDER,
  INCIDENCIAS_CLIENTE_ROLES_VER,
} from '@/lib/constants/incidencias-cliente';
import { useIncidenciasClienteAdmin } from '@/lib/hooks/useIncidenciasCliente';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { IncidenciaClienteFila } from '@/lib/schemas/incidencias-cliente';

const FILTROS_INICIALES: IncidenciasClienteFiltros = {
  busqueda: '',
  estado: 'todos',
};

export default function IncidenciasClientePage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const [filtros, setFiltros] = useState<IncidenciasClienteFiltros>(FILTROS_INICIALES);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const listParams = useMemo(
    () => ({
      estado: filtros.estado,
      busqueda: filtros.busqueda || undefined,
    }),
    [filtros],
  );

  const { incidencias, isLoading, obtenerPorId, responder, isResponding } =
    useIncidenciasClienteAdmin(listParams);

  const canView =
    can('view', 'incidencias_clientes') || hasRole(INCIDENCIAS_CLIENTE_ROLES_VER);
  const canResponder = hasRole(INCIDENCIAS_CLIENTE_ROLES_RESPONDER);

  const stats = useMemo(() => {
    const abiertas = incidencias.filter((i) => i.estado === 'abierta').length;
    const enRevision = incidencias.filter((i) => i.estado === 'en_revision').length;
    const resueltas = incidencias.filter(
      (i) => i.estado === 'resuelta' || i.estado === 'cerrada',
    ).length;
    return { total: incidencias.length, abiertas, enRevision, resueltas };
  }, [incidencias]);

  const handleVer = (row: IncidenciaClienteFila) => {
    setSelectedId(row.id);
    setDetailOpen(true);
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-slate-500">
        Verificando permisos...
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-black text-slate-900">Acceso restringido</h2>
        <p className="text-slate-500 mt-2">No tienes permisos para ver incidencias de clientes.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="Incidencias de Clientes"
          description="Reportes de problemas en despachos reportados desde el portal B2B"
          icon={AlertTriangle}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total} icon={AlertTriangle} color="blue" />
          <StatCard title="Abiertas" value={stats.abiertas} icon={AlertTriangle} color="amber" />
          <StatCard title="En revisión" value={stats.enRevision} icon={AlertTriangle} color="indigo" />
          <StatCard title="Resueltas / cerradas" value={stats.resueltas} icon={AlertTriangle} color="emerald" />
        </div>

        <IncidenciasClienteToolbar filtros={filtros} onChange={setFiltros} />

        <IncidenciasClienteTable data={incidencias} isLoading={isLoading} onVer={handleVer} />

        <IncidenciaClienteDetailModal
          open={detailOpen}
          incidenciaId={selectedId}
          canResponder={canResponder}
          isResponding={isResponding}
          onClose={() => setDetailOpen(false)}
          onLoad={obtenerPorId}
          onResponder={async (id, data) => {
            await responder({ id, data });
          }}
        />
      </div>
    </div>
  );
}
