'use client';

import { useMemo, useState } from 'react';
import { Coins, LayoutList, Clock, CheckCircle2, XCircle } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import { PagoTallerDetailModal } from '@/components/admin/pagos-taller/PagoTallerDetailModal';
import { PagoTallerFormModal } from '@/components/admin/pagos-taller/PagoTallerFormModal';
import { PagosTallerTable } from '@/components/admin/pagos-taller/PagosTallerTable';
import {
  PagosTallerToolbar,
  type PagosTallerFiltros,
} from '@/components/admin/pagos-taller/PagosTallerToolbar';
import {
  PAGOS_TALLER_ROLES_ESCRITURA,
  PAGOS_TALLER_ROLES_VER,
} from '@/lib/constants/pagos-taller';
import { formatMontoPagoTaller } from '@/lib/helpers/pagos-taller-helpers';
import { usePagosTalleres } from '@/lib/hooks/usePagosTalleres';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useTalleres } from '@/lib/hooks/useTalleres';
import type { PagoTallerFila } from '@/lib/schemas/pagos-talleres';

const FILTROS_INICIALES: PagosTallerFiltros = {
  busqueda: '',
  estado: 'todos',
  metodo_pago: 'todos',
  taller_id: 'todos',
};

export default function PagosTallerPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const { talleres } = useTalleres();
  const [filtros, setFiltros] = useState<PagosTallerFiltros>(FILTROS_INICIALES);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [page, setPage] = useState(1);

  const listParams = useMemo(
    () => ({
      search: filtros.busqueda || undefined,
      estado: filtros.estado,
      metodo_pago: filtros.metodo_pago,
      taller_id: filtros.taller_id,
      page,
      limit: 20,
    }),
    [filtros, page],
  );

  const {
    pagos,
    meta,
    isLoading,
    obtenerPorId,
    crear,
    registrar,
    anular,
    isCreating,
    isRegistering,
    isAnulling,
  } = usePagosTalleres(listParams);

  const canView =
    can('view', 'talleres') || can('view', 'pagos') || hasRole(PAGOS_TALLER_ROLES_VER);
  const canGestionar = hasRole(PAGOS_TALLER_ROLES_ESCRITURA);

  const talleresOptions = useMemo(
    () => talleres.map((t) => ({ id: t.id, nombre: t.nombre })),
    [talleres],
  );

  const stats = useMemo(() => {
    const pendientes = pagos.filter((p) => p.estado === 'pendiente');
    const pagados = pagos.filter((p) => p.estado === 'pagado');
    const anulados = pagos.filter((p) => p.estado === 'anulado');
    const montoPendiente = pendientes.reduce((s, p) => s + Number(p.monto), 0);
    const montoPagado = pagados.reduce((s, p) => s + Number(p.monto), 0);
    return {
      total: meta?.total ?? pagos.length,
      pendientes: pendientes.length,
      pagados: pagados.length,
      anulados: anulados.length,
      montoPendiente,
      montoPagado,
    };
  }, [pagos, meta]);

  const handleVer = (row: PagoTallerFila) => {
    setSelectedId(row.id);
    setDetailOpen(true);
  };

  const handleFiltroChange = (next: PagosTallerFiltros) => {
    setFiltros(next);
    setPage(1);
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
        <Coins className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-2xl font-black text-slate-900">Acceso restringido</h2>
        <p className="text-slate-500 mt-2">No tienes permisos para ver pagos a talleres.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Encabezado ── */}
        <AdminPageHeader
          title="Pagos a Talleres"
          description="Gestión de obligaciones y confirmación de pagos a talleres externos"
          icon={Coins}
          showAction={canGestionar}
          actionLabel="Nuevo pago"
          onAction={() => setCreateOpen(true)}
        />

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total registros"
            value={stats.total}
            icon={LayoutList}
            color="slate"
            isActive={filtros.estado === 'todos'}
            onClick={() => handleFiltroChange({ ...filtros, estado: 'todos' })}
          />
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={Clock}
            color="amber"
            isActive={filtros.estado === 'pendiente'}
            onClick={() => handleFiltroChange({ ...filtros, estado: 'pendiente' })}
          />
          <StatCard
            title="Pagados"
            value={stats.pagados}
            icon={CheckCircle2}
            color="emerald"
            isActive={filtros.estado === 'pagado'}
            onClick={() => handleFiltroChange({ ...filtros, estado: 'pagado' })}
          />
          <StatCard
            title="Monto pagado"
            value={formatMontoPagoTaller(stats.montoPagado)}
            icon={Coins}
            color="blue"
            disabled
          />
        </div>

        {/* ── Toolbar ── */}
        <PagosTallerToolbar
          filtros={filtros}
          talleres={talleresOptions}
          onChange={handleFiltroChange}
        />

        {/* ── Tabla ── */}
        <PagosTallerTable data={pagos} isLoading={isLoading} onVer={handleVer} />

        {/* ── Paginación ── */}
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

      </div>

      {/* ── Modal detalle ── */}
      <PagoTallerDetailModal
        open={detailOpen}
        pagoId={selectedId}
        canGestionar={canGestionar}
        isRegistering={isRegistering}
        isAnulling={isAnulling}
        onClose={() => setDetailOpen(false)}
        onLoad={obtenerPorId}
        onRegistrar={async (id, data) => { await registrar({ id, data }); }}
        onAnular={async (id, data) => { await anular({ id, data }); }}
      />

      {/* ── Modal crear ── */}
      <PagoTallerFormModal
        open={createOpen}
        isCreating={isCreating}
        talleres={talleresOptions}
        onClose={() => setCreateOpen(false)}
        onCreate={async (data) => { await crear(data); }}
      />
    </div>
  );
}