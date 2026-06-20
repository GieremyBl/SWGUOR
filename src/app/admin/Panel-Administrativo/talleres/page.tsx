"use client";

import { useState, useMemo, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useTalleres } from "@/lib/hooks/useTalleres";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet, Plus, Search, Factory, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  FileText, ShieldAlert
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";
import TallerFormModal from "@/components/admin/talleres/TallerFormModal";
import { TallerDetailModal, TallerSuspendModal } from "@/components/admin/talleres/TallerModals";
import StatCard from '@/components/admin/common/StatCard';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import type { Taller, TallerForm } from "@/lib/schemas/talleres";
import type { EstadoTaller } from "@/lib/schemas/talleres";

const TalleresTable = dynamic(() => import("@/components/admin/talleres/TalleresTable"));
const TallerSkeleton = dynamic(() => import("@/components/admin/talleres/TallerSkeleton"));

type DialogMode = "create" | "edit" | "view" | "delete" | null;

export default function TalleresPage() {
  const { can, isLoading: authLoading } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaller, setSelectedTaller] = useState<Taller | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<EstadoTaller>("todos");

  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const pageSize = 10;

  const {
    talleres,
    isLoading,
    refetch,
    create,
    update,
    suspend,
    isCreating,
    isUpdating,
    isSuspending,
  } = useTalleres();

  const stats = useMemo(() => ({
    total: talleres.length,
    activos: talleres.filter((t) => t.estado === 'activo').length,
    inactivos: talleres.filter((t) => t.estado === 'inactivo').length,
    suspendidos: talleres.filter((t) => t.estado === 'suspendido').length,
  }), [talleres]);

  const openDialog = useCallback((mode: DialogMode, taller?: Taller) => {
    setSelectedTaller(taller ?? null);
    setDialogMode(mode);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogMode(null);
    setSelectedTaller(null);
  }, []);

  const filteredTalleres = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return talleres.filter((t) => {
      const matchSearch = !search ||
        t.nombre.toLowerCase().includes(search) ||
        t.ruc.includes(search) ||
        t.contacto.toLowerCase().includes(search);
      const matchStatus = statusFilter === 'todos' || t.estado === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [talleres, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredTalleres.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredTalleres.slice(start, start + pageSize);
  }, [filteredTalleres, currentPage]);

  const handleSave = async (data: TallerForm) => {
    if (dialogMode === 'edit' && selectedTaller) {
      const { ruc: _ruc, ...rest } = data;
      const res = await update(String(selectedTaller.id), rest);
      return { success: res?.success === true, error: res?.error };
    }
    const res = await create(data);
    return { success: res?.success === true, error: res?.error };
  };

  const handleExportExcel = async () => {
    if (filteredTalleres.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    try {
      setExportingExcel(true);
      await exportToExcel(filteredTalleres, { filename: "Talleres" });
      toast.success("Excel descargado correctamente");
    } catch {
      toast.error("Error al exportar a Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (filteredTalleres.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    const toastId = toast.loading("Preparando reporte PDF...");
    try {
      setExportingPDF(true);
      const excelData: string[][] = filteredTalleres.map((t) => [
        String(t.nombre || ''),
        String(t.ruc || ''),
        String(t.contacto || ''),
        String(t.email || '—'),
        String(t.estado || ''),
      ]);

      await exportToPDF(excelData, [], { title: "Reporte de Talleres", filename: "Talleres_GUOR" });
      toast.success("PDF generado correctamente", { id: toastId });
    } catch {
      toast.error("Error al generar el PDF", { id: toastId });
    } finally {
      setExportingPDF(false);
    }
  };

  if (authLoading) return <LoadingTalleres />;
  if (!can('view', 'talleres')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        <AdminPageHeader
          title="Gestión de Talleres"
          description="Control centralizado de maquila y servicios externos"
          actionLabel="Nuevo Taller"
          onAction={() => openDialog("create")}
          showAction={can('create', 'talleres')}
        >
          {can('export', 'talleres') && (
            <>
              {/* BOTÓN EXPORTAR EXCEL CON TU DISEÑO UNIFICADO */}
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={exportingExcel || isLoading}
                className="h-11 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
              </Button>

              {/* BOTÓN EXPORTAR PDF CON TU DISEÑO UNIFICADO */}
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={exportingPDF || isLoading}
                className="h-11 rounded-xl border-red-200 hover:bg-red-50 hover:text-red-700 text-gray-600 font-medium transition-all"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            </>
          )}
        </AdminPageHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="TOTAL" value={stats.total} icon={Factory} isActive={statusFilter === "todos"} color="pink" onClick={() => { setStatusFilter("todos"); setCurrentPage(0); }} />
          <StatCard title="ACTIVOS" value={stats.activos} icon={CheckCircle} isActive={statusFilter === "activo"} color="emerald" onClick={() => { setStatusFilter("activo"); setCurrentPage(0); }} />
          <StatCard title="INACTIVOS" value={stats.inactivos} icon={XCircle} isActive={statusFilter === "inactivo"} color="slate" onClick={() => { setStatusFilter("inactivo"); setCurrentPage(0); }} />
          <StatCard title="SUSPENDIDOS" value={stats.suspendidos} icon={AlertTriangle} isActive={statusFilter === "suspendido"} color="amber" onClick={() => { setStatusFilter("suspendido"); setCurrentPage(0); }} />
        </div>

        <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por nombre, RUC o contacto..."
              className="pl-10 h-11 border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>
          <Button variant="outline" className="h-11 w-11 p-0 border-gray-100" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading && "animate-spin"}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <TallerSkeleton />
            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
              Cargando directorio de talleres...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <TalleresTable
              data={paginatedData}
              canEdit={can('edit', 'talleres')}
              canDelete={can('archive', 'talleres')}
              onView={(t) => openDialog("view", t)}
              onEdit={(t) => openDialog("edit", t)}
              onDelete={(t) => openDialog("delete", t)}
            />

            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
              <span className="text-xs font-bold text-gray-400">
                PÁGINA {currentPage + 1} DE {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 0} className="hover:bg-pink-50">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage + 1 >= totalPages} className="hover:bg-pink-50">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(dialogMode === "create" || dialogMode === "edit") && (
        <TallerFormModal
          taller={dialogMode === "edit" ? selectedTaller : null}
          onClose={closeDialog}
          onSave={handleSave}
          isSaving={isCreating || isUpdating}
        />
      )}

      {dialogMode === "view" && selectedTaller && (
        <TallerDetailModal
          taller={selectedTaller}
          onClose={closeDialog}
          canEditTarifas={can('edit', 'talleres')}
        />
      )}

      {dialogMode === "delete" && selectedTaller && (
        <TallerSuspendModal
          taller={selectedTaller}
          onClose={closeDialog}
          onConfirm={(id) => suspend(id).then((res) => ({
            success: res?.success === true,
            error: res?.error,
          }))}
          isSuspending={isSuspending}
        />
      )}
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <div className="bg-amber-50 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-amber-600" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Acceso Denegado</h2>
      <p className="text-gray-500 max-w-sm mt-2 font-medium">
        Tu rol actual no tiene permisos para gestionar talleres externos.
      </p>
    </div>
  );
}

function LoadingTalleres() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-gray-50">
      <div className="h-16 w-16 rounded-full border-4 border-pink-100 border-t-pink-600 animate-spin" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando talleres...</p>
    </div>
  );
}
