'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Package, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { InsumosStats } from '@/components/admin/insumos/InsumosStats';
import { InsumosToolbar } from '@/components/admin/insumos/InsumosToolbar';
import InsumosTable from '@/components/admin/insumos/InsumosTable';
import { useInsumos } from '@/lib/hooks/useInsumos';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { TIPOS_INSUMO } from '@/lib/constants/insumos';
import { UNIDADES_MEDIDA } from '@/lib/constants/estados';
import type { InsumoCompraRow } from '@/lib/helpers/insumos-helpers';
import { exportToExcel, exportToPDF } from '@/lib/utils/export-utils';
import type { TipoInsumo, UnidadMedida } from '@prisma/client';

const InsumoFormDialog = dynamic(() => import('@/components/admin/insumos/InsumoFormDialog'));

export default function InsumosPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [stockFilter, setStockFilter] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InsumoCompraRow | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const { insumos, isLoading, refetch, create, update, isSaving } = useInsumos({
    tipo: tipoFilter !== 'todos' ? tipoFilter : undefined,
    busqueda: searchTerm.trim() || undefined,
    stockBajo: stockFilter === 'bajo' ? true : undefined,
  });

  const canView = can('view', 'insumo');
  const canCreate = can('create', 'insumo');
  const canEdit = can('edit', 'insumo');
  const canExport = can('export', 'insumo');

  const filtered = useMemo(() => {
    let list = insumos as InsumoCompraRow[];
    if (stockFilter === 'sin') {
      list = list.filter((i) => Number(i.stock_actual) <= 0);
    } else if (stockFilter === 'optimo') {
      list = list.filter((i) => Number(i.stock_actual) > Number(i.stock_minimo));
    } else if (stockFilter === 'bajo') {
      list = list.filter(
        (i) => Number(i.stock_actual) > 0 && Number(i.stock_actual) <= Number(i.stock_minimo),
      );
    }
    return list;
  }, [insumos, stockFilter]);

  const stats = useMemo(() => {
    const list = insumos as InsumoCompraRow[];
    return {
      total: list.length,
      bajoStock: list.filter(
        (i) => Number(i.stock_actual) > 0 && Number(i.stock_actual) <= Number(i.stock_minimo),
      ).length,
      sinStock: list.filter((i) => Number(i.stock_actual) <= 0).length,
      conOrdenes: list.filter((i) => (i._count?.ordenes_compra_items ?? 0) > 0).length,
    };
  }, [insumos]);

  const handleSave = async (data: Record<string, unknown>) => {
    if (editing) {
      const res = await update(String(editing.id), data);
      return { success: res?.success === true, error: res?.error };
    }
    const res = await create(data);
    return { success: res?.success === true, error: res?.error };
  };

  const handleExportExcel = async () => {
    if (!canExport || filtered.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    try {
      setExportingExcel(true);
      await exportToExcel(
        filtered.map((i) => ({
          Nombre: i.nombre,
          Tipo: TIPOS_INSUMO[i.tipo as TipoInsumo]?.label ?? i.tipo,
          Categoría: i.categoria_insumo?.nombre ?? (i.categoria_id ? `Cat. #${i.categoria_id}` : '—'),
          Proveedor: i.proveedores?.razon_social ?? '—',
          Stock: Number(i.stock_actual),
          Unidad: UNIDADES_MEDIDA[i.unidad_medida as UnidadMedida]?.label ?? i.unidad_medida,
          'Precio ref.': Number(i.precio_unitario ?? 0),
          'Órdenes compra': i._count?.ordenes_compra_items ?? 0,
        })),
        { filename: 'Insumos_SWGUOR' },
      );
      toast.success('Excel descargado');
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canExport || filtered.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    try {
      setExportingPDF(true);
      await exportToPDF(
        [['Insumo', 'Tipo', 'Proveedor', 'Stock', 'Precio', 'OC']],
        filtered.map((i) => [
          i.nombre,
          TIPOS_INSUMO[i.tipo as TipoInsumo]?.label ?? i.tipo,
          i.proveedores?.razon_social ?? '—',
          String(Number(i.stock_actual)),
          `S/ ${Number(i.precio_unitario ?? 0).toFixed(2)}`,
          String(i._count?.ordenes_compra_items ?? 0),
        ]),
        { title: 'Catálogo de Insumos', filename: `Insumos_${new Date().toISOString().split('T')[0]}` },
      );
      toast.success('PDF descargado');
    } catch {
      toast.error('Error al exportar PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  if (!authLoading && !canView) {
    return (
      <div className="p-8 text-center text-gray-500">
        No tienes permisos para ver el catálogo de insumos.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        title="Insumos"
        description="Catálogo de materiales e insumos vinculados a órdenes de compra."
        actionLabel="Nuevo insumo"
        onAction={() => { setEditing(null); setShowForm(true); }}
        showAction={canCreate}
        icon={Package}
      >
        {canExport && (
          <>
            <Button
              variant="outline"
              className="h-11 rounded-xl bg-white"
              onClick={handleExportExcel}
              disabled={exportingExcel}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl bg-white"
              onClick={handleExportPDF}
              disabled={exportingPDF}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </>
        )}
      </AdminPageHeader>

      <InsumosStats stats={stats} />

      <InsumosToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        tipoFilter={tipoFilter}
        onTipoChange={setTipoFilter}
        stockFilter={stockFilter}
        onStockChange={setStockFilter}
        isLoading={isLoading}
        onRefresh={() => refetch()}
      />

      <InsumosTable
        insumos={filtered}
        isLoading={isLoading || authLoading}
        canEdit={canEdit}
        onEdit={(i) => { setEditing(i); setShowForm(true); }}
      />

      <InsumoFormDialog
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSave={handleSave}
        insumo={editing}
        isSaving={isSaving}
      />
    </div>
  );
}
