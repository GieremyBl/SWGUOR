'use client';

import type { PedidoConSeguimiento } from '@/lib/services/portal-seguimiento-pedido.service';
import { PedidoTracker } from '@/components/pedidos/PedidoTracker';
import { EstadoBadge } from '@/components/portal/EstadoBadge';

interface PedidoCardProps {
  pedido: PedidoConSeguimiento;
  onActualizado?: () => void;
}

export default function PedidoCard({ pedido, onActualizado }: PedidoCardProps) {
  const fechaFormateada = new Date(pedido.created_at).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="text-left space-y-2">
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-md uppercase tracking-wider border border-amber-200/60">
            {pedido.codigo}
          </span>
          <h3 className="text-lg font-bold text-slate-900">{pedido.cliente}</h3>
          <EstadoBadge estado={pedido.estado} tipo="pedido" />
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Unidades</p>
            <p className="text-base font-bold text-slate-900">{pedido.total_unidades}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Fecha pedido</p>
            <p className="text-base font-bold text-slate-900">{fechaFormateada}</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <PedidoTracker
          pedidoId={pedido.id}
          variant="portal"
          className="border-t border-slate-100 pt-6"
        />
      </div>
    </div>
  );
}
