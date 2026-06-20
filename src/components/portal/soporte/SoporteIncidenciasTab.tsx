'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportarIncidenciaModal } from '@/components/portal/soporte/ReportarIncidenciaModal';
import {
  ESTADO_INCIDENCIA_LABELS,
  ESTADO_INCIDENCIA_STYLES,
  TIPO_INCIDENCIA_CLIENTE_LABELS,
} from '@/lib/constants/incidencias-cliente';
import { useSoporteIncidenciasPortal } from '@/lib/hooks/useSoportePortal';
import type { TipoIncidenciaCliente } from '@prisma/client';

export function SoporteIncidenciasTab() {
  const { incidencias, isLoading, refetch, crear, isCreating } = useSoporteIncidenciasPortal();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-sm text-slate-500">
          Reporte de problemas post-venta vinculados a sus pedidos.
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
            onClick={() => setModalOpen(true)}
          >
            <span className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Reportar Problema
            </span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-16 text-slate-500">
          <Loader2 className="w-7 h-7 animate-spin text-rose-500 mb-2" />
          <p className="text-sm">Cargando incidencias...</p>
        </div>
      ) : incidencias.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin incidencias registradas</p>
          <p className="text-xs text-slate-500 mb-4">
            Si tuvo un problema con un pedido, repórtelo para que soporte lo revise.
          </p>
          <Button
            type="button"
            className="rounded-xl bg-rose-500 hover:bg-rose-600"
            onClick={() => setModalOpen(true)}
          >
            <span className="inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Reportar Problema
            </span>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {incidencias.map((item) => {
            const estadoKey = (item.estado ?? 'abierta') as keyof typeof ESTADO_INCIDENCIA_LABELS;
            return (
              <li
                key={String(item.id)}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500">
                    #{item.id} · Pedido #{item.pedido_id}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ESTADO_INCIDENCIA_STYLES[estadoKey] ?? ''}`}
                  >
                    {ESTADO_INCIDENCIA_LABELS[estadoKey] ?? item.estado}
                  </span>
                </div>
                {item.tipo && (
                  <p className="text-sm font-semibold text-slate-800 mb-1">
                    {TIPO_INCIDENCIA_CLIENTE_LABELS[item.tipo as TipoIncidenciaCliente]}
                  </p>
                )}
                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4">
                  {item.descripcion}
                </p>
                {item.evidencia_url?.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    {item.evidencia_url.length} archivo(s) de evidencia adjunto(s)
                  </p>
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

      <ReportarIncidenciaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={async (payload) => {
          await crear(payload);
        }}
        isSubmitting={isCreating}
      />
    </>
  );
}
