'use client';

import { useEffect, useState, useCallback } from 'react';
import { Package, RefreshCw, AlertCircle } from 'lucide-react';
import { getPedidosActivos, type PedidoConSeguimiento } from '@/lib/services/seguimiento-pedido.service';
import { usePortal } from '@/lib/hooks/usePortal';
import PedidoCard from '@/components/portal/seguimiento-pedido/PedidoCard';

export default function SeguimientoPedidoPage() {
  const { cliente } = usePortal();
  const [pedidos, setPedidos] = useState<PedidoConSeguimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPedidos = useCallback(async () => {
    if (!cliente?.id) return;
    setCargando(true);
    setError(null);
    try {
      const data = await getPedidosActivos();
      setPedidos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los pedidos activos.');
    } finally {
      setCargando(false);
    }
  }, [cliente?.id]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 sm:px-6">

      {/* Título de la Sección */}
      <div className="text-center space-y-2 mt-4">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Seguimiento de <span className="text-[#B8962D]">Pedidos</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Monitoreo y trazabilidad en tiempo real de su producción textil
        </p>
      </div>

      {/* Área Principal de Estados */}
      <div className="space-y-6">
        {cargando ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <RefreshCw className="animate-spin text-[#B8962D] w-7 h-7" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Sincronizando producción...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-2xl text-center max-w-md mx-auto">
            <AlertCircle className="mx-auto text-rose-500 mb-2 w-7 h-7" />
            <p className="text-rose-700 text-sm font-semibold">{error}</p>
            <button
              onClick={cargarPedidos}
              className="mt-3 text-xs font-bold uppercase text-rose-600 hover:underline block mx-auto"
            >
              Reintentar Operación
            </button>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="bg-white border border-slate-100 p-16 rounded-3xl text-center shadow-2xs max-w-2xl mx-auto">
            <Package className="mx-auto text-slate-200 mb-3 w-10 h-10" />
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
              No cuenta con órdenes en producción actualmente
            </p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <PedidoCard key={pedido.id} pedido={pedido} />
          ))
        )}
      </div>

    </div>
  );
}