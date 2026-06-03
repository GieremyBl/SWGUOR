import { Lock } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import ReservasStockTable from '@/components/admin/inventario/reservas/ReservasStockTable';
import { listarReservasActivasAdmin } from '@/lib/services/reserva-stock-admin.service';

export const dynamic = 'force-dynamic';

export default async function ReservasStockPage() {
  const reservas = await listarReservasActivasAdmin();
  const vencidas = reservas.filter((r) => r.estaVencida).length;

  return (
    <div className="space-y-8 p-1">
      <AdminPageHeader
        title="Reservas de stock"
        description="Monitoreo de stock apartado por pedidos o cotizaciones activas (CUS_46)."
        showAction={false}
        icon={Lock}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Reservas activas
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">{reservas.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Unidades apartadas
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {reservas.reduce((s, r) => s + r.cantidad, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
            Expiradas (aún activas en BD)
          </p>
          <p className="text-2xl font-black text-amber-800 mt-1">{vencidas}</p>
        </div>
      </div>

      <ReservasStockTable data={reservas} />
    </div>
  );
}
