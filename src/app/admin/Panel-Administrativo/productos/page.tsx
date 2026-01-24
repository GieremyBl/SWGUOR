"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, Plus, Search, Package, RefreshCw, 
  AlertTriangle, XCircle, BarChart3, ChevronLeft, ChevronRight, 
  FileText, ShieldAlert
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";
import FichaTecnicaDialog from "@/components/admin/productos/FichaTecnicaDialog";

// Lazy loading de componentes de diálogo
const ProductosTable = dynamic(() => import("@/components/admin/productos/ProductosTable"));
const CreateProductoDialog = dynamic(() => import("@/components/admin/productos/CreateProductoDialog"));
const EditProductoDialog = dynamic(() => import("@/components/admin/productos/EditProductoDialog"));
const DeleteProductoDialog = dynamic(() => import("@/components/admin/productos/DeleteProductoDialog"));
const StockDialog = dynamic(() => import("@/components/admin/productos/StockDialog"));

export default function ProductosPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<any | null>(null);

  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | "stock" | "ficha" | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [quickFilter, setQuickFilter] = useState<"todos" | "bajo_stock" | "agotados">("todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todos");
  
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, bajoStock: 0, agotados: 0, lineas: 0 });

  const loadData = useCallback(async () => {
    if (!can || !can('view', 'productos')) return;
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
      fetch('/api/admin/productos').then(res => res.ok ? res.json() : []),
      fetch('/api/admin/categorias').then(res => res.ok ? res.json() : [])
    ]);
      
      setProductos(Array.isArray(prodRes) ? prodRes : []);
      setCategorias(Array.isArray(catRes) ? catRes : []);

      setStats({
        total: prodRes.length,
        bajoStock: prodRes.filter((p: any) => p.stock > 0 && p.stock <= (p.stock_minimo || 5)).length,
        agotados: prodRes.filter((p: any) => p.stock === 0).length,
        lineas: catRes.length
      });
    } catch (err: any) {
      console.error("Error GUOR Sync:", err);
      toast.error("Error de sincronización");
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => { 
  let isMounted = true;

  if (!authLoading && isMounted) {
    loadData(); 
  }

  return () => { isMounted = false; };

}, [authLoading]);

  // Funciones de Exportación restauradas
  const handleExportExcel = () => {
    if (filteredProducts.length === 0) return toast.error("No hay datos para exportar");
    exportToExcel(filteredProducts, { filename: "Inventario_Modas_GUOR" });
    toast.success("Excel generado correctamente");
  };

  const handleExportPDF = () => {
    if (filteredProducts.length === 0) return toast.error("No hay datos para exportar");
    exportToPDF(filteredProducts, categorias, { 
      title: "REPORTE DE INVENTARIO - GUOR" , 
      filename: `Inventario_GUOR_${new Date().toISOString().split('T')[0]}`});
    toast.success("PDF generado correctamente");
  };

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return productos.filter((p: any) => { 
      const matchSearch = !search || p.nombre.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
      const matchCat = selectedCategoria === "todos" || p.categoria_id === Number(selectedCategoria);
      let matchQuick = true;
      if (quickFilter === "bajo_stock") matchQuick = p.stock > 0 && p.stock <= (p.stock_minimo || 5);
      if (quickFilter === "agotados") matchQuick = p.stock === 0;

      return matchSearch && matchCat && matchQuick;
    });
  }, [productos, searchTerm, quickFilter, selectedCategoria]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedData = filteredProducts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (authLoading) return <LoadingInventory />;
  if (!can('view', 'productos')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
              <Package className="text-pink-600 w-8 h-8" /> Inventario
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Modas GUOR • Panel de Control</p>
          </div>
          
          <div className="flex items-center gap-2">
            {can('export', 'productos') && (
              <>
                <Button onClick={handleExportPDF} variant="outline" className="bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 font-black text-[11px] uppercase tracking-widest gap-2 h-11 px-4 rounded-xl transition-all">
                  <FileText className="w-4 h-4" /> PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline" className="bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 font-black text-[11px] uppercase tracking-widest gap-2 h-11 px-4 rounded-xl transition-all">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </Button>
              </>
            )}

            {can('create', 'productos') && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-slate-900 hover:bg-pink-600 text-white shadow-lg font-black text-[11px] uppercase tracking-widest gap-2 h-11 px-6 rounded-xl transition-all">
                <Plus className="w-4 h-4" /> Nuevo Producto
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Productos" value={stats.total} icon={<Package size={20}/>} isActive={quickFilter === "todos"} color="blue" onClick={() => {setQuickFilter("todos"); setCurrentPage(0);}} />
          <StatCard title="Bajo Stock" value={stats.bajoStock} icon={<AlertTriangle size={20}/>} isActive={quickFilter === "bajo_stock"} color="orange" onClick={() => {setQuickFilter("bajo_stock"); setCurrentPage(0);}} />
          <StatCard title="Agotados" value={stats.agotados} icon={<XCircle size={20}/>} isActive={quickFilter === "agotados"} color="red" onClick={() => {setQuickFilter("agotados"); setCurrentPage(0);}} />
          <StatCard title="Categorías" value={stats.lineas} icon={<BarChart3 size={20}/>} isActive={false} color="purple" onClick={() => {}} />
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-pink-500 transition-colors" />
            <input
              type="text"
              placeholder="BUSCAR POR NOMBRE O SKU..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-pink-100 transition-all outline-none text-[11px] font-black uppercase tracking-widest text-slate-600"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
            />
          </div>

          <Select value={selectedCategoria} onValueChange={(v) => {setSelectedCategoria(v); setCurrentPage(0);}}>
            <SelectTrigger className="w-full md:w-64 h-11 bg-slate-50 border-none rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600">
              <SelectValue placeholder="CATEGORÍA" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100">
              <SelectItem value="todos">TODAS LAS CATEGORÍAS</SelectItem>
              {categorias.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.nombre.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button onClick={loadData} className="p-3 bg-slate-50 text-slate-400 hover:text-pink-600 rounded-xl transition-all cursor-pointer">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200">
            <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mb-2" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sincronizando con base de datos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ProductosTable 
              data={paginatedData} 
              categorias={categorias} 
              canEdit={can('edit', 'productos')}
              canDelete={can('delete', 'productos')}
              onEdit={(p: any) => {setSelectedProducto(p); setDialogMode("edit");}}
              onDelete={(p: any) => {setSelectedProducto(p); setDialogMode("delete");}}
              onStock={(p: any) => {setSelectedProducto(p); setDialogMode("stock");}}
              onFicha={(p: any) => {setSelectedProducto(p); setDialogMode("ficha");}}
            />
            
            {/* Paginación */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Página {currentPage + 1} de {totalPages || 1}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages} className="rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales Controlados */}
      {isCreateOpen && (
        <CreateProductoDialog 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          onSuccess={loadData} 
          categorias={categorias} 
        />
      )}

      {selectedProducto && (
        <>
          {dialogMode === "edit" && (
            <EditProductoDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={loadData} categorias={categorias} />
          )}
          {dialogMode === "delete" && (
            <DeleteProductoDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={loadData} />
          )}
          {dialogMode === "stock" && (
            <StockDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={loadData} />
          )}
          {dialogMode === "ficha" && (
            <FichaTecnicaDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={loadData} />
          )}
        </>
      )}
    </div>
  );
}

// Componentes de interfaz (AccessDenied, StatCard, LoadingInventory) se mantienen con el diseño de GUOR...
function AccessDenied() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Acceso Denegado</h2>
      <p className="text-gray-500 max-w-sm mt-2 font-medium">No tienes permisos para gestionar el inventario de la empresa.</p>
    </div>
  );
}

