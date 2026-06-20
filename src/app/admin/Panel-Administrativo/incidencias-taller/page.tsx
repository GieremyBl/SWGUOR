'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import { IncidenciaTallerCreateModal } from '@/components/admin/incidencias-taller/IncidenciaTallerCreateModal';
import { IncidenciaTallerDetailModal } from '@/components/admin/incidencias-taller/IncidenciaTallerDetailModal';
import { IncidenciasTallerTable } from '@/components/admin/incidencias-taller/IncidenciasTallerTable';
import {
  IncidenciasTallerToolbar,
  type IncidenciasTallerFiltros,
} from '@/components/admin/incidencias-taller/IncidenciasTallerToolbar';
import {
  INCIDENCIAS_TALLER_ROLES_CREAR,
  INCIDENCIAS_TALLER_ROLES_GESTION,
  INCIDENCIAS_TALLER_ROLES_VER,
} from '@/lib/constants/incidencias-taller';
import { useIncidenciasTaller } from '@/lib/hooks/useIncidenciasTaller';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { IncidenciaTallerFila } from '@/lib/schemas/incidencias-taller';

const FILTROS_INICIALES: IncidenciasTallerFiltros = {
  busqueda: '',
  severidad: 'todas',
  resuelto: 'todos',
};

export default function IncidenciasTallerPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const [filtros, setFiltros] = useState<IncidenciasTallerFiltros>(FILTROS_INICIALES);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [page, setPage] = useState(1);

  const listParams = useMemo(
    () => ({
      search: filtros.busqueda || undefined,
      severidad: filtros.severidad,
      resuelto: filtros.resuelto,
      page,
      limit: 20,
    }),
    [filtros, page],
  );

  const {
    incidencias,
    meta,
    isLoading,
    obtenerPorId,
    crear,
    resolver,
    asignar,
    isCreating,
    isResolving,
    isAssigning,
  } = useIncidenciasTaller(listParams);

  const canView =
    can('view', 'incidencias_taller') || hasRole(INCIDENCIAS_TALLER_ROLES_VER);
  const canCreate =
    can('create', 'incidencias_taller') || hasRole(INCIDENCIAS_TALLER_ROLES_CREAR);
  const canGestionar = hasRole(INCIDENCIAS_TALLER_ROLES_GESTION);

  const stats = useMemo(() => {
    const pendientes = incidencias.filter((i) => !i.resuelto).length;
    const resueltas = incidencias.filter((i) => i.resuelto).length;
    const criticas = incidencias.filter((i) => i.severidad === 'critica' && !i.resuelto).length;
    return {
      total: meta?.total ?? incidencias.length,
      pendientes,
      resueltas,
      criticas,
    };
  }, [incidencias, meta]);

  const handleVer = (row: IncidenciaTallerFila) => {
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
        <p className="text-slate-500 mt-2">No tienes permisos para ver incidencias de taller.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <AdminPageHeader
            title="Incidencias de Taller"
            description="Reportes operativos de averías, retrasos y defectos en confección externa"
            icon={AlertTriangle}
          />
          {canCreate && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Nueva incidencia
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total} icon={AlertTriangle} color="blue" />
          <StatCard title="Pendientes" value={stats.pendientes} icon={AlertTriangle} color="amber" />
          <StatCard title="Resueltas (página)" value={stats.resueltas} icon={AlertTriangle} color="emerald" />
          <StatCard title="Críticas abiertas" value={stats.criticas} icon={AlertTriangle} color="red" />
        </div>

        <IncidenciasTallerToolbar
          filtros={filtros}
          onChange={(next) => {
            setFiltros(next);
            setPage(1);
          }}
        />

        <IncidenciasTallerTable data={incidencias} isLoading={isLoading} onVer={handleVer} />

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              Página {meta.page} de {meta.totalPages} ({meta.total} registros)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        <IncidenciaTallerDetailModal
          open={detailOpen}
          incidenciaId={selectedId}
          canGestionar={canGestionar}
          isResolving={isResolving}
          isAssigning={isAssigning}
          onClose={() => setDetailOpen(false)}
          onLoad={obtenerPorId}
          onResolver={async (id, data) => {
            await resolver({ id, data });
          }}
          onAsignar={async (id, data) => {
            await asignar({ id, data });
          }}
        />

        <IncidenciaTallerCreateModal
          open={createOpen}
          isCreating={isCreating}
          onClose={() => setCreateOpen(false)}
          onCreate={async (data) => {
            await crear(data);
          }}
        />
      </div>
    </div>
  );
}
