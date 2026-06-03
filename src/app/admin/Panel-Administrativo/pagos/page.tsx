'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import PagosTable, { type Pago } from '@/components/admin/pagos/PagosTable';
import PagoFormModal from '@/components/admin/pagos/PagoFormModal';
import { PagoDetailModal, PagoVerifyModal } from '@/components/admin/pagos/PagoModals';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { PagosStats }   from '@/components/admin/pagos/PagosStats';
import { PagosToolbar } from '@/components/admin/pagos/PagosToolbar';
import {
  DollarSign, CheckCircle2, Clock, Search, RefreshCw, 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ModalMode = 'create' | 'view' | 'verify' | null;

export default function PagosPage() {
  const { can } = usePermissions();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');

  const loadPagos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pagos');
      if (!res.ok) throw new Error('Error al cargar pagos');
      const data = await res.json();
      setPagos(data);
    } catch (error) {
      toast.error('Error al cargar los datos de pagos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

  const stats = useMemo(() => {
    const total = pagos.length;
    const pendientes = pagos.filter(p => p.estado === 'pendiente').length;
    const verificados = pagos.filter(p => p.estado === 'verificado').length;
    const montoTotal = pagos
      .filter(p => p.estado === 'verificado')
      .reduce((acc, p) => acc + (typeof p.monto === 'string' ? parseFloat(p.monto) : p.monto), 0);
    return { total, pendientes, verificados, montoTotal };
  }, [pagos]);

  const filteredPagos = useMemo(() => {
    return pagos.filter(p => {
      const matchesSearch =
        String(p.pedido_id).includes(searchTerm) ||
        (p.pedidos?.clientes?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.pedidos?.clientes?.ruc?.includes(searchTerm));
      const matchesEstado = estadoFilter === 'todos' || p.estado === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [pagos, searchTerm, estadoFilter]);

  const handleView = (pago: Pago) => {
    setSelectedPago(pago);
    setModalMode('view');
  };

  const handleVerify = (pago: Pago) => {
    setSelectedPago(pago);
    setModalMode('verify');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPago(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        <AdminPageHeader
          title="Pagos"
          description="Control y verificación de pagos asociados a pedidos"
          actionLabel="Registrar Pago"
          onAction={() => setModalMode('create')}
        />

        {/* Stats */}
        <PagosStats
          stats={stats}
          estadoFilter={estadoFilter}
          onFilterChange={setEstadoFilter}
        />

        {/* Toolbar */}
        <PagosToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          loading={loading}
          onRefresh={loadPagos}
        />
        
        {/* Table */}
        <PagosTable
          data={filteredPagos}
          isLoading={loading}
          onView={handleView}
          onVerify={handleVerify}
        />
      </div>

      {/* Modals */}
      {modalMode === 'create' && (
        <PagoFormModal
          onClose={closeModal}
          onSuccess={loadPagos}
        />
      )}

      {modalMode === 'view' && selectedPago && (
        <PagoDetailModal
          pago={selectedPago}
          onClose={closeModal}
        />
      )}

      {modalMode === 'verify' && selectedPago && (
        <PagoVerifyModal
          pago={selectedPago}
          onClose={closeModal}
          onSuccess={loadPagos}
        />
      )}
    </div>
  );
}