function LoadingInventory() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-gray-50">
      <div className="h-16 w-16 rounded-full border-4 border-pink-100 border-t-pink-600 animate-spin" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Cargando catálogo GUOR...</p>
    </div>
  );
}

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
    const styles: any = {
      blue: { active: "border-blue-500 ring-blue-50 bg-white", iconActive: "bg-blue-600 text-white", textActive: "text-blue-600" },
      pink: { active: "border-pink-500 ring-pink-50 bg-white", iconActive: "bg-pink-600 text-white", textActive: "text-pink-600" },
      orange: { active: "border-orange-500 ring-orange-50 bg-white", iconActive: "bg-orange-600 text-white", textActive: "text-orange-600" },
      red: { active: "border-red-500 ring-red-50 bg-white", iconActive: "bg-red-600 text-white", textActive: "text-red-600" },
      purple: { active: "border-purple-500 ring-purple-50 bg-white", iconActive: "bg-purple-600 text-white", textActive: "text-purple-600" }
    };
    const currentStyle = styles[color] || styles.pink;
  
    return (
      <button onClick={onClick} className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 ${isActive ? `ring-4 shadow-xl scale-[1.02] ${currentStyle.active}` : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
        <div className={`p-3 rounded-lg ${isActive ? currentStyle.iconActive : 'bg-gray-100 text-gray-600'}`}>{icon}</div>
        <div className="text-left">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
          <p className={`text-2xl font-black ${isActive ? currentStyle.textActive : 'text-gray-800'}`}>{value}</p>
        </div>
      </button>
    );
  }