import { Lock, Package, Archive, AlertTriangle } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import ReservasStockTable from '@/components/admin/inventario/reservas/ReservasStockTable';
import { listarReservasActivasAdmin } from '@/lib/services/reserva-stock-admin.service';

export const dynamic = 'force-dynamic';

export default async function ReservasStockPage() {
  const reservas = await listarReservasActivasAdmin();
  const vencidas = reservas.filter((r) => r.estaVencida).length;
  const unidades = reservas.reduce((s, r) => s + r.cantidad, 0);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Encabezado ── */}
        <AdminPageHeader
          title="Reservas de stock"
          description="Monitoreo de stock apartado por pedidos o cotizaciones activas (CUS_46)."
          icon={Lock}
          showAction={false}
        />

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Reservas activas"
            value={reservas.length}
            icon={Archive}
            color="slate"
          />
          <StatCard
            title="Unidades apartadas"
            value={unidades.toLocaleString('es-PE')}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Expiradas (aún activas en BD)"
            value={vencidas}
            icon={AlertTriangle}
            color="amber"
          />
        </div>

        {/* ── Tabla ── */}
        <ReservasStockTable data={reservas} />

      </div>
    </div>
  );
}