'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, Search, Plus, RefreshCw, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useProveedores } from '@/lib/hooks/useProveedores';
import ProveedorTable from '@/components/admin/proveedores/ProveedorTable';
import ProveedorFormModal from '@/components/admin/proveedores/ProveedorFormModal';
import { ProveedorDeleteModal, ProveedorDetailModal } from '@/components/admin/proveedores/ProveedorModals';
import { ProveedorStatCard } from '@/components/admin/proveedores/ProveedorStatCard';
import type { Proveedor, ProveedorForm, EstadoProveedor } from '@/lib/schemas/proveedor';
import { exportToExcel, exportToPDF } from '@/lib/utils/export-utils';

const PAGE_SIZE = 15;

export default function ProveedoresPage() {
  const { can, isLoading: authLoading } = usePermissions();
  
  // ── UI state ───────────────────────────────────────────────
  const [page,               setPage]               = useState(1);
  const [busqueda,          setBusqueda]          = useState('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
  const [estadoFilter,      setEstadoFilter]      = useState<EstadoProveedor>('');
  const [showForm,          setShowForm]          = useState(false);
  const [editingProveedor,  setEditingProveedor]  = useState<Proveedor | null>(null);
  const [deleteTarget,      setDeleteTarget]      = useState<Proveedor | null>(null);
  const [detailTarget,      setDetailTarget]      = useState<Proveedor | null>(null);
  
  // Estados de carga para las exportaciones
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Debounce búsqueda
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusqueda(busqueda), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // ── Data ───────────────────────────────────────────────────
  const {
    proveedores = [] as Proveedor[], 
    pagination, 
    isLoading, 
    refetch,
    save, 
    deactivate, 
    isSaving, 
    isDeactivating,
  } = useProveedores({
    page,
    limit:       PAGE_SIZE,
    busqueda:    debouncedBusqueda,
    estadoFilter,
    editingId:   editingProveedor?.id,
  }) as any;

  const listaProveedores = (proveedores ?? []) as Proveedor[];

  // ── Permisos ───────────────────────────────────────────────
  const canView   = can('view',   'proveedores');
  const canCreate = can('create', 'proveedores') || can('edit', 'proveedores');

  // ── Handlers ──────────────────────────────────────────────
  const handleNew = () => { setEditingProveedor(null); setShowForm(true); };
  const handleEdit = (p: Proveedor) => { setEditingProveedor(p); setShowForm(true); };
  const handleDelete = (p: Proveedor) => {
    if (p.estado === 'inactivo') { 
      toast.info('Este proveedor ya está desactivado');
      return; 
    }
    setDeleteTarget(p);
  };

  const handleSave = (data: ProveedorForm) => {
    save({ ...data, id: editingProveedor?.id });
    setShowForm(false);
    setEditingProveedor(null);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deactivate(deleteTarget.id!);
      setDeleteTarget(null);
    }
  };

  // ── LÓGICA DE EXPORTACIÓN EXCEL Y PDF ────────────────────────────────────────
  const handleExportExcel = async () => {
    if (listaProveedores.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    try {
      setExportingExcel(true);
      const datosExcel = listaProveedores.map((p: Proveedor) => ({
        'Razón Social': p.razon_social,
        'RUC': p.ruc,
        'Contacto': p.contacto || '—',
        'Teléfono': p.telefono || '—',
        'Email': p.email || '—',
        'Estado': p.estado === 'activo' ? 'Activo' : 'Inactivo',
      }));
      await exportToExcel(datosExcel, { filename: 'Proveedores_SWGUOR' });
      toast.success('Excel descargado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar a Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (listaProveedores.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const toastId = toast.loading('Preparando reporte PDF...');
    try {
      setExportingPDF(true);

      // 1. Definimos los encabezados en formato de matriz string[][]
      const cabecerasPDF = [['Razón Social', 'RUC', 'Contacto', 'Teléfono', 'Email', 'Estado']];

      // 2. Mapeamos explícitamente los objetos a un arreglo bidimensional de textos (string[][])
      // Tipamos (p: Proveedor) para solucionar el error de tipo 'any' implícito (TS 7006)
      const cuerpoPDF = listaProveedores.map((p: Proveedor) => [
        p.razon_social,
        p.ruc,
        p.contacto || '—',
        p.telefono || '—',
        p.email || '—',
        p.estado === 'activo' ? 'Activo' : 'Inactivo'
      ]);
      
      // 3. Enviamos los parámetros en el orden exacto que espera tu función utilitaria
      await exportToPDF(
        cabecerasPDF,
        cuerpoPDF,
        {
          title: 'REPORTE DE PROVEEDORES',
          filename: `Proveedores_GUOR_${new Date().toISOString().split('T')[0]}`,
        }
      );
      
      toast.success('PDF generado correctamente', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el PDF', { id: toastId });
    } finally {
      setExportingPDF(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Verificando permisos...</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg font-semibold">No tienes permisos para ver esta sección</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <Building2 className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
              <p className="text-gray-500 text-sm">Gestión de abastecimiento y suministros</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportingExcel || isLoading}
              className="h-11 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
              {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportingPDF || isLoading}
              className="h-11 rounded-xl border-red-200 hover:bg-red-50 hover:text-red-700 text-gray-600 font-medium transition-all"
            >
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
            </Button>

            {canCreate && (
              <Button
                onClick={handleNew}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 h-11 px-6 rounded-xl transition-all active:scale-95 shadow-lg"
              >
                <Plus className="w-5 h-5" /> Agregar Proveedor
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <ProveedorStatCard
            label="TOTAL"
            value={pagination?.total ?? 0}
            color="rose"
            isActive={!estadoFilter}
            onClick={() => { setEstadoFilter(''); setPage(1); }}
          />
          <ProveedorStatCard
            label="ACTIVOS"
            value={listaProveedores.filter((p: Proveedor) => p.estado === 'activo').length}
            color="emerald"
            isActive={estadoFilter === 'activo'}
            onClick={() => { setEstadoFilter('activo'); setPage(1); }}
          />
          <ProveedorStatCard
            label="INACTIVOS"
            value={listaProveedores.filter((p: Proveedor) => p.estado === 'inactivo').length}
            color="orange"
            isActive={estadoFilter === 'inactivo'}
            onClick={() => { setEstadoFilter('inactivo'); setPage(1); }}
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por razón social o RUC..."
              className="pl-10 h-11 border-gray-200 focus:ring-rose-500"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
            />
          </div>
          <Button variant="outline" className="h-11 border-gray-200" onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabla */}
        <div className="space-y-4">
          <ProveedorTable
            data={listaProveedores}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetail={setDetailTarget}
          />

          {/* Paginación */}
          {!isLoading && pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando{' '}
                <span className="font-bold text-gray-900">{listaProveedores.length}</span>{' '}
                de{' '}
                <span className="font-bold text-gray-900">{pagination.total}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border rounded-lg flex items-center">
                  Página {page} de {pagination.totalPages}
                </div>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modales */}
      {showForm && (
        <ProveedorFormModal
          proveedor={editingProveedor}
          isSaving={isSaving}
          onClose={() => { setShowForm(false); setEditingProveedor(null); }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ProveedorDeleteModal
          proveedor={deleteTarget}
          isDeleting={isDeactivating}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {detailTarget && (
        <ProveedorDetailModal
          proveedor={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
}