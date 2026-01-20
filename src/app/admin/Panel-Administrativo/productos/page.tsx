"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, Plus, Search, Package, RefreshCw, 
  AlertTriangle, XCircle, BarChart3, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/export-utils";

// Lazy loading de componentes de Productos
const ProductosTable = dynamic(() => import("@/components/admin/productos/ProductosTable"));
const CreateProductoDialog = dynamic(() => import("@/components/admin/productos/CreateProductoDialog"));
const EditProductoDialog = dynamic(() => import("@/components/admin/productos/EditProductoDialog"));
const DeleteProductoDialog = dynamic(() => import("@/components/admin/productos/DeleteProductoDialog"));
const StockDialog = dynamic(() => import("@/components/admin/productos/StockDialog"));

export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | "stock" | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [quickFilter, setQuickFilter] = useState<"todos" | "bajo_stock" | "agotados">("todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todos");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [dateFilter, setDateFilter] = useState<"todas" | "hoy" | "semana" | "mes">("todas");
  
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, bajoStock: 0, agotados: 0, lineas: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const [prodRes, catRes] = await Promise.all([
        supabase.from("productos").select("*, categorias(nombre)").order("created_at", { ascending: false }),
        supabase.from("categorias").select("*").eq("activo", true).order("nombre")
      ]);

      const data = prodRes.data || [];
      setProductos(data);
      setCategorias(catRes.data || []);

      setStats({
        total: data.length,
        bajoStock: data.filter((p: any) => p.stock > 0 && p.stock <= (p.stock_minimo || 5)).length,
        agotados: data.filter((p: any) => p.stock === 0).length,
        lineas: catRes.data?.length || 0
      });
    } catch (err) {
      toast.error("Error al sincronizar inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    const now = new Date();

    return productos.filter((p: any) => { 
      const matchSearch = !search || p.nombre.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
      const matchCat = selectedCategoria === "todos" || p.categoria_id === Number(selectedCategoria);
      
      let matchQuick = true;
      if (quickFilter === "bajo_stock") matchQuick = p.stock > 0 && p.stock <= (p.stock_minimo || 5);
      if (quickFilter === "agotados") matchQuick = p.stock === 0;

      const minP = parseFloat(priceRange.min) || 0;
      const maxP = parseFloat(priceRange.max) || Infinity;
      const matchPrice = p.precio >= minP && p.precio <= maxP;

      let matchDate = true;
      const createdDate = new Date(p.created_at);
      if (dateFilter === "hoy") matchDate = createdDate.toDateString() === now.toDateString();
      if (dateFilter === "semana") matchDate = createdDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (dateFilter === "mes") matchDate = createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();

      return matchSearch && matchCat && matchQuick && matchPrice && matchDate;
    });
  }, [productos, searchTerm, quickFilter, selectedCategoria, priceRange, dateFilter]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedData = filteredProducts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleExportExcel = () => {
    // CORRECCIÓN: Tipado :any agregado aquí para evitar el error en el mapeo
    const dataToExport = filteredProducts.map((p: any) => ({
      SKU: p.sku,
      Producto: p.nombre,
      Categoría: p.categorias?.nombre,
      Precio: p.precio,
      Stock: p.stock,
      Estado: p.stock === 0 ? "Agotado" : "Activo"
    }));
    exportToExcel(dataToExport, { filename: `Inventario_GUOR_${new Date().toISOString().split('T')[0]}` });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Unificado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-pink-600" /> Gestión de Productos
            </h1>
            <p className="text-gray-500 text-sm">Control de stock y catálogo unificado de Modas GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11">
              <Plus className="w-5 h-5" /> Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Cartas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="TOTAL GENERAL" 
            value={stats.total} 
            icon={<Package className="w-6 h-6" />} 
            isActive={quickFilter === "todos"} 
            color="blue" 
            onClick={() => {setQuickFilter("todos"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="STOCK BAJO" 
            value={stats.bajoStock} 
            icon={<AlertTriangle className="w-6 h-6" />} 
            isActive={quickFilter === "bajo_stock"} 
            color="orange" 
            onClick={() => {setQuickFilter("bajo_stock"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="AGOTADOS" 
            value={stats.agotados} 
            icon={<XCircle className="w-6 h-6" />} 
            isActive={quickFilter === "agotados"} 
            color="red" 
            onClick={() => {setQuickFilter("agotados"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="CATEGORÍAS" 
            value={stats.lineas} 
            icon={<BarChart3 className="w-6 h-6" />} 
            isActive={false} 
            color="purple" 
            onClick={() => {}} 
          />
        </div>

        {/* Buscador y Filtros Avanzados */}
        <div className="space-y-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Buscar por nombre o SKU..." 
                className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
              />
            </div>
            <Select value={selectedCategoria} onValueChange={(v) => {setSelectedCategoria(v); setCurrentPage(0);}}>
              <SelectTrigger className="h-11 w-full md:w-50 border-gray-200">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                {categorias.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(v: any) => {setDateFilter(v); setCurrentPage(0);}}>
              <SelectTrigger className="h-11 w-full md:w-40 border-gray-200">
                <SelectValue placeholder="Fecha Ingreso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Cualquier fecha</SelectItem>
                <SelectItem value="hoy">Ingresados hoy</SelectItem>
                <SelectItem value="semana">Últimos 7 días</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-11 border-gray-200" onClick={loadData}>
              <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rango de Precio:</span>
            <Input type="number" placeholder="Min" className="w-24 h-9 text-xs" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} />
            <span className="text-gray-300">-</span>
            <Input type="number" placeholder="Max" className="w-24 h-9 text-xs" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} />
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase">Sincronizando Inventario...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ProductosTable 
              data={paginatedData} 
              categorias={categorias} 
              onEdit={(p: any) => {setSelectedProducto(p); setDialogMode("edit");}}
              onDelete={(p: any) => {setSelectedProducto(p); setDialogMode("delete");}}
              onStock={(p: any) => {setSelectedProducto(p); setDialogMode("stock");}}
            />
            
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de <span className="font-bold text-gray-900">{filteredProducts.length}</span>
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

      <CreateProductoDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadData} categorias={categorias} />
      {selectedProducto && dialogMode === "edit" && <EditProductoDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={loadData} categorias={categorias} />}
      {selectedProducto && dialogMode === "delete" && <DeleteProductoDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={loadData} />}
      {selectedProducto && dialogMode === "stock" && <StockDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={loadData} />}
    </div>
  );
}

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    blue: {
      active: "border-blue-500 ring-blue-50 bg-white",
      iconActive: "bg-blue-600 text-white",
      textActive: "text-blue-600"
    },
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
    },
    red: {
      active: "border-red-500 ring-red-50 bg-white",
      iconActive: "bg-red-600 text-white",
      textActive: "text-red-600"
    },
    purple: {
      active: "border-purple-500 ring-purple-50 bg-white",
      iconActive: "bg-purple-600 text-white",
      textActive: "text-purple-600"
    }
  };

  const currentStyle = styles[color] || styles.pink;

  return (
    <button onClick={onClick} type="button" className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 cursor-pointer outline-none ${isActive ? `ring-4 shadow-xl scale-[1.02] z-10 ${currentStyle.active}` : 'bg-white border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95'}`}>
      <div className={`p-3 rounded-lg transition-all duration-300 ${isActive ? `${currentStyle.iconActive} rotate-3` : 'bg-gray-100 text-gray-600 group-hover:rotate-3'}`}>{icon}</div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${isActive ? currentStyle.textActive : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}