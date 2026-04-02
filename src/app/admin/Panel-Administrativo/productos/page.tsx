"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useProducts } from "@/lib/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, Plus, Search, Package, RefreshCw, 
  AlertTriangle, XCircle, BarChart3, ChevronLeft, ChevronRight, 
  FileText, ShieldAlert, History 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportInventarioGeneralExcel, exportProductosToPDFWithImages } from "@/lib/utils/export-utils";

// Lazy loading de componentes
const ProductosTable = dynamic(() => import("@/components/admin/productos/ProductosTable"));
const CreateProductoDialog = dynamic(() => import("@/components/admin/productos/CreateProductoDialog"));
const EditProductoDialog = dynamic(() => import("@/components/admin/productos/EditProductoDialog"));
const DeleteProductoDialog = dynamic(() => import("@/components/admin/productos/DeleteProductoDialog"));
// Este sería el nuevo diálogo para registrar entradas de fabricación
const StockMovimientosDialog = dynamic(() => import("@/components/admin/productos/StockMovimientosDialog"));

export default function ProductosPage() {
  const { can, isLoading: authLoading, usuario } = usePermissions();
  const { productos, loading: productosLoading, error: productosError, refetch } = useProducts();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | "stock" | "ficha" | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [quickFilter, setQuickFilter] = useState<"todos" | "bajo_stock" | "agotados">("todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todos");
  
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, bajoStock: 0, agotados: 0, lineas: 0 });

  // Carga de categorías
  const loadCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categorias');
      const catData = res.ok ? await res.json() : [];
      setCategorias(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Error loading categorías:", err);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && can('view', 'productos')) {
      loadCategorias();
      refetch();
    }
  }, [authLoading, can, loadCategorias, refetch]);

  // Actualizar estadísticas (El stock aquí es de solo lectura)
  useEffect(() => { 
    if (productos.length > 0) {
      setStats({
        total: productos.length,
        bajoStock: productos.filter((p: any) => p.stock > 0 && p.stock <= 5).length,
        agotados: productos.filter((p: any) => p.stock === 0).length,
        lineas: categorias.length
      });
    }
  }, [productos, categorias]);

  // Handlers para la tabla
  const handleEdit = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("edit"); }, []);
  const handleDelete = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("delete"); }, []);
  // Ahora "Stock" abre el diálogo de movimientos/fabricación, no edición directa
  const handleStock = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("stock"); }, []);
  const handleFicha = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("ficha"); }, []);
  
  const handleExportExcel = () => {
    if (productos.length === 0) return toast.error("No hay productos para exportar");
    exportInventarioGeneralExcel(productos);
    toast.success("Excel generado correctamente");
  };

  const handleExportPDF = async () => {
  try {
    toast.info("Generando catálogo...");
    await exportProductosToPDFWithImages(productos);
  } catch (err: any) {
    toast.error(err.message);
  }
};

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return productos.filter((p: any) => { 
      const matchSearch = !search || p.nombre.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
      const matchCat = selectedCategoria === "todos" || p.categoria_id === Number(selectedCategoria);
      let matchQuick = true;
      if (quickFilter === "bajo_stock") matchQuick = p.stock > 0 && p.stock <= 5;
      if (quickFilter === "agotados") matchQuick = p.stock === 0;

      return matchSearch && matchCat && matchQuick;
    });
  }, [productos, searchTerm, quickFilter, selectedCategoria]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedData = useMemo(() => {
    return filteredProducts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [filteredProducts, currentPage]);

  if (authLoading) return <LoadingInventory />;
  if (!can('view', 'productos')) return <AccessDenied />;

  const dataForTable = useMemo(() => {
  return paginatedData.map(p => ({
    ...p,
    precio: p.precio || 0,
    stock: p.stock || 0,
    imagen: p.imagen || '',
    categoria_id: p.categoria_id || 0,
    estado: p.stock > 0 ? 'activo' : 'agotado',
  }));
}, [paginatedData]);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventario de Productos</h1>
            <p className="text-gray-500 text-sm font-medium">Control de existencias basado en producción y ventas</p>
          </div>
          
          <div className="flex items-center gap-3">
            {can('export', 'productos') && (
              <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 transition-all">
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </Button>
            )}

            {can('create', 'productos') && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg font-bold gap-2 h-11 px-6 transition-all">
                <Plus className="w-5 h-5" /> Nuevo Producto
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="TOTAL PRODUCTOS" value={stats.total} icon={<Package />} isActive={quickFilter === "todos"} color="pink" onClick={() => {setQuickFilter("todos"); setCurrentPage(0);}} />
          <StatCard title="BAJO STOCK" value={stats.bajoStock} icon={<AlertTriangle />} isActive={quickFilter === "bajo_stock"} color="orange" onClick={() => {setQuickFilter("bajo_stock"); setCurrentPage(0);}} />
          <StatCard title="AGOTADOS" value={stats.agotados} icon={<XCircle />} isActive={quickFilter === "agotados"} color="red" onClick={() => {setQuickFilter("agotados"); setCurrentPage(0);}} />
          <StatCard title="LÍNEAS/CATEGORÍAS" value={stats.lineas} icon={<BarChart3 />} isActive={false} color="blue" onClick={() => {}} />
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
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
            <SelectTrigger className="w-full md:w-64 h-11 border-gray-200">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {categorias.map((c: any) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-11 border-gray-200" onClick={refetch}>
            <RefreshCw className={`w-4 h-4 ${productosLoading && 'animate-spin'}`} />
          </Button>
        </div>

        {/* Tabla */}
        {productosLoading ? (
          <LoadingInventory />
        ) : (
          <div className="space-y-4">
            <ProductosTable 
              data={dataForTable} 
              categorias={categorias} 
              canEdit={can('edit', 'productos')}
              canDelete={can('delete', 'productos')}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStock={handleStock} // Abre movimientos
              onFicha={handleFicha}
            />
            
            {/* Paginación */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Mostrando <span className="text-gray-900 font-bold">{paginatedData.length}</span> unidades de catálogo
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

      {/* Modales Lógicos */}
      {isCreateOpen && (
        <CreateProductoDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={refetch} categorias={categorias} />
      )}

      {selectedProducto && (
        <>
          {/* El EditProductoDialog NO debe tener el campo stock editable */}
          {dialogMode === "edit" && (
            <EditProductoDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={refetch} categorias={categorias} />
          )}
          
          {/* Este diálogo es el importante ahora: registra ingresos por fabricación */}
          {dialogMode === "stock" && (
            <StockMovimientosDialog 
              isOpen={true} 
              producto={selectedProducto} 
              onClose={() => {setDialogMode(null); setSelectedProducto(null);}} 
              onSuccess={refetch} 
            />
          )}

          {dialogMode === "delete" && (
            <DeleteProductoDialog isOpen={true} producto={selectedProducto} onClose={() => {setDialogMode(null); setSelectedProducto(null);}} onSuccess={refetch} />
          )}
        </>
      )}
    </div>
  );
}

// Sub-componentes visuales originales
function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <div className="bg-amber-50 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-amber-600" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Privilegios Insuficientes</h2>
      <p className="text-gray-500 max-w-sm mt-2 font-medium">
        Tu rol actual permite la visualización, pero no la modificación de existencias físicas en el inventario.
      </p>
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
    pink: { active: "border-pink-500 ring-pink-50 bg-white", iconActive: "bg-pink-600 text-white", textActive: "text-pink-600" },
    orange: { active: "border-orange-500 ring-orange-50 bg-white", iconActive: "bg-orange-600 text-white", textActive: "text-orange-600" },
    red: { active: "border-red-500 ring-red-50 bg-white", iconActive: "bg-red-600 text-white", textActive: "text-red-600" },
    blue: { active: "border-blue-500 ring-blue-50 bg-white", iconActive: "bg-blue-600 text-white", textActive: "text-blue-600" }
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