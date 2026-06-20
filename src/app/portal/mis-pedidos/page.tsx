'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PackageSearch, Plus } from 'lucide-react';

import { usePortal } from '@/lib/hooks/usePortal';
import { useRouter } from 'next/navigation';

import { PedidoCard } from '@/components/portal/pedidos/PedidoCard';
import { PedidoKpis } from '@/components/portal/pedidos/PedidoKpis';
import { PedidoSkeleton } from '@/components/portal/pedidos/PedidoSkeleton';
import { PedidosEmpty } from '@/components/portal/pedidos/PedidosEmpty';
import { PedidosError } from '@/components/portal/pedidos/PedidosError';
import { PedidoAvisoPago } from '@/components/portal/pedidos/PedidoAvisoPago';
import { Pedido, EstadoPedido } from '@/components/portal/pedidos/types';

export default function MisPedidosPage() {
  const { cliente, loading: authLoading } = usePortal() as {
    cliente: { id: string } | null;
    loading: boolean;
  };

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const kpis = useMemo(() => ({
    total: pedidos.length,
    activos: pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_produccion').length,
    listos: pedidos.filter(p => p.estado === 'listo_para_despacho').length,
    entregados: pedidos.filter(p => p.estado === 'entregado').length,
  }), [pedidos]);

  const fetchPedidos = useCallback(async () => {
    if (!cliente?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/pedidos?todos=1', { cache: 'no-store' }).then(r => r.json());

      if (!res.success) throw new Error(res.error ?? 'Error al cargar pedidos');

      const pedidosFormateados: Pedido[] = (res.data ?? []).map((p: any) => ({
        id: p.id,
        total: p.total,
        estado: (p.estado ?? 'pendiente') as EstadoPedido,
        estado_pago: p.estado_pago ?? 'pendiente',
        created_at: p.created_at,
        total_unidades: p.total_unidades ?? 0,
        moneda: p.moneda ?? 'PEN',
        monto_pagado: Number(p.monto_pagado ?? 0),
        saldo_pendiente: Number(p.saldo_pendiente ?? 0),
      }));

      setPedidos(pedidosFormateados);
    } catch (err: unknown) {
      console.error('Error al recopilar el historial:', err);
      setError('No se pudieron cargar los pedidos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [cliente?.id]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const handleVerDetalle = useCallback((pedido: Pedido) => {
    router.push(`/portal/mis-pedidos/${pedido.id}`);
  }, [router]);

  const buildPagoUrl = useCallback((pedido: Pedido) => {
    const saldo =
      Number(pedido.saldo_pendiente ?? 0) > 0
        ? Number(pedido.saldo_pendiente)
        : Math.max(Number(pedido.total ?? 0) - Number(pedido.monto_pagado ?? 0), 0);
    const params = new URLSearchParams({
      total: String(Number(pedido.total ?? 0)),
      saldo: String(saldo),
      cantidad: String(Number(pedido.total_unidades ?? 0)),
      nombre: `Pedido #${pedido.id}`,
      moneda: String(pedido.moneda ?? 'PEN'),
    });
    return `/portal/pago/${pedido.id}?${params.toString()}`;
  }, []);

  const handlePagarDesdeCard = useCallback((pedido: Pedido) => {
    router.push(buildPagoUrl(pedido));
  }, [router, buildPagoUrl]);

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 text-white rounded-2xl shadow-lg bg-guor-gold shadow-guor-gold/30">
              <PackageSearch size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Mis Pedidos</h1>
              <p className="text-sm text-slate-500">
                {cliente ? 'Socio Corporativo GUOR' : 'Portal B2B'}
              </p>
            </div>
          </div>

          <Link
            href="/portal/catalogo"
            className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: 'var(--guor-dark)' }}
          >
            <Plus size={14} style={{ color: 'var(--guor-gold)' }} />
            Nueva Solicitud
          </Link>
        </div>

        {!loading && !error && pedidos.length > 0 && (
          <PedidoKpis
            total={kpis.total}
            activos={kpis.activos}
            listos={kpis.listos}
            entregados={kpis.entregados}
          />
        )}

        {!loading && !error && (
          <PedidoAvisoPago pedidos={pedidos} />
        )}

        {loading || authLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <PedidoSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <PedidosError mensaje={error} onReintentar={fetchPedidos} />
        ) : pedidos.length === 0 ? (
          <PedidosEmpty />
        ) : (
          <div className="space-y-2.5">
            {pedidos.map((pedido, i) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                index={i}
                onVerDetalle={handleVerDetalle}
                onPagar={handlePagarDesdeCard}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}