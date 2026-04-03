"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, Plus, Search, Factory, RefreshCw, 
  AlertTriangle, CheckCircle, XCircle, BarChart3, ChevronLeft, ChevronRight, 
  FileText, ShieldAlert
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";

// Lazy loading de componentes
const TalleresTable = dynamic(() => import("@/components/admin/talleres/TalleresTable"));
const CreateTallerDialog = dynamic(() => import("@/components/admin/talleres/CreateTallerDialog"));
const EditTallerDialog = dynamic(() => import("@/components/admin/talleres/EditTallerDialog"));
const DeleteTallerDialog = dynamic(() => import("@/components/admin/talleres/DeleteTallerDialog"));

export default function TalleresPage() {
  const { can, isLoading: authLoading, personal } = usePermissions();
  const [talleres, setTalleres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaller, setSelectedTaller] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"todos" | "activo" | "inactivo" | "suspendido">("todos");
  
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, suspendidos: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/talleres');
      const data = response.ok ? await response.json() : [];
      
      setTalleres(Array.isArray(data) ? data : []);

    } catch (err: any) {
      console.error("Error loading talleres:", err);
      toast.error("Error de sincronización");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && can('view', 'talleres')) {
      loadData();
    }
  }, [authLoading, can, loadData]);

  useEffect(() => { 
    if (talleres.length > 0) {
      setStats({
        total: talleres.length,
        activos: talleres.filter((t: any) => t.estado?.toLowerCase() === 'activo').length,
        inactivos: talleres.filter((t: any) => t.estado?.toLowerCase() === 'inactivo').length,
        suspendidos: talleres.filter((t: any) => t.estado?.toLowerCase() === 'suspendido').length
      });
    }
  }, [talleres]);

  const handleEdit = useCallback((t: any) => { setSelectedTaller(t); setDialogMode("edit"); }, []);
  const handleDelete = useCallback((t: any) => { setSelectedTaller(t); setDialogMode("delete"); }, []);

  const handleExportExcel = () => {
    if (filteredTalleres.length === 0) return toast.error("No hay datos para exportar");
    const dataToExport = filteredTalleres.map(t => ({
      "RUC": t.ruc,
      "Nombre": t.nombre,
      "Contacto": t.contacto,
      "Teléfono": t.telefono,
      "Email": t.email || "N/A",
      "Especialidad": t.especialidad || "General",
      "Dirección": t.direccion,
      "Estado": t.estado?.toUpperCase()
    }));
    exportToExcel(dataToExport, { filename: `Talleres_GUOR_${new Date().toISOString().split('T')[0]}` });
    toast.success("Excel generado correctamente");
  };

  const handleExportPDF = () => {
    if (filteredTalleres.length === 0) return toast.error("No hay datos para exportar");
    const pdfData = filteredTalleres.map(t => ({
      ...t,
      estado_display: t.estado?.toUpperCase()
    }));
    exportToPDF(pdfData, [], { 
      title: "DIRECTORIO DE TALLERES - Modas y Estilos GUOR", 
      filename: `Talleres_GUOR_${new Date().toISOString().split('T')[0]}`
    });
    toast.success("PDF generado correctamente"); 
  };

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
    return filteredTalleres.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [filteredTalleres, currentPage]);

  if (authLoading) return <LoadingTalleres />;
  if (!can('view', 'talleres')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Talleres
            </h1>
            <p className="text-gray-500 text-sm">Directorio y control de talleres asociados GUOR</p>
          </div>
          
          <div className="flex items-center gap-3">
            {can('export', 'talleres') && (
              <>
                <Button onClick={handleExportPDF} variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50 font-bold gap-2 h-11 transition-all">
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </Button>
                <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 transition-all">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </Button>
              </>
            )}

            {can('create', 'talleres') && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg font-bold gap-2 h-11 px-6 transition-all">
                <Plus className="w-5 h-5" /> Nuevo Taller
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="TOTAL TALLERES" 
            value={stats.total} 
            icon={<Factory className="w-6 h-6" />} 
            isActive={statusFilter === "todos"} 
            color="pink" 
            onClick={() => {setStatusFilter("todos"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="ACTIVOS" 
            value={stats.activos} 
            icon={<CheckCircle className="w-6 h-6" />} 
            isActive={statusFilter === "activo"} 
            color="green" 
            onClick={() => {setStatusFilter("activo"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="INACTIVOS" 
            value={stats.inactivos} 
            icon={<XCircle className="w-6 h-6" />} 
            isActive={statusFilter === "inactivo"} 
            color="gray" 
            onClick={() => {setStatusFilter("inactivo"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="SUSPENDIDOS" 
            value={stats.suspendidos} 
            icon={<AlertTriangle className="w-6 h-6" />} 
            isActive={statusFilter === "suspendido"} 
            color="red" 
            onClick={() => {setStatusFilter("suspendido"); setCurrentPage(0);}} 
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre, RUC o contacto..."
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
            />
          </div>

          <Button variant="outline" className="h-11 border-gray-200" onClick={loadData}>
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          </Button>
        </div>

        {/* Tabla y Paginación */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase">Sincronizando...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <TalleresTable 
              data={paginatedData}
              canEdit={can('edit', 'talleres')}
              canDelete={can('delete', 'talleres')}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de <span className="font-bold text-gray-900">{filteredTalleres.length}</span>
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
      {isCreateOpen && (
        <CreateTallerDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadData} />
      )}

      {selectedTaller && (
        <>
          {dialogMode === "edit" && (
            <EditTallerDialog isOpen={true} taller={selectedTaller} onClose={() => {setDialogMode(null); setSelectedTaller(null);}} onSuccess={loadData} />
          )}
          {dialogMode === "delete" && (
            <DeleteTallerDialog isOpen={true} taller={selectedTaller} onClose={() => {setDialogMode(null); setSelectedTaller(null);}} onSuccess={loadData} />
          )}
        </>
      )}
    </div>
  );
}

// Sub-componentes
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
    pink: { active: "border-pink-500 ring-pink-50 bg-white", iconActive: "bg-pink-600 text-white", textActive: "text-pink-600" },
    green: { active: "border-green-500 ring-green-50 bg-white", iconActive: "bg-green-600 text-white", textActive: "text-green-600" },
    gray: { active: "border-gray-500 ring-gray-50 bg-white", iconActive: "bg-gray-600 text-white", textActive: "text-gray-600" },
    red: { active: "border-red-500 ring-red-50 bg-white", iconActive: "bg-red-600 text-white", textActive: "text-red-600" }
  };
  const currentStyle = styles[color];
  return (
    <button onClick={onClick} className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${isActive ? `ring-4 shadow-xl scale-[1.02] z-10 ${currentStyle.active}` : 'bg-white border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95'}`}>
      <div className={`p-3 rounded-lg transition-all duration-300 ${isActive ? `${currentStyle.iconActive} rotate-3` : 'bg-gray-100 text-gray-600 group-hover:rotate-3'}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${isActive ? currentStyle.textActive : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}
