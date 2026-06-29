// /app/admin/Panel-Administrativo/inventario/reservas/page.tsx

import { Lock, AlertTriangle } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import ReservasStatsCards from '@/components/admin/inventario/reservas/ReservasStatsCards';
import ReservasStockTable from '@/components/admin/inventario/reservas/ReservasStockTable';
import { listarReservasActivasAdmin } from '@/lib/services/reserva-stock-admin.service';

export const dynamic = 'force-dynamic';

export default async function ReservasStockPage() {
  try {
    const reservas = await listarReservasActivasAdmin();
    const vencidas = reservas.filter((r) => r.estaVencida).length;
    const unidades = reservas.reduce((s, r) => s + r.cantidad, 0);
    const unidadesFormatted = unidades.toLocaleString('es-PE');

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

          {/* ── Stats (Client Component Wrapper) ── */}
          <ReservasStatsCards
            totalReservas={reservas.length}
            totalUnidades={unidades}
            totalVencidas={vencidas}
            unidadesFormatted={unidadesFormatted}
          />

          {/* ── Tabla ── */}
          <ReservasStockTable data={reservas} />

        </div>
      </div>
    );
  } catch (error) {
    console.error('Error en página de reservas:', error);

    return (
      <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <AdminPageHeader
            title="Reservas de stock"
            description="Monitoreo de stock apartado por pedidos o cotizaciones activas (CUS_46)."
            icon={Lock}
            showAction={false}
          />

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex gap-4">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  Error al cargar reservas
                </h3>
                <p className="text-red-700 text-sm">
                  {error instanceof Error ? error.message : 'Error desconocido'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}