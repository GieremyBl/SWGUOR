'use client';

import { useMemo, useState } from 'react';
import { RotateCcw, LayoutList, Clock, CheckCircle2, XCircle } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import { DevolucionClienteCreateModal } from '@/components/admin/devoluciones-cliente/DevolucionClienteCreateModal';
import { DevolucionClienteDetailModal } from '@/components/admin/devoluciones-cliente/DevolucionClienteDetailModal';
import { DevolucionesClienteTable } from '@/components/admin/devoluciones-cliente/DevolucionesClienteTable';
import {
  DevolucionesClienteToolbar,
  type DevolucionesClienteFiltros,
} from '@/components/admin/devoluciones-cliente/DevolucionesClienteToolbar';
import {
  DEVOLUCIONES_CLIENTE_ROLES_CREAR,
  DEVOLUCIONES_CLIENTE_ROLES_RESOLVER,
  DEVOLUCIONES_CLIENTE_ROLES_VER,
} from '@/lib/constants/devoluciones-cliente';
import { useDevolucionesCliente } from '@/lib/hooks/useDevolucionesCliente';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { DevolucionClienteFila } from '@/lib/schemas/devoluciones-cliente';

const FILTROS_INICIALES: DevolucionesClienteFiltros = {
  busqueda: '',
  estado: 'todos',
};

export default function DevolucionesClientePage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const [filtros, setFiltros] = useState<DevolucionesClienteFiltros>(FILTROS_INICIALES);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const listParams = useMemo(
    () => ({
      estado: filtros.estado,
      busqueda: filtros.busqueda || undefined,
    }),
    [filtros],
  );

  const {
    devoluciones,
    isLoading,
    crear,
    aprobar,
    rechazar,
    obtenerPorId,
    isCreating,
    isResolving,
  } = useDevolucionesCliente(listParams);

  const canView = can('view', 'devoluciones_cliente') || hasRole(DEVOLUCIONES_CLIENTE_ROLES_VER);
  const canCreate = hasRole(DEVOLUCIONES_CLIENTE_ROLES_CREAR);
  const canResolver = hasRole(DEVOLUCIONES_CLIENTE_ROLES_RESOLVER);

  const stats = useMemo(() => {
    const pendientes = devoluciones.filter(
      (d) => d.estado_solicitud === 'pendiente' || d.estado_solicitud === 'en_revision',
    ).length;
    const aprobadas = devoluciones.filter((d) => d.estado_solicitud === 'aprobada').length;
    const rechazadas = devoluciones.filter((d) => d.estado_solicitud === 'rechazada').length;
    return { total: devoluciones.length, pendientes, aprobadas, rechazadas };
  }, [devoluciones]);

  const handleVer = (row: DevolucionClienteFila) => {
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
        <RotateCcw className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-2xl font-black text-slate-900">Acceso restringido</h2>
        <p className="text-slate-500 mt-2">No tienes permisos para ver devoluciones de clientes.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Encabezado ── */}
        <AdminPageHeader
          title="Devoluciones de Clientes"
          description="Gestión de solicitudes de devolución vinculadas a pedidos"
          icon={RotateCcw}
          showAction={canCreate}
          actionLabel="Nueva devolución"
          onAction={() => setCreateOpen(true)}
        />

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total devoluciones"
            value={stats.total}
            icon={LayoutList}
            color="slate"
            isActive={filtros.estado === 'todos'}
            onClick={() => setFiltros(f => ({ ...f, estado: 'todos' }))}
          />
          <StatCard
            title="Pendientes / En revisión"
            value={stats.pendientes}
            icon={Clock}
            color="amber"
            isActive={filtros.estado === 'pendiente'}
            onClick={() => setFiltros(f => ({ ...f, estado: 'pendiente' }))}
          />
          <StatCard
            title="Aprobadas"
            value={stats.aprobadas}
            icon={CheckCircle2}
            color="emerald"
            isActive={filtros.estado === 'aprobada'}
            onClick={() => setFiltros(f => ({ ...f, estado: 'aprobada' }))}
          />
          <StatCard
            title="Rechazadas"
            value={stats.rechazadas}
            icon={XCircle}
            color="red"
            isActive={filtros.estado === 'rechazada'}
            onClick={() => setFiltros(f => ({ ...f, estado: 'rechazada' }))}
          />
        </div>

        {/* ── Toolbar ── */}
        <DevolucionesClienteToolbar filtros={filtros} onChange={setFiltros} />

        {/* ── Tabla ── */}
        <DevolucionesClienteTable data={devoluciones} isLoading={isLoading} onVer={handleVer} />

      </div>

      {/* ── Modal crear ── */}
      <DevolucionClienteCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => { await crear(payload); }}
        isSubmitting={isCreating}
      />

      {/* ── Modal detalle / resolver ── */}
      <DevolucionClienteDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        devolucionId={selectedId}
        canResolver={canResolver}
        onLoad={obtenerPorId}
        onAprobar={async (id, data) => { await aprobar({ id, data }); }}
        onRechazar={async (id, data) => { await rechazar({ id, data }); }}
        isResolving={isResolving}
      />
    </div>
  );
}