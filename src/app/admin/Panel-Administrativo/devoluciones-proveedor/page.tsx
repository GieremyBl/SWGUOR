'use client';

import { useMemo, useState } from 'react';
import { Truck, Clock, PackageX, CheckCircle2, LayoutList } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import { DevolucionProveedorCreateModal } from '@/components/admin/devoluciones-proveedor/DevolucionProveedorCreateModal';
import { DevolucionProveedorDetailModal } from '@/components/admin/devoluciones-proveedor/DevolucionProveedorDetailModal';
import { DevolucionesProveedorTable } from '@/components/admin/devoluciones-proveedor/DevolucionesProveedorTable';
import {
  DevolucionesProveedorToolbar,
  type DevolucionesProveedorFiltros,
} from '@/components/admin/devoluciones-proveedor/DevolucionesProveedorToolbar';
import {
  DEVOLUCIONES_PROVEEDOR_ROLES_CREAR,
  DEVOLUCIONES_PROVEEDOR_ROLES_EDITAR,
  DEVOLUCIONES_PROVEEDOR_ROLES_VER,
} from '@/lib/constants/devoluciones-proveedor';
import { useDevolucionesProveedor } from '@/lib/hooks/useDevolucionesProveedor';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { DevolucionProveedorFila } from '@/lib/schemas/devoluciones-proveedor';

const FILTROS_INICIALES: DevolucionesProveedorFiltros = {
  busqueda: '',
  estado: 'todos',
};

export default function DevolucionesProveedorPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const [filtros, setFiltros] = useState<DevolucionesProveedorFiltros>(FILTROS_INICIALES);
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
    obtenerPorId,
    actualizarEstado,
    isCreating,
    isUpdatingEstado,
  } = useDevolucionesProveedor(listParams);

  const canView =
    can('view', 'devoluciones_proveedor') || hasRole(DEVOLUCIONES_PROVEEDOR_ROLES_VER);
  const canCreate = hasRole(DEVOLUCIONES_PROVEEDOR_ROLES_CREAR);
  const canEditar = hasRole(DEVOLUCIONES_PROVEEDOR_ROLES_EDITAR);

  const stats = useMemo(() => {
    const pendientes = devoluciones.filter((d) => d.estado === 'pendiente_envio').length;
    const enTransito = devoluciones.filter((d) => d.estado === 'en_transito').length;
    const completadas = devoluciones.filter(
      (d) => d.estado === 'completado' || d.estado === 'aceptado_proveedor',
    ).length;
    return { total: devoluciones.length, pendientes, enTransito, completadas };
  }, [devoluciones]);

  const handleVer = (row: DevolucionProveedorFila) => {
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
        <PackageX className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-2xl font-black text-slate-900">Acceso restringido</h2>
        <p className="text-slate-500 mt-2">No tienes permisos para ver devoluciones a proveedores.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Encabezado ── */}
        <AdminPageHeader
          title="Devoluciones a Proveedores"
          description="Gestión de devoluciones de insumos y materiales con impacto en inventario"
          icon={Truck}
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
            title="Pendientes envío"
            value={stats.pendientes}
            icon={Clock}
            color="amber"
            isActive={filtros.estado === 'pendiente_envio'}
            onClick={() => setFiltros(f => ({ ...f, estado: 'pendiente_envio' }))}
          />
          <StatCard
            title="En tránsito"
            value={stats.enTransito}
            icon={Truck}
            color="indigo"
            isActive={filtros.estado === 'en_transito'}
            onClick={() => setFiltros(f => ({ ...f, estado: 'en_transito' }))}
          />
          <StatCard
            title="Completadas"
            value={stats.completadas}
            icon={CheckCircle2}
            color="emerald"
            isActive={filtros.estado === 'completado'}
            onClick={() => setFiltros(f => ({ ...f, estado: 'completado' }))}
          />
        </div>

        {/* ── Toolbar ── */}
        <DevolucionesProveedorToolbar filtros={filtros} onChange={setFiltros} />

        {/* ── Tabla ── */}
        <DevolucionesProveedorTable
          data={devoluciones}
          isLoading={isLoading}
          onVer={handleVer}
        />

      </div>

      {/* ── Modal crear ── */}
      <DevolucionProveedorCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (payload) => { await crear(payload); }}
        isSubmitting={isCreating}
      />

      {/* ── Modal detalle / editar ── */}
      <DevolucionProveedorDetailModal
        open={detailOpen}
        devolucionId={selectedId}
        canEditar={canEditar}
        onClose={() => setDetailOpen(false)}
        onLoad={obtenerPorId}
        onActualizarEstado={async (id, data) => { await actualizarEstado({ id, data }); }}
        isUpdating={isUpdatingEstado}
      />
    </div>
  );
}