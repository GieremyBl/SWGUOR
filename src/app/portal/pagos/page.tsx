'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComprobantePdfSimuladoModal } from '@/components/portal/pagos/metodos-pagos/ComprobantePdfSimuladoModal';
import { HistorialPagosTable } from '@/components/portal/pagos/HistorialPagosTable';
import { HistorialPagosRecientesList } from '@/components/portal/pagos/HistorialPagosRecientesList';
import { MisPagosVistaSelector } from '@/components/portal/pagos/MisPagosVistaSelector';
import { usePortal } from '@/lib/hooks/usePortal';
import type { MisPagosVista } from '@/lib/constants/portal-mis-pagos';
import { parseMisPagosVistaParam } from '@/lib/constants/portal-pedido-detalle';
import { buildHistorialTransaccionesRecientes } from '@/lib/helpers/portal-historial-pagos.helper';
import type { PagoConfirmacionResumen } from '@/lib/schemas/pago-confirmacion';
import type { HistorialPagoFila } from '@/lib/schemas/portal-historial-pagos';

export default function MisPagosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cliente, loading: authLoading } = usePortal() as {
    cliente: { id: string } | null;
    loading: boolean;
  };

  const [filas, setFilas] = useState<HistorialPagoFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumenComprobante, setResumenComprobante] = useState<PagoConfirmacionResumen | null>(
    null,
  );
  const [modalComprobanteOpen, setModalComprobanteOpen] = useState(false);
  const [vista, setVista] = useState<MisPagosVista>(() =>
    parseMisPagosVistaParam(searchParams.get('vista')),
  );

  useEffect(() => {
    setVista(parseMisPagosVistaParam(searchParams.get('vista')));
  }, [searchParams]);

  const resumenFiltrado = useMemo(
    () =>
      filas.filter(
        (f) => f.estado_pago === 'pagado' || f.estado_pago === 'parcial' || f.monto_pagado > 0,
      ).length,
    [filas],
  );

  const transaccionesRecientes = useMemo(
    () => buildHistorialTransaccionesRecientes(filas),
    [filas],
  );

  const filasPorPedido = useMemo(
    () => new Map(filas.map((fila) => [fila.pedido_id, fila])),
    [filas],
  );

  const fetchHistorial = useCallback(async () => {
    if (!cliente?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/pagos/historial');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Error al cargar el historial');
      }

      setFilas(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [cliente?.id]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const handleCambioVista = useCallback(
    (nuevaVista: MisPagosVista) => {
      setVista(nuevaVista);
      const url =
        nuevaVista === 'historico' ? '/portal/pagos?vista=historico' : '/portal/pagos';
      router.replace(url, { scroll: false });
    },
    [router],
  );

  const abrirComprobante = useCallback(async (pedidoId: number, comprobanteId: string) => {
    try {
      const params = new URLSearchParams({
        pedido_id: String(pedidoId),
        comprobante_id: comprobanteId,
      });
      const res = await fetch(`/api/portal/pago/confirmacion?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'No se pudo cargar el comprobante');
      }

      setResumenComprobante(json.data as PagoConfirmacionResumen);
      setModalComprobanteOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir el comprobante');
    }
  }, []);

  const handleVerComprobante = useCallback(
    async (fila: HistorialPagoFila) => {
      if (!fila.comprobante?.id) return;
      await abrirComprobante(fila.pedido_id, fila.comprobante.id);
    },
    [abrirComprobante],
  );

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 text-white rounded-2xl shadow-lg bg-[#231e1d] shadow-[#231e1d]/20">
              <CreditCard size={24} className="text-[#e4c28a]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Mis Pagos</h1>
              <p className="text-sm text-slate-500">
                Historial de transacciones y comprobantes electrónicos
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            onClick={fetchHistorial}
            disabled={loading || authLoading}
          >
            <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {!loading && !error && filas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Pedidos
              </p>
              <p className="text-2xl font-black text-[#231e1d] mt-1">{filas.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">
                {vista === 'historico' ? 'Transacciones' : 'Con movimiento de pago'}
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {vista === 'historico' ? transaccionesRecientes.length : resumenFiltrado}
              </p>
            </div>
            <div className="rounded-xl border border-[#e4c28a]/30 bg-[#fffdf8] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#b5854b]/70">
                Comprobantes emitidos
              </p>
              <p className="text-2xl font-black text-[#231e1d] mt-1">
                {filas.filter((f) => f.comprobante).length}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <MisPagosVistaSelector
            value={vista}
            onChange={handleCambioVista}
            disabled={loading || authLoading}
          />
          <p className="text-xs text-slate-500">
            {vista === 'pedidos'
              ? 'Agrupa los abonos dentro de cada pedido.'
              : 'Listado cronológico de pagos, del más reciente al más antiguo.'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {vista === 'pedidos' ? (
          <HistorialPagosTable
            filas={filas}
            loading={loading || authLoading}
            vista={vista}
            onVerComprobante={handleVerComprobante}
            onVerComprobanteAbono={abrirComprobante}
          />
        ) : (
          <HistorialPagosRecientesList
            transacciones={transaccionesRecientes}
            filasPorPedido={filasPorPedido}
            loading={loading || authLoading}
            vista={vista}
            onVerComprobanteAbono={abrirComprobante}
          />
        )}
      </div>

      {resumenComprobante && (
        <ComprobantePdfSimuladoModal
          open={modalComprobanteOpen}
          onOpenChange={setModalComprobanteOpen}
          resumen={resumenComprobante}
        />
      )}
    </>
  );
}
