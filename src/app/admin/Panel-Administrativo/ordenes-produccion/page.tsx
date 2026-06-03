'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrdenesProduccion } from '@/lib/hooks/useOrdenProduccion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { OrdenesProduccionToolbar } from '@/components/admin/ordenes-produccion/OrdenesProduccionToolbar';
import { OrdenesProduccionStats } from '@/components/admin/ordenes-produccion/OrdenesProduccionStats';
import OrdenesSkeleton from '@/components/admin/ordenes-produccion/OrdenSkeleton';
import OrdenesTable from '@/components/admin/ordenes-produccion/OrdenesTable';

// Imports Dinámicos
const OrdenFormDialog = dynamic(() => import('@/components/admin/ordenes-produccion/OrdenFormDialog'));

export default function OrdenesProduccionPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [etapaFilter, setEtapaFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { ordenes, meta, isLoading } = useOrdenesProduccion({
    search: debouncedSearch,
    etapa: etapaFilter,
    page,
    limit,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<any>(null);

  const stats = useMemo(() => ({
    total: meta.total,
    enProceso: etapaFilter === 'costura' ? meta.total : (meta as any).enProceso ?? 0,
    completadas: etapaFilter === 'entrega' ? meta.total : (meta as any).completadas ?? 0,
  }), [meta, etapaFilter]);

  // Manejadores de Rutas Dinámicas para Detalle y Etapas
  const handleViewDetalle = (id: string | number) => {
    router.push(`/admin/Panel-Administrativo/ordenes-produccion/${id}`);
  };

  const handleViewEtapas = (id: string | number) => {
    router.push(`/admin/Panel-Administrativo/ordenes-produccion/${id}/etapas`);
  };

  if (isLoading && ordenes.length === 0) {
    return <OrdenesSkeleton />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        <AdminPageHeader
          title="Producción"
          description="Seguimiento de fabricación y control de talleres en tiempo real"
          actionLabel="Nueva Orden"
          onAction={() => { setSelectedOrden(null); setIsFormOpen(true); }}
        />

        {/* Stats */}
        <OrdenesProduccionStats
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={(active, etapa) => {
            setActiveFilter(active);
            setEtapaFilter(etapa);
          }}
        />

        {/* Filtros */}
        <OrdenesProduccionToolbar
          searchTerm={searchTerm}
          etapaFilter={etapaFilter}
          onSearchChange={setSearchTerm}
          onEtapaChange={setEtapaFilter}
          onClear={() => {
            setSearchTerm('');
            setEtapaFilter('all');
            setActiveFilter('all');
          }}
        />

        {/* Tabla — Soluciona el error de onEtapas */}
        <OrdenesTable
          data={ordenes}
          onView={handleViewDetalle}
          onEtapas={handleViewEtapas}
          onEdit={(orden) => { setSelectedOrden(orden); setIsFormOpen(true); }}
        />

        {/* Paginación */}
        {!isLoading && meta.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-slate-500">
              Página <span className="font-bold text-slate-900">{meta.page}</span> de <span className="font-bold text-slate-900">{meta.totalPages}</span>
              {' '} ({meta.total} registros)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                className="rounded-xl"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="sm"
                className="rounded-xl"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page === meta.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <OrdenFormDialog
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedOrden}
        />
      </div>
    </div>
  );
}