'use client';

import { useMemo, useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import { CostoEnvioFormModal } from '@/components/admin/costo-envio/CostoEnvioFormModal';
import { CostoEnvioTable } from '@/components/admin/costo-envio/CostoEnvioTable';
import {
  CostoEnvioToolbar,
  type CostoEnvioFiltros,
} from '@/components/admin/costo-envio/CostoEnvioToolbar';
import {
  COSTO_ENVIO_ROLES_ESCRITURA,
  COSTO_ENVIO_ROLES_VER,
} from '@/lib/constants/costo-envio';
import { useCostoEnvio } from '@/lib/hooks/useCostoEnvio';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { CostoEnvioFila } from '@/lib/schemas/costo-envio';

const FILTROS_INICIALES: CostoEnvioFiltros = {
  busqueda: '',
  activo: 'todos',
};

export default function CostoEnvioPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const [filtros, setFiltros] = useState<CostoEnvioFiltros>(FILTROS_INICIALES);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostoEnvioFila | null>(null);

  const listParams = useMemo(
    () => ({
      activo: filtros.activo,
      search: filtros.busqueda || undefined,
    }),
    [filtros],
  );

  const {
    zonas,
    isLoading,
    crear,
    actualizar,
    desactivar,
    isCreating,
    isUpdating,
  } = useCostoEnvio(listParams);

  const canView =
    can('view', 'cotizaciones') || hasRole(COSTO_ENVIO_ROLES_VER);
  const canEdit = hasRole(COSTO_ENVIO_ROLES_ESCRITURA);

  const stats = useMemo(() => {
    const activas = zonas.filter((z) => z.activo).length;
    const inactivas = zonas.filter((z) => !z.activo).length;
    const promedio =
      zonas.length > 0
        ? zonas.reduce((s, z) => s + Number(z.costo), 0) / zonas.length
        : 0;
    return { total: zonas.length, activas, inactivas, promedio };
  }, [zonas]);

  const handleEditar = (row: CostoEnvioFila) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleDesactivar = async (row: CostoEnvioFila) => {
    if (!confirm(`¿Desactivar la zona "${row.zona}"?`)) return;
    await desactivar(row.id);
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
        <p className="text-slate-500 mt-2">No tienes permisos para ver costos de envío.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <AdminPageHeader
            title="Costos de Envío"
            description="Tarifas por zona geográfica para cotizaciones y pedidos B2B"
            icon={Truck}
          />
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Nueva zona
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Zonas" value={stats.total} icon={Truck} color="blue" />
          <StatCard title="Activas" value={stats.activas} icon={Truck} color="emerald" />
          <StatCard title="Inactivas" value={stats.inactivas} icon={Truck} color="slate" />
          <StatCard
            title="Costo promedio"
            value={stats.promedio.toFixed(2)}
            icon={Truck}
            color="indigo"
          />
        </div>

        <CostoEnvioToolbar filtros={filtros} onChange={setFiltros} />

        <CostoEnvioTable
          data={zonas}
          isLoading={isLoading}
          canEdit={canEdit}
          onEditar={handleEditar}
          onDesactivar={handleDesactivar}
        />

        <CostoEnvioFormModal
          open={formOpen}
          editing={editing}
          zonasExistentes={zonas}
          isSaving={isCreating || isUpdating}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onCreate={async (data) => {
            await crear(data);
          }}
          onUpdate={async (id, data) => {
            await actualizar({ id, data });
          }}
        />
      </div>
    </div>
  );
}
