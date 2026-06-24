'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { PagoDetailModal, PagoVerifyModal } from '@/components/admin/pagos/PagoModals';
import type { Pago } from '@/components/admin/pagos/PagosTable';
import { TesoreriaComprobanteDialog } from '@/components/admin/tesoreria/TesoreriaComprobanteDialog';
import { TesoreriaPagosPagination } from '@/components/admin/tesoreria/TesoreriaPagosPagination';
import { TesoreriaPagosStats } from '@/components/admin/tesoreria/TesoreriaPagosStats';
import { TesoreriaPagosTable } from '@/components/admin/tesoreria/TesoreriaPagosTable';
import {
  TesoreriaPagosToolbar,
  type TesoreriaFiltrosState,
} from '@/components/admin/tesoreria/TesoreriaPagosToolbar';
import type { EstadoTesoreriaFiltro } from '@/lib/constants/tesoreria-pagos';
import { TESORERIA_PAGOS_PAGE_SIZE_DEFAULT } from '@/lib/constants/tesoreria-pagos';
import {
  rangoFechasUltimosPagos,
  type UltimosPagosRangoPreset,
} from '@/lib/helpers/ultimos-pagos-date.helper';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type {
  TesoreriaPagoFila,
  TesoreriaPagosStats as TesoreriaStats,
} from '@/lib/schemas/tesoreria-pagos';

type ModalMode = 'create' | 'view' | 'verify' | null;

const RANGO_INICIAL: UltimosPagosRangoPreset = 'mes';

const FILTROS_INICIALES: TesoreriaFiltrosState = {
  busqueda: '',
  estado: 'exitoso',
  metodo_pago: 'todos',
  ...rangoFechasUltimosPagos(RANGO_INICIAL),
};

function mapFilaAModalPago(row: TesoreriaPagoFila): Pago {
  return {
    id_uuid: row.id_uuid,
    pedido_id: row.pedido_id,
    monto: row.monto,
    metodo_pago: row.metodo_pago,
    fecha_pago: row.fecha_pago,
    tipo: row.tipo,
    estado: row.estado,
    notas: row.notas,
    created_at: row.fecha_pago,
    pedidos: {
      id: row.pedido.id,
      estado: row.pedido.estado ?? 'pendiente',
      total: row.pedido.total,
      monto_pagado: row.pedido.monto_pagado,
      saldo_pendiente: row.pedido.saldo_pendiente,
      clientes: row.cliente
        ? {
          id: row.cliente.id,
          razon_social: row.cliente.razon_social ?? '',
          ruc: row.cliente.ruc,
        }
        : null,
    },
  };
}

export default function UltimosPagosPage() {
  const { can, hasRole, isLoading: authLoading } = usePermissions();
  const puedeGestionar = hasRole(['administrador', 'gerente', 'recepcionista']);

  const [filas, setFilas] = useState<TesoreriaPagoFila[]>([]);
  const [stats, setStats] = useState<TesoreriaStats>({
    total: 0,
    exitosos: 0,
    pendientes: 0,
    fallidos: 0,
    monto_exitoso: 0,
  });
  const [filtros, setFiltros] = useState<TesoreriaFiltrosState>(FILTROS_INICIALES);
  const [rangoPreset, setRangoPreset] = useState<UltimosPagosRangoPreset>(RANGO_INICIAL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [comprobanteRow, setComprobanteRow] = useState<TesoreriaPagoFila | null>(null);

  const loadPagos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(TESORERIA_PAGOS_PAGE_SIZE_DEFAULT),
        estado: filtros.estado,
      });

      if (filtros.busqueda.trim()) params.set('busqueda', filtros.busqueda.trim());
      if (filtros.metodo_pago !== 'todos') params.set('metodo_pago', filtros.metodo_pago);
      if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);

      const res = await fetch(`/api/admin/tesoreria/pagos?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Error al cargar pagos');
      }

      setFilas(json.data ?? []);
      setStats(
        json.stats ?? {
          total: 0,
          exitosos: 0,
          pendientes: 0,
          fallidos: 0,
          monto_exitoso: 0,
        },
      );
      setTotal(json.pagination?.total ?? 0);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (error) {
      toast.error('Error al cargar los últimos pagos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filtros, page]);

  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

  const handleFiltroChange = (patch: Partial<TesoreriaFiltrosState>) => {
    setFiltros((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const handleRangoPresetChange = (preset: UltimosPagosRangoPreset) => {
    setRangoPreset(preset);
    setFiltros((prev) => ({
      ...prev,
      ...rangoFechasUltimosPagos(preset),
    }));
    setPage(1);
  };

  const handleEstadoStatClick = (estado: EstadoTesoreriaFiltro) => {
    setFiltros((prev) => ({ ...prev, estado }));
    setPage(1);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPago(null);
  };

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-black uppercase tracking-widest animate-pulse">
          Cargando pagos...
        </p>
      </div>
    );
  }

  if (!can('view', 'pagos')) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 opacity-20" />
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
          Acceso Restringido
        </h2>
        <p className="text-gray-500 max-w-sm mt-2 font-medium">
          No cuentas con permisos para consultar los pagos efectuados.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="Últimos Pagos Efectuados"
          description="Consulta los abonos y pagos confirmados de pedidos, con soporte de pagos parciales"
          actionLabel="Registrar pago manual"
          onAction={puedeGestionar ? () => setModalMode('create') : undefined}
        />

        <TesoreriaPagosStats
          stats={stats}
          estadoFilter={filtros.estado}
          onFilterChange={handleEstadoStatClick}
        />

        <TesoreriaPagosToolbar
          filtros={filtros}
          loading={loading}
          onChange={handleFiltroChange}
          onRefresh={loadPagos}
          rangoPreset={rangoPreset}
          onRangoPresetChange={handleRangoPresetChange}
        />

        <TesoreriaPagosTable
          data={filas}
          isLoading={loading}
          onViewPedido={(row) => {
            setSelectedPago(mapFilaAModalPago(row));
            setModalMode('view');
          }}
          onViewComprobante={(row) => setComprobanteRow(row)}
          onVerify={
            puedeGestionar
              ? (row) => {
                setSelectedPago(mapFilaAModalPago(row));
                setModalMode('verify');
              }
              : undefined
          }
        />

        <TesoreriaPagosPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>
      
      {modalMode === 'view' && selectedPago && (
        <PagoDetailModal pago={selectedPago} onClose={closeModal} />
      )}

      {modalMode === 'verify' && selectedPago && (
        <PagoVerifyModal pago={selectedPago} onClose={closeModal} onSuccess={loadPagos} />
      )}

      <TesoreriaComprobanteDialog
        row={comprobanteRow}
        open={comprobanteRow !== null}
        onOpenChange={(open) => {
          if (!open) setComprobanteRow(null);
        }}
      />
    </div>
  );
}
