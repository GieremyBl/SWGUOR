"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet, Plus, Search, Layers, RefreshCw,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, FileText
} from "lucide-react";
import { exportToExcel, exportCategoriasToPDF } from "@/lib/utils/export-utils";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Categoria } from "@/types/categoria";
import CategoriaFormModal from "@/components/admin/categorias/CategoriaFormModal";
import { CategoriaArchiveModal } from "@/components/admin/categorias/CategoriaModals";

const CategoriasTable = dynamic(() => import("@/components/admin/categorias/CategoriasTable"));

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface CategoriaForm {
  nombre: string;
  descripcion: string;
  activo: boolean;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriasPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [stats, setStats] = useState({ total: 0, activas: 0, inactivas: 0 });

  const [formModal, setFormModal] = useState<{ open: boolean; categoria: Categoria | null }>({ open: false, categoria: null });
  const [archiveModal, setArchiveModal] = useState<{ open: boolean; categoria: Categoria | null }>({ open: false, categoria: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  
  // Estados de carga para las exportaciones (Sincronizado con órdenes de compra)
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  const pageSize = 10;

  const canView = can('view', 'categorias');
  const canCreate = can('create', 'categorias');
  const canEdit = can('edit', 'categorias');
  const canDelete = can('archive', 'categorias');
  const canExport = can('export', 'categorias');

  // ── Carga ───────────────────────────────────────────────────────────────────

  const loadCategorias = useCallback(async () => {
    if (!canView) {
      toast.error("No tienes permisos para ver categorías");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categorias');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const results: Categoria[] = (data ?? []).map((c: any) => ({
        ...c,
        id: Number(c.id), // normaliza bigint serializado como string/number
      }));

      setCategorias(results);
      setStats({
        total: results.length,
        activas: results.filter(c => c.activo).length,
        inactivas: results.filter(c => !c.activo).length,
      });
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar categorías");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    if (!authLoading) loadCategorias();
  }, [loadCategorias, authLoading]);

  // ── Filtrado y paginación ───────────────────────────────────────────────────

  const filteredCategorias = useMemo(() => {
    return categorias.filter(c => {
      const matchSearch =
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchStatus = statusFilter === null || c.activo === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [categorias, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCategorias.length / pageSize);
  const paginatedData = filteredCategorias.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // ── Handlers de modales ─────────────────────────────────────────────────────

  const handleCreateClick = () => {
    if (!canCreate) return toast.error("No tienes permisos para crear categorías");
    setFormModal({ open: true, categoria: null });
  };

  const handleEdit = (c: Categoria) => {
    if (!canEdit) return toast.error("No tienes permisos para editar categorías");
    setFormModal({ open: true, categoria: c });
  };

  const handleDelete = (c: Categoria) => {
    if (!canDelete) return toast.error("No tienes permisos para archivar categorías");
    setArchiveModal({ open: true, categoria: c });
  };

  const closeFormModal = () => setFormModal({ open: false, categoria: null });
  const closeArchiveModal = () => setArchiveModal({ open: false, categoria: null });

  // ── Guardar ─────────────────────────────────────────────────────────────────

  const handleSave = async (data: CategoriaForm) => {
    setIsSaving(true);
    const isEdit = !!formModal.categoria;
    const url = isEdit ? `/api/admin/categorias/${formModal.categoria!.id}` : '/api/admin/categorias';
    const method = isEdit ? 'PATCH' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      toast.success(isEdit ? "Categoría actualizada correctamente" : "Categoría creada correctamente");
      closeFormModal();
      await loadCategorias();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la categoría");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Archivar ────────────────────────────────────────────────────────────────

  const handleConfirmArchive = async () => {
    if (!archiveModal.categoria) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/admin/categorias/${archiveModal.categoria.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: false }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al descontinuar');
      }
      toast.success(`"${archiveModal.categoria.nombre}" ha sido descontinuada`);
      closeArchiveModal();
      await loadCategorias();
    } catch (err: any) {
      toast.error(err.message || "Error al descontinuar la categoría");
    } finally {
      setIsArchiving(false);
    }
  };

  // ── Exportaciones ───────────────────────────────────────────────────────────

  const handleExportExcel = async () => {
    if (!canExport) return toast.error("No tienes permisos para exportar");
    if (filteredCategorias.length === 0) return toast.error("No hay datos para exportar");
    
    try {
      setExportingExcel(true);
      exportToExcel(
        filteredCategorias.map(c => ({
          Categoría: c.nombre,
          Descripción: c.descripcion || "Sin descripción",
          Estado: c.activo ? "Activa" : "Inactiva",
          "Fecha Creación": c.created_at ? new Date(c.created_at).toLocaleDateString() : '-',
        })),
        { filename: `Categorias_ModasGUOR_${new Date().toISOString().split('T')[0]}` }
      );
      toast.success("Excel generado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar a Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canExport) return toast.error("No tienes permisos para exportar");
    if (filteredCategorias.length === 0) return toast.error("No hay datos para exportar");

    const toastId = toast.loading("Preparando reporte PDF...");
    try {
      setExportingPDF(true);
      await exportCategoriasToPDF(filteredCategorias, {
        title: "REPORTE DE CATEGORÍAS",
        filename: `Categorias_GUOR_${new Date().toISOString().split('T')[0]}`,
      });
      toast.success("PDF generado correctamente", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el PDF", { id: toastId });
    } finally {
      setExportingPDF(false);
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Verificando permisos...</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500">No tienes permisos para ver esta sección</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header con los botones integrados arriba a la derecha */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Directorio de Categorías</h1>
            <p className="text-gray-500 text-sm">Gestión de líneas de productos de Modas y Estilos GUOR</p>
          </div>
          <div className="flex items-center gap-3">
            {canExport && (
              <>
                {/* BOTÓN EXPORTAR EXCEL CON EL ESTILO DE ÓRDENES DE COMPRA */}
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={exportingExcel || loading}
                  className="h-11 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                  {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
                </Button>

                {/* BOTÓN EXPORTAR PDF CON EL ESTILO DE ÓRDENES DE COMPRA */}
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={exportingPDF || loading}
                  className="h-11 rounded-xl border-red-200 hover:bg-red-50 hover:text-red-700 text-gray-600 font-medium transition-all"
                >
                  <FileText className="w-4 h-4 mr-2 text-red-600" />
                  {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
                </Button>
              </>
            )}
            {canCreate && (
              <Button onClick={handleCreateClick} className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 px-6 text-white transition-all active:scale-95 rounded-xl">
                <Plus className="w-5 h-5" /> Nueva Categoría
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="TOTAL GENERAL" value={stats.total} icon={<Layers className="w-6 h-6" />} isActive={statusFilter === null} color="pink" onClick={() => { setStatusFilter(null); setCurrentPage(0); }} />
          <StatCard title="ACTIVAS" value={stats.activas} icon={<CheckCircle2 className="w-6 h-6" />} isActive={statusFilter === true} color="emerald" onClick={() => { setStatusFilter(true); setCurrentPage(0); }} />
          <StatCard title="INACTIVAS" value={stats.inactivas} icon={<XCircle className="w-6 h-6" />} isActive={statusFilter === false} color="orange" onClick={() => { setStatusFilter(false); setCurrentPage(0); }} />
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o descripción de categoría..."
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>
          <Button variant="outline" className="h-11 border-gray-200" onClick={loadCategorias}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sincronizando categorías...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <CategoriasTable
              data={paginatedData}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de{' '}
                <span className="font-bold text-gray-900">{filteredCategorias.length}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border rounded-lg flex items-center">
                  Página {currentPage + 1} de {totalPages || 1}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {formModal.open && (
        <CategoriaFormModal
          categoria={formModal.categoria}
          isSaving={isSaving}
          onClose={closeFormModal}
          onSave={handleSave}
        />
      )}
      {archiveModal.open && (
        <CategoriaArchiveModal
          categoria={archiveModal.categoria}
          isArchiving={isArchiving}
          onClose={closeArchiveModal}
          onConfirm={handleConfirmArchive}
        />
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, isActive, color, onClick }: {
  title: string; value: number; icon: React.ReactNode;
  isActive: boolean; color: 'pink' | 'emerald' | 'orange'; onClick: () => void;
}) {
  const styles = {
    pink: { active: "border-pink-500 ring-pink-50 bg-white", iconActive: "bg-pink-600 text-white", textActive: "text-pink-600" },
    emerald: { active: "border-emerald-500 ring-emerald-50 bg-white", iconActive: "bg-emerald-600 text-white", textActive: "text-emerald-600" },
    orange: { active: "border-orange-500 ring-orange-50 bg-white", iconActive: "bg-orange-600 text-white", textActive: "text-orange-600" },
  };
  const s = styles[color];

  return (
    <button
      onClick={onClick}
      className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${isActive
        ? `ring-4 shadow-xl scale-[1.02] z-10 ${s.active}`
        : 'bg-white border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95'
        }`}
    >
      <div className={`p-3 rounded-lg transition-all duration-300 ${isActive ? `${s.iconActive} rotate-3` : 'bg-gray-100 text-gray-600 group-hover:rotate-3'}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${isActive ? s.textActive : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}