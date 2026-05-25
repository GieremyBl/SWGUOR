"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
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
import { getSupabaseBrowserClient } from "@/lib/supabase";

const TalleresTable      = dynamic(() => import("@/components/admin/talleres/TalleresTable"));
import TallerFormModal from "@/components/admin/talleres/TallerFormModal";
import { TallerDetailModal, TallerSuspendModal } from "@/components/admin/talleres/TallerModals";
const TallerSkeleton     = dynamic(() => import("@/components/admin/talleres/TallerSkeleton"));

type DialogMode = "create" | "edit" | "view" | "delete" | null;

export default function TalleresPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const supabase = getSupabaseBrowserClient();
  
  const [talleres, setTalleres]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState("");
  const [selectedTaller, setSelectedTaller] = useState<any | null>(null);
  const [dialogMode, setDialogMode]     = useState<DialogMode>(null);
  const [currentPage, setCurrentPage]   = useState(0);
  const [statusFilter, setStatusFilter] = useState<"todos" | "activo" | "inactivo" | "suspendido">("todos");
  
  // Estados de carga para las exportaciones (Sincronizado con órdenes de compra)
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("talleres")
        .select("*")
        .order("nombre", { ascending: false });

      if (error) throw error;
      setTalleres(data || []);
    } catch (err: any) {
      console.error("Error loading talleres:", err);
      toast.error("Error al sincronizar con la base de datos");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && can('view', 'talleres')) loadData();
  }, [authLoading, can, loadData]);

  const stats = useMemo(() => ({
    total:      talleres.length,
    activos:    talleres.filter(t => t.estado?.toLowerCase() === 'activo').length,
    inactivos:  talleres.filter(t => t.estado?.toLowerCase() === 'inactivo').length,
    suspendidos: talleres.filter(t => t.estado?.toLowerCase() === 'suspendido').length,
  }), [talleres]);

  // Handlers unificados
  const openDialog = useCallback((mode: DialogMode, taller?: any) => {
    setSelectedTaller(taller ?? null);
    setDialogMode(mode);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogMode(null);
    setSelectedTaller(null);
  }, []);

  const filteredTalleres = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return talleres.filter((t: any) => {
      const matchSearch = !search ||
        t.nombre.toLowerCase().includes(search) ||
        t.ruc.includes(search) ||
        t.contacto.toLowerCase().includes(search);
      const matchStatus = statusFilter === "todos" || t.estado?.toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [talleres, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredTalleres.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredTalleres.slice(start, start + pageSize);
  }, [filteredTalleres, currentPage]);

  // ── LÓGICA DE EXPORTACIÓN EXCEL Y PDF ────────────────────────────────────────
  const handleExportExcel = async () => {
    if (filteredTalleres.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    try {
      setExportingExcel(true);
      await exportToExcel(filteredTalleres, { filename: "Talleres" });
      toast.success("Excel descargado correctamente");
    } catch (error) {
      console.error(error);
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
      await exportToPDF(filteredTalleres, [], { title: "Reporte de Talleres", filename: "Talleres_GUOR" });
      toast.success("PDF generado correctamente", { id: toastId });
    } catch (error) {
      console.error(error);
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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">
              Gestión de Talleres
            </h1>
            <p className="text-gray-500 text-sm font-medium">Control centralizado de maquila y servicios externos</p>
          </div>

          <div className="flex items-center gap-3">
            {can('export', 'talleres') && (
              <>
                {/* BOTÓN EXPORTAR EXCEL CON TU DISEÑO UNIFICADO */}
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={exportingExcel || loading}
                  className="h-11 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                  {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
                </Button>

                {/* BOTÓN EXPORTAR PDF CON TU DISEÑO UNIFICADO */}
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

            {can('create', 'talleres') && (
              <Button
                onClick={() => openDialog("create")}
                className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg font-bold gap-2 h-11 px-6 rounded-xl"
              >
                <Plus className="w-5 h-5" /> Nuevo Taller
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="TOTAL"       value={stats.total}       icon={<Factory />}       isActive={statusFilter === "todos"}      color="pink"  onClick={() => { setStatusFilter("todos"); setCurrentPage(0); }} />
          <StatCard title="ACTIVOS"     value={stats.activos}     icon={<CheckCircle />}   isActive={statusFilter === "activo"}     color="green" onClick={() => { setStatusFilter("activo"); setCurrentPage(0); }} />
          <StatCard title="INACTIVOS"   value={stats.inactivos}   icon={<XCircle />}       isActive={statusFilter === "inactivo"}   color="gray"  onClick={() => { setStatusFilter("inactivo"); setCurrentPage(0); }} />
          <StatCard title="SUSPENDIDOS" value={stats.suspendidos} icon={<AlertTriangle />} isActive={statusFilter === "suspendido"} color="red"   onClick={() => { setStatusFilter("suspendido"); setCurrentPage(0); }} />
        </div>

        {/* Búsqueda */}
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
          <Button variant="outline" className="h-11 w-11 p-0 border-gray-100" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading && "animate-spin"}`} />
          </Button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="space-y-4">
            <TallerSkeleton />
            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
              Sincronizando directorio GUOR...
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

            {/* Paginación */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
              <span className="text-xs font-bold text-gray-400">
                PÁGINA {currentPage + 1} DE {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="hover:bg-pink-50">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages} className="hover:bg-pink-50">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      {(dialogMode === "create" || dialogMode === "edit") && (
        <TallerFormModal
          taller={dialogMode === "edit" ? selectedTaller : null}
          onClose={closeDialog}
          onSuccess={loadData}
        />
      )}

      {dialogMode === "view" && selectedTaller && (
        <TallerDetailModal
          taller={selectedTaller}
          onClose={closeDialog}
        />
      )}

      {dialogMode === "delete" && selectedTaller && (
        <TallerSuspendModal
          taller={selectedTaller}
          onClose={closeDialog}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────

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

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    pink:  { active: "border-pink-500 ring-pink-50 bg-white",  iconActive: "bg-pink-600 text-white",  textActive: "text-pink-600"  },
    green: { active: "border-green-500 ring-green-50 bg-white", iconActive: "bg-green-600 text-white", textActive: "text-green-600" },
    gray:  { active: "border-gray-500 ring-gray-50 bg-white",  iconActive: "bg-gray-600 text-white",  textActive: "text-gray-600"  },
    red:   { active: "border-red-500 ring-red-50 bg-white",    iconActive: "bg-red-600 text-white",   textActive: "text-red-600"   },
  };
  const s = styles[color];
  return (
    <button onClick={onClick} className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${isActive ? `ring-4 shadow-xl scale-[1.02] z-10 ${s.active}` : "bg-white border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95"}`}>
      <div className={`p-3 rounded-lg transition-all duration-300 ${isActive ? `${s.iconActive} rotate-3` : "bg-gray-100 text-gray-600 group-hover:rotate-3"}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${isActive ? s.textActive : "text-gray-800"}`}>{value}</p>
      </div>
    </button>
  );
}