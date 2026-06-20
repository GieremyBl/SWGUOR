'use client';

import { useState } from 'react';
import { Loader2, PackageX, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SolicitarDevolucionModal } from '@/components/portal/soporte/SolicitarDevolucionModal';
import {
  ESTADO_DEVOLUCION_LABELS,
  ESTADO_DEVOLUCION_STYLES,
  MOTIVO_DEVOLUCION_LABELS,
} from '@/lib/constants/devoluciones-cliente';
import { useSoporteDevolucionesPortal } from '@/lib/hooks/useSoportePortal';
import type { EstadoDevolucion, MotivoDevolucion } from '@prisma/client';

export function SoporteDevolucionesTab() {
  const {
    devoluciones,
    pedidosEntregados,
    isLoading,
    isLoadingPedidos,
    refetch,
    refetchPedidos,
    crear,
    isCreating,
  } = useSoporteDevolucionesPortal();
  const [modalOpen, setModalOpen] = useState(false);

  const abrirModal = () => {
    refetchPedidos();
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-sm text-slate-500">
          Solicitudes de devolución sobre pedidos ya entregados.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>
            <span className="inline-flex items-center">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </span>
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-xl bg-rose-500 hover:bg-rose-600"
            onClick={abrirModal}
          >
            <span className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Devolución
            </span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-16 text-slate-500">
          <Loader2 className="w-7 h-7 animate-spin text-rose-500 mb-2" />
          <p className="text-sm">Cargando devoluciones...</p>
        </div>
      ) : devoluciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
          <PackageX className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin solicitudes de devolución</p>
          <p className="text-xs text-slate-500 mb-4">
            Puede solicitar la devolución de productos de pedidos entregados.
          </p>
          <Button type="button" className="rounded-xl bg-rose-500 hover:bg-rose-600" onClick={abrirModal}>
            <span className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Devolución
            </span>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {devoluciones.map((item) => {
            const estado = item.estado_solicitud as EstadoDevolucion;
            const motivo = item.motivo as MotivoDevolucion;
            return (
              <li
                key={String(item.id)}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500">
                    #{item.id}
                    {item.pedido_id ? ` · Pedido #${item.pedido_id}` : ''}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ESTADO_DEVOLUCION_STYLES[estado] ?? ''}`}
                  >
                    {ESTADO_DEVOLUCION_LABELS[estado] ?? item.estado_solicitud}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {item.productos?.nombre ?? 'Producto'}
                  {item.variantes_producto?.color || item.variantes_producto?.talla
                    ? ` · ${item.variantes_producto?.color ?? ''} / ${item.variantes_producto?.talla ?? ''}`
                    : ''}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {MOTIVO_DEVOLUCION_LABELS[motivo] ?? item.motivo} · {item.cantidad} ud(s)
                </p>
                {item.notas_cliente && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.notas_cliente}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString('es-PE')
                    : '—'}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <SolicitarDevolucionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        pedidosEntregados={pedidosEntregados}
        isLoadingPedidos={isLoadingPedidos}
        onSubmit={async (payload) => {
          await crear(payload);
        }}
        isSubmitting={isCreating}
      />
    </>
  );
}
