'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, LayoutList, Clock, CheckCircle2, Flame } from 'lucide-react';
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
    incidencias, meta, isLoading,
    obtenerPorId, crear, resolver, asignar,
    isCreating, isResolving, isAssigning,
  } = useIncidenciasTaller(listParams);

  const canView = can('view', 'incidencias_taller') || hasRole(INCIDENCIAS_TALLER_ROLES_VER);
  const canCreate = can('create', 'incidencias_taller') || hasRole(INCIDENCIAS_TALLER_ROLES_CREAR);
  const canGestionar = hasRole(INCIDENCIAS_TALLER_ROLES_GESTION);

  const stats = useMemo(() => {
    const pendientes = incidencias.filter((i) => !i.resuelto).length;
    const resueltas = incidencias.filter((i) => i.resuelto).length;
    const criticas = incidencias.filter((i) => i.severidad === 'critica' && !i.resuelto).length;
    return { total: meta?.total ?? incidencias.length, pendientes, resueltas, criticas };
  }, [incidencias, meta]);

  const handleVer = (row: IncidenciaTallerFila) => {
    setSelectedId(row.id);
    setDetailOpen(true);
  };

  const handleFiltroChange = (next: IncidenciasTallerFiltros) => {
    setFiltros(next);
    setPage(1);
  };

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center text-sm text-slate-500">
      Verificando permisos...
    </div>
  );

  if (!canView) return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-6">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
      <h2 className="text-2xl font-black text-slate-900">Acceso restringido</h2>
      <p className="text-slate-500 mt-2">No tienes permisos para ver incidencias de taller.</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Encabezado ── */}
        <AdminPageHeader
          title="Incidencias de Taller"
          description="Reportes operativos de averías, retrasos y defectos en confección externa"
          icon={AlertTriangle}
          showAction={canCreate}
          actionLabel="Nueva incidencia"
          onAction={() => setCreateOpen(true)}
        />

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={LayoutList}
            color="slate"
            isActive={filtros.resuelto === 'todos'}
            onClick={() => handleFiltroChange({ ...filtros, resuelto: 'todos' })}
          />
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={Clock}
            color="amber"
            isActive={filtros.resuelto === 'false'}
            onClick={() => handleFiltroChange({ ...filtros, resuelto: 'false' })}
          />
          <StatCard
            title="Resueltas"
            value={stats.resueltas}
            icon={CheckCircle2}
            color="emerald"
            isActive={filtros.resuelto === 'true'}
            onClick={() => handleFiltroChange({ ...filtros, resuelto: 'true' })}
          />
          <StatCard
            title="Críticas abiertas"
            value={stats.criticas}
            icon={Flame}
            color="red"
            isActive={filtros.severidad === 'critica'}
            onClick={() => handleFiltroChange({ ...filtros, severidad: 'critica', resuelto: 'false' })}
          />
        </div>

        {/* ── Toolbar ── */}
        <IncidenciasTallerToolbar filtros={filtros} onChange={handleFiltroChange} />

        {/* ── Tabla ── */}
        <IncidenciasTallerTable data={incidencias} isLoading={isLoading} onVer={handleVer} />

        {/* ── Paginación ── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Página {meta.page} de {meta.totalPages} ({meta.total} registros)</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40">Anterior</button>
              <button type="button" disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}

      </div>

      {/* ── Modales ── */}
      <IncidenciaTallerDetailModal
        open={detailOpen}
        incidenciaId={selectedId}
        canGestionar={canGestionar}
        isResolving={isResolving}
        isAssigning={isAssigning}
        onClose={() => setDetailOpen(false)}
        onLoad={obtenerPorId}
        onResolver={async (id, data) => { await resolver({ id, data }); }}
        onAsignar={async (id, data) => { await asignar({ id, data }); }}
      />
      <IncidenciaTallerCreateModal
        open={createOpen}
        isCreating={isCreating}
        onClose={() => setCreateOpen(false)}
        onCreate={async (data) => { await crear(data); }}
      />
    </div>
  );
}