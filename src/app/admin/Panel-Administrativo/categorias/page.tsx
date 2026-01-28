"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, Plus, Search, Layers, RefreshCw, 
  CheckCircle2, XCircle, ChevronLeft, ChevronRight 
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/utils/export-utils";

// Lazy loading de componentes
const CategoriasTable = dynamic(() => import("@/components/admin/categorias/CategoriasTable"));
const CreateCategoriaDialog = dynamic(() => import("@/components/admin/categorias/CreateCategoriaDialog"));
const EditCategoriaDialog = dynamic(() => import("@/components/admin/categorias/EditCategoriaDialog"));
const DeleteCategoriaDialog = dynamic(() => import("@/components/admin/categorias/DeleteCategoriaDialog"));

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, activas: 0, inactivas: 0 });

  // CARGA DE DATOS DESDE LA API
  const loadCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categorias');
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      const results = data || [];
      setCategorias(results);
      
      setStats({
        total: results.length,
        activas: results.filter((c: any) => c.activo).length,
        inactivas: results.filter((c: any) => !c.activo).length
      });
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategorias(); }, [loadCategorias]);

  const filteredCategorias = useMemo(() => {
    return categorias.filter((c: any) => {
      const matchSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.descripcion && c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === null || c.activo === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [categorias, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCategorias.length / pageSize);
  const paginatedData = filteredCategorias.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleExportExcel = () => {
    if (filteredCategorias.length === 0) return toast.error("No hay datos para exportar");
    const dataToExport = filteredCategorias.map((c: any) => ({
      Categoría: c.nombre,
      Descripción: c.descripcion || "Sin descripción",
      Estado: c.activo ? "Activa" : "Inactiva",
      "Fecha Creación": new Date(c.created_at).toLocaleDateString()
    }));
    exportToExcel(dataToExport, { filename: `Categorias_ModasGUOR_${new Date().toISOString().split('T')[0]}` });
    toast.success("Excel generado correctamente");
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="text-pink-600" /> Directorio de Categorías
            </h1>
            <p className="text-gray-500 text-sm">Gestión de líneas de productos de Modas y Estilos GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 transition-all active:scale-95">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 px-6 text-white transition-all active:scale-95">
              <Plus className="w-5 h-5" /> Nueva Categoría
            </Button>
          </div>
        </div>

        {/* Stats (Filtros rápidos) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="TOTAL GENERAL" 
            value={stats.total} 
            icon={<Layers className="w-6 h-6" />} 
            isActive={statusFilter === null} 
            color="pink" 
            onClick={() => {setStatusFilter(null); setCurrentPage(0);}} 
          />
          <StatCard 
            title="ACTIVAS" 
            value={stats.activas} 
            icon={<CheckCircle2 className="w-6 h-6" />} 
            isActive={statusFilter === true} 
            color="emerald" 
            onClick={() => {setStatusFilter(true); setCurrentPage(0);}} 
          />
          <StatCard 
            title="INACTIVAS" 
            value={stats.inactivas} 
            icon={<XCircle className="w-6 h-6" />} 
            isActive={statusFilter === false} 
            color="orange" 
            onClick={() => {setStatusFilter(false); setCurrentPage(0);}} 
          />
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por nombre o descripción de categoría..." 
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
            />
          </div>
          <Button variant="outline" className="h-11 border-gray-200" onClick={loadCategorias}>
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
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
              onEdit={(c: any) => {setSelectedCategoria(c); setDialogMode("edit");}}
              onDelete={(c: any) => {setSelectedCategoria(c); setDialogMode("delete");}}
            />
            
            {/* Paginación */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de <span className="font-bold text-gray-900">{filteredCategorias.length}</span>
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
      <CreateCategoriaDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadCategorias} />
      {selectedCategoria && dialogMode === "edit" && (
        <EditCategoriaDialog isOpen={true} categoria={selectedCategoria} onClose={() => {setDialogMode(null); setSelectedCategoria(null);}} onSuccess={loadCategorias} />
      )}
      {selectedCategoria && dialogMode === "delete" && (
        <DeleteCategoriaDialog isOpen={true} categoria={selectedCategoria} onClose={() => {setDialogMode(null); setSelectedCategoria(null);}} onSuccess={loadCategorias} />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    pink: {
      active: "border-pink-500 ring-pink-50 bg-white",
      iconActive: "bg-pink-600 text-white",
      textActive: "text-pink-600"
    },
    emerald: {
      active: "border-emerald-500 ring-emerald-50 bg-white",
      iconActive: "bg-emerald-600 text-white",
      textActive: "text-emerald-600"
    },
    orange: {
      active: "border-orange-500 ring-orange-50 bg-white",
      iconActive: "bg-orange-600 text-white",
      textActive: "text-orange-600"
    }
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