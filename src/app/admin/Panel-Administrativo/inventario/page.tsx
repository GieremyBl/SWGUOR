"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, Plus, Search,
  AlertTriangle, XCircle, BarChart3, ChevronLeft, ChevronRight, 
  FileText, Factory, Layers,
  RefreshCcw,
  Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";
import InventarioTable from "@/components/admin/inventario/InventarioTable";

// Lazy loading de componentes de Modales
const CreateInsumoDialog = dynamic(() => import("@/components/admin/inventario/CreateInsumoDialog"));
const EditInsumoDialog = dynamic(() => import("@/components/admin/inventario/EditInsumoDialog"));
const DeleteInsumoDialog = dynamic(() => import("@/components/admin/inventario/DeleteInsumoDialog"));

export default function InventarioPage() {
  const [inventario, setInventario] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [quickFilter, setQuickFilter] = useState<"todos" | "bajo_stock" | "critico">("todos");
  const [selectedTipo, setSelectedTipo] = useState<string>("todos");
  
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, bajoStock: 0, sinStock: 0, categorias: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventario');
      if (!res.ok) throw new Error("Error al conectar con el servidor");
      const data = await res.json();
      
      setInventario(data);
      setStats({
        total: data.length,
        bajoStock: data.filter((i: any) => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo).length,
        sinStock: data.filter((i: any) => i.stock_actual === 0).length,
        categorias: new Set(data.map((i: any) => i.tipo)).size
      });
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredData = useMemo(() => {
    return inventario.filter((i: any) => {
      const matchSearch = !searchTerm || i.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = selectedTipo === "todos" || i.tipo === selectedTipo;
      
      let matchQuick = true;
      if (quickFilter === "bajo_stock") matchQuick = i.stock_actual > 0 && i.stock_actual <= i.stock_minimo;
      if (quickFilter === "critico") matchQuick = i.stock_actual === 0;
      
      return matchSearch && matchTipo && matchQuick;
    });
  }, [inventario, searchTerm, quickFilter, selectedTipo]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleExportPDF = () => {
    const headers = [["INSUMO", "TIPO", "STOCK", "U.M.", "ESTADO"]];
    const body = filteredData.map((i: any) => [
      i.nombre.toUpperCase(),
      i.tipo,
      i.stock_actual.toString(),
      i.unidad_medida,
      i.stock_actual === 0 ? "AGOTADO" : i.stock_actual <= i.stock_minimo ? "BAJO" : "OPTIMO"
    ]);

    exportToPDF(headers, body, { 
      title: "KARDEX DE INVENTARIO - MODAS GUOR",
      filename: `Inventario_Textil_${new Date().toISOString().split('T')[0]}` 
    });
  };

const handleExportExcel = () => {
    const dataToExport = filteredData.map((i: any) => ({
      Insumo: i.nombre.toUpperCase(),
      Tipo: i.tipo,
      "Stock Actual": i.stock_actual,
      "Unidad Medida": i.unidad_medida,
      "Stock Mínimo": i.stock_minimo,
      Estado: i.stock_actual === 0 
        ? "AGOTADO" 
        : i.stock_actual <= i.stock_minimo 
          ? "STOCK BAJO" 
          : "OK",
      "Última Actualización": new Date(i.updated_at).toLocaleDateString()
    }));

    exportToExcel(dataToExport, { 
      filename: `Inventario_Textil_GUOR_${new Date().toISOString().split('T')[0]}` 
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header con acciones principales */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Factory className="text-pink-600 w-8 h-8" /> 
              GESTIÓN DE INVENTARIO
            </h1>
            <p className="text-gray-500 text-sm font-medium">Control de insumos, telas y avíos de producción</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50 cursor-pointer font-bold gap-2 h-11">
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer font-bold gap-2 h-11">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold cursor-pointer gap-2 h-11">
              <Plus className="w-5 h-5" /> Nuevo Insumo
            </Button>
          </div>
        </div>

        {/* Dashboard de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="TOTAL INSUMOS" value={stats.total} icon={<Layers className="w-6 h-6" />} isActive={quickFilter === "todos"} onClick={() => {setQuickFilter("todos"); setCurrentPage(0);}} color="blue" />
          <StatCard title="STOCK BAJO" value={stats.bajoStock} icon={<AlertTriangle className="w-6 h-6" />} isActive={quickFilter === "bajo_stock"} onClick={() => {setQuickFilter("bajo_stock"); setCurrentPage(0);}} color="orange" />
          <StatCard title="AGOTADOS" value={stats.sinStock} icon={<XCircle className="w-6 h-6" />} isActive={quickFilter === "critico"} onClick={() => {setQuickFilter("critico"); setCurrentPage(0);}} color="red" />
          <StatCard title="TIPOS" value={stats.categorias} icon={<BarChart3 className="w-6 h-6" />} isActive={false} color="purple" onClick={() => {}} />
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        
        {/* Buscador: Ahora crece para ocupar el espacio disponible (flex-1) */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-pink-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre o material..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-50 transition-all outline-none text-sm font-medium text-gray-600"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro de Tipos: Ahora tiene un ancho fijo y quitamos la negrita (font-normal) */}
        <div className="w-48"> 
          <Select 
            value={selectedTipo} 
            onValueChange={(value) => {
            setSelectedTipo(value);
            setCurrentPage(0); // Reinicia la página al filtrar
            }}
          >
            <SelectTrigger className="w-full h-10.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-pink-300 transition-all font-normal text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <SelectValue placeholder="Todos los tipos" />
                </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                <SelectItem value="todos" className="cursor-pointer font-normal text-sm">Todos los tipos</SelectItem>
                <SelectItem value="Materia Prima" className="cursor-pointer font-normal text-sm">Materia Prima</SelectItem>
                <SelectItem value="Insumo" className="cursor-pointer font-normal text-sm">Insumos</SelectItem>
                <SelectItem value="Herramienta" className="cursor-pointer font-normal text-sm">Herramientas</SelectItem>
            </SelectContent>
            </Select>
        </div>

        {/* Botón de Refrescar: Pequeño y redondo */}
        <button 
            onClick={loadData}
            className="p-3 bg-gray-50 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all cursor-pointer active:scale-95 border-none"
            title="Recargar datos"
        >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        </div>

        {/* Tabla principal */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <InventarioTable 
            data={paginatedData} 
            loading={loading} 
            onEdit={(item: any) => { setSelectedInsumo(item); setDialogMode("edit"); }}
            onDelete={(item: any) => { setSelectedInsumo(item); setDialogMode("delete"); }}
          />
          
          {/* Paginación */}
          <div className="flex items-center justify-between p-4 border-t border-gray-50 bg-gray-50/30">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Mostrando {paginatedData.length} de {filteredData.length} unidades
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-1.5 text-[10px] font-black bg-white border rounded-lg flex items-center uppercase">
                Página {currentPage + 1} / {totalPages || 1}
              </div>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Renderizado Condicional de Modales */}
      <CreateInsumoDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={loadData} 
      />
      
      {selectedInsumo && dialogMode === "edit" && (
        <EditInsumoDialog 
          isOpen={true} 
          insumo={selectedInsumo} 
          onClose={() => {setDialogMode(null); setSelectedInsumo(null);}} 
          onSuccess={loadData} 
        />
      )}

      {selectedInsumo && dialogMode === "delete" && (
        <DeleteInsumoDialog 
          isOpen={true} 
          insumo={selectedInsumo} 
          onClose={() => {setDialogMode(null); setSelectedInsumo(null);}} 
          onSuccess={loadData} 
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    blue: { active: "border-blue-500 ring-blue-50 bg-white", iconActive: "bg-blue-600 text-white", textActive: "text-blue-600" },
    orange: { active: "border-orange-500 ring-orange-50 bg-white", iconActive: "bg-orange-600 text-white", textActive: "text-orange-600" },
    red: { active: "border-red-500 ring-red-50 bg-white", iconActive: "bg-red-600 text-white", textActive: "text-red-600" },
    purple: { active: "border-purple-500 ring-purple-50 bg-white", iconActive: "bg-purple-600 text-white", textActive: "text-purple-600" }
  };
  const currentStyle = styles[color] || styles.blue;

  return (
    <button 
      onClick={onClick} 
      type="button" 
      className={`group p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 text-left cursor-pointer ${
        isActive 
        ? `ring-4 shadow-xl scale-[1.02] z-10 ${currentStyle.active}` 
        : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-pink-200 hover:-translate-y-1 active:scale-95'
      }`}
    >
      <div className={`p-3 rounded-xl transition-all ${isActive ? currentStyle.iconActive : 'bg-gray-50 text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-600'}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${isActive ? currentStyle.textActive : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}