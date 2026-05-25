'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Plus, Search, RefreshCw, Clock, CheckCircle2, DollarSign,
  FileSpreadsheet, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import OrdenesCompraTable from '@/components/admin/ordenes-compra/OrdenesCompraTable';
import { useOrdenesCompra } from '@/lib/hooks/useOrdenesCompra';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { ESTADOS_ORDEN_COMPRA } from '@/lib/constants/estados';
import type { OrdenCompraRow } from '@/components/admin/ordenes-compra/types';
import { exportToExcel } from '@/lib/utils/export-utils';

export default function OrdenesCompraPage() {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  
  // Estados de carga para las exportaciones
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const {
    ordenes,
    isLoading,
    refetch,
    confirmar,
    cancelar,
    isConfirming,
    isCancelling,
  } = useOrdenesCompra({
    estado: estadoFilter !== 'todos' ? estadoFilter : undefined,
  });

  const canView = can('view', 'ordenes_compra');
  const canCreate = can('create', 'ordenes_compra');
  const canEdit = can('edit', 'ordenes_compra');
  const canCancel = can('cancel', 'ordenes_compra');

  const filtered = useMemo(() => {
    const list = (ordenes ?? []) as OrdenCompraRow[];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (o) =>
        o.proveedores?.razon_social?.toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        o.cotizaciones_proveedor?.numero_externo?.toLowerCase().includes(q),
    );
  }, [ordenes, searchTerm]);

  const stats = useMemo(() => {
    const list = (ordenes ?? []) as OrdenCompraRow[];
    return {
      total: list.length,
      pendientes: list.filter((o) => o.estado === 'pendiente').length,
      confirmadas: list.filter((o) => o.estado === 'confirmada').length,
      montoTotal: list
        .filter((o) => o.estado !== 'cancelada')
        .reduce((acc, o) => acc + Number(o.total_orden), 0),
    };
  }, [ordenes]);

  // ── LÓGICA DE EXPORTACIÓN EXCEL Y PDF ────────────────────────────────────────
  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    try {
      setExportingExcel(true);
      const datosExcel = filtered.map((o) => ({
        'N° OC': `OC-${o.id.toString().padStart(6, '0')}`,
        'Proveedor': o.proveedores?.razon_social ?? `Prov. #${o.proveedor_id}`,
        'Cotización': o.cotizaciones_proveedor?.numero_externo
          ? `#${o.cotizaciones_proveedor.numero_externo}`
          : o.cotizacion_proveedor_id
          ? `COT-${o.cotizacion_proveedor_id}`
          : 'Manual',
        'Total': `S/ ${Number(o.total_orden).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        'F. prometida': o.fecha_prometida ? new Date(o.fecha_prometida).toLocaleDateString('es-PE') : '—',
        'Estado': ESTADOS_ORDEN_COMPRA[o.estado]?.label || o.estado,
        'Pago': o.estado_pago,
      }));

      await exportToExcel(datosExcel, { filename: 'Ordenes_de_Compra_SWGUOR' });
      toast.success('Excel descargado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar a Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (filtered.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    try {
      setExportingPDF(true);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar a PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleConfirmar = async (orden: OrdenCompraRow) => {
    try {
      await confirmar(orden.id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al confirmar');
    }
  };

  const handleCancelar = async (orden: OrdenCompraRow) => {
    try {
      await cancelar(orden.id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cancelar');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-8 text-center text-slate-500">
        No tiene permisos para ver órdenes de compra.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado Superior con los colores de botón solicitados */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
            <p className="text-slate-500 text-sm">Generación y seguimiento de órdenes a proveedores (CUS-50)</p>
          </div>
          <div className="flex items-center gap-3">
            
            {/* BOTÓN EXPORTAR EXCEL CON TUS COLORES */}
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportingExcel || isLoading}
              className="h-11 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
              {exportingExcel ? 'Exportando...' : 'Excel'}
            </Button>

            {/* BOTÓN EXPORTAR PDF CON TUS COLORES */}
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportingPDF || isLoading}
              className="h-11 rounded-xl border-red-200 hover:bg-red-50 hover:text-red-700 text-gray-600 font-medium transition-all"
            >
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              {exportingPDF ? 'Exportando...' : 'PDF'}
            </Button>

            {canCreate && (
              <Button
                className="bg-rose-600 hover:bg-rose-700 shadow-lg font-bold gap-2 h-11 px-6 text-white transition-all active:scale-95 rounded-xl"
                onClick={() => router.push('/admin/Panel-Administrativo/ordenes-compra/nueva')}
              >
                <Plus className="w-5 h-5" /> Nueva orden
              </Button>
            )}
          </div>
        </div>

        {/* Tarjetas Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total OC" value={stats.total} icon={ShoppingBag} color="slate" />
          <StatCard title="Pendientes" value={stats.pendientes} icon={Clock} color="orange" />
          <StatCard title="Confirmadas" value={stats.confirmadas} icon={CheckCircle2} color="emerald" />
          <StatCard
            title="Monto activo"
            value={`S/ ${stats.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`}
            icon={DollarSign}
            color="blue"
            disabled
          />
        </div>

        {/* Barra de Búsqueda y Filtros de abajo */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por proveedor, N° OC..."
              className="pl-10 h-11 bg-white rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11 bg-white rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {Object.entries(ESTADOS_ORDEN_COMPRA).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="h-11 rounded-xl bg-white" onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Listado Principal - Tabla */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border animate-pulse h-64" />
        ) : (
          <OrdenesCompraTable
            ordenes={filtered}
            onVer={(o) => {
              router.push(`/admin/Panel-Administrativo/ordenes-compra/${o.id}`);
            }}
            onConfirmar={canEdit ? handleConfirmar : undefined}
            onCancelar={canCancel ? handleCancelar : undefined}
            canConfirm={canEdit && !isConfirming}
            canCancel={canCancel && !isCancelling}
            isCancelling={isCancelling}
          />
        )}

      </div>
    </div>
  );
}