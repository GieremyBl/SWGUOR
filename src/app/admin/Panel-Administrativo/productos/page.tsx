"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useProducts } from "@/lib/hooks/useProducts";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet, Plus, Package, RefreshCw,
  AlertTriangle, XCircle, BarChart3, ChevronLeft, ChevronRight,
  FileText, ShieldAlert
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel, exportInventarioToPDF } from "@/lib/utils/export-utils";
import ProductFilters from "@/components/admin/productos/ProductFilters";
import { Constants } from "@/types/database";

// Lazy loading de componentes base
const ProductosTable = dynamic(() => import("@/components/admin/productos/ProductosTable"));
const CreateProductoDialog = dynamic(() => import("@/components/admin/productos/CreateProductoDialog"));
const EditProductoDialog = dynamic(() => import("@/components/admin/productos/EditProductoDialog"));
const DeleteProductoDialog = dynamic(() => import("@/components/admin/productos/DeleteProductoDialog"));

// Componentes que crearemos para el detalle profundo
const VariantsDetailDialog = dynamic(() => import("@/components/admin/productos/VariantsDetailDialog"));
const TechSheetDialog = dynamic(() => import("@/components/admin/productos/TechSheetDialog"));

export default function ProductosPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const { productos, loading: productosLoading, refetch } = useProducts();
  
  // ESTADOS DE DATOS
  const [categorias, setCategorias] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, bajoStock: 0, agotados: 0, lineas: 0 });
  
  // ESTADOS DE FILTROS [cite: 63-66, 86-90]
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todos");
  const [colorFilter, setColorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState(""); // Filtro de tallas (S, M, L, XL)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [quickFilter, setQuickFilter] = useState<"todos" | "bajo_stock" | "agotados">("todos");
  
  // ESTADOS DE INTERFAZ
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | "stock" | "ficha" | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const allColors = Constants.public.Enums.ColorPrenda;
  const pageSize = 10;

  // CARGA DE CATEGORÍAS [cite: 69]
  const loadCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categorias');
      const catData = res.ok ? await res.json() : [];
      setCategorias(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Error loading categorías:", err);
    }
  }, []);

  // EFECTO DE CARGA INICIAL (Sin bucle infinito) 
  useEffect(() => {
    if (!authLoading) {
      loadCategorias();
      refetch();
    }
  }, [authLoading]); 

  // CÁLCULO DE ESTADÍSTICAS [cite: 71]
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

  // HANDLERS [cite: 72-76]
  const handleEdit = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("edit"); }, []);
  const handleDelete = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("delete"); }, []);
  const handleStock = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("stock"); }, []);
  const handleFicha = useCallback((p: any) => { setSelectedProducto(p); setDialogMode("ficha"); }, []);

  // EXPORTACIÓN [cite: 77-85]
  const handleExportExcel = () => {
    if (filteredProducts.length === 0) return toast.error("No hay datos para exportar");
    const dataToExport = filteredProducts.map(p => ({
      "SKU": p.sku,
      "Producto": p.nombre,
      "Categoría": categorias.find(c => c.id === p.categoria_id)?.nombre || "Sin categoría",
      "Stock": p.stock,
      "Precio": p.precio,
      "Estado": p.stock === 0 ? "Agotado" : p.stock <= 5 ? "Bajo Stock" : "Disponible"
    }));
    exportToExcel(dataToExport as any, { filename: `Inventario_GUOR_${new Date().toISOString().split('T')[0]}` });
    toast.success("Excel generado correctamente");
  };

  const handleExportPDF = async () => {
    if (filteredProducts.length === 0) return toast.error("No hay datos para exportar");
    const toastId = toast.loading("Preparando PDF...");
    try {
      await exportInventarioToPDF(filteredProducts as any, categorias, {
        title: "REPORTE DE INVENTARIO - Modas y Estilos GUOR",
        filename: `Inventario_GUOR_${new Date().toISOString().split('T')[0]}`
      });
      toast.success("PDF descargado con éxito", { id: toastId });
    } catch (error) {
      toast.error("Error al generar el PDF", { id: toastId });
    }
  };

  // LÓGICA DE FILTRADO AVANZADA 
  const filteredProducts = useMemo(() => {
    let result = [...productos];
    const search = searchTerm.toLowerCase().trim();

    if (search) {
      result = result.filter((p: any) =>
        p.nombre.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
      );
    }

    if (selectedCategoria !== "todos") {
      result = result.filter((p: any) => p.categoria_id === Number(selectedCategoria));
    }

    if (colorFilter) {
      result = result.filter((p: any) =>
        p.variantes_producto?.some((v: any) => v.color === colorFilter)
      );
    }

    if (sizeFilter) {
      result = result.filter((p: any) =>
        p.variantes_producto?.some((v: any) => v.talla === sizeFilter)
      );
    }

    if (quickFilter === "bajo_stock") {
      result = result.filter((p: any) => p.stock > 0 && p.stock <= 5);
    } else if (quickFilter === "agotados") {
      result = result.filter((p: any) => p.stock === 0);
    }

    if (sortOrder !== 'none') {
      result.sort((a, b) => {
        const precioA = Number(a.precio || 0);
        const precioB = Number(b.precio || 0);
        return sortOrder === 'asc' ? precioA - precioB : precioB - precioA;
      });
    }

    return result;
  }, [productos, searchTerm, colorFilter, sizeFilter, quickFilter, selectedCategoria, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedData = useMemo(() => {
    return filteredProducts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [filteredProducts, currentPage]);

  if (authLoading) return <LoadingInventory />;
  if (!can('view', 'productos')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header [cite: 93-97] */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inventario de Productos
            </h1>
            <p className="text-gray-500 text-sm">Gestión unificada del catálogo Modas y Estilos GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            {can('export', 'productos') && (
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
            {can('create', 'productos') && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg font-bold gap-2 h-11 px-6 transition-all">
                <Plus className="w-5 h-5" /> Nuevo Producto
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid [cite: 98-101] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="TOTAL PRODUCTOS" value={stats.total} icon={<Package className="w-6 h-6" />} isActive={quickFilter === "todos"} color="pink" onClick={() => { setQuickFilter("todos"); setCurrentPage(0); }} />
          <StatCard title="BAJO STOCK" value={stats.bajoStock} icon={<AlertTriangle className="w-6 h-6" />} isActive={quickFilter === "bajo_stock"} color="orange" onClick={() => { setQuickFilter("bajo_stock"); setCurrentPage(0); }} />
          <StatCard title="AGOTADOS" value={stats.agotados} icon={<XCircle className="w-6 h-6" />} isActive={quickFilter === "agotados"} color="red" onClick={() => { setQuickFilter("agotados"); setCurrentPage(0); }} />
          <StatCard title="CATEGORÍAS" value={stats.lineas} icon={<BarChart3 className="w-6 h-6" />} isActive={false} color="blue" onClick={() => { }} />
        </div>

        {/* FILTROS INTEGRADOS (Aquí va el componente que actualizaremos luego)  */}
        <ProductFilters 
  searchTerm={searchTerm} 
  setSearchTerm={setSearchTerm}
  colorFilter={colorFilter} 
  setColorFilter={setColorFilter}
  sizeFilter={sizeFilter} 
  setSizeFilter={setSizeFilter}
  sortOrder={sortOrder} 
  setSortOrder={setSortOrder}
  selectedCategoria={selectedCategoria} 
  setSelectedCategoria={setSelectedCategoria}
  categorias={categorias} 
  colors={allColors as any}
  // BORRAMOS: statusFilter y setStatusFilter (ya no se necesitan)
/>

        {/* Tabla principal [cite: 107-109] */}
        {productosLoading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase">Sincronizando...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ProductosTable
              data={paginatedData}
              categorias={categorias}
              canEdit={can('edit', 'productos')}
              canDelete={can('delete', 'productos')}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStock={handleStock}
              onFicha={handleFicha}
            />

            {/* Paginación [cite: 111-114] */}
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

      {/* MODALES [cite: 114-117] */}
      {isCreateOpen && (
        <CreateProductoDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={refetch} categorias={categorias} />
      )}

      {selectedProducto && (
        <>
          {dialogMode === "edit" && (
            <EditProductoDialog isOpen={true} producto={selectedProducto} onClose={() => { setDialogMode(null); setSelectedProducto(null); }} onSuccess={refetch} categorias={categorias} />
          )}
          {dialogMode === "delete" && (
            <DeleteProductoDialog isOpen={true} producto={selectedProducto} onClose={() => { setDialogMode(null); setSelectedProducto(null); }} onSuccess={refetch} />
          )}
          {dialogMode === "stock" && (
            <VariantsDetailDialog isOpen={true} producto={selectedProducto} onClose={() => { setDialogMode(null); setSelectedProducto(null); }} />
          )}
          {dialogMode === "ficha" && (
            <TechSheetDialog isOpen={true} producto={selectedProducto} onClose={() => { setDialogMode(null); setSelectedProducto(null); }} />
          )}
        </>
      )}
    </div>
  );
}

// SUB-COMPONENTES AUXILIARES [cite: 118-122]
function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <div className="bg-amber-50 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-amber-600" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Privilegios Insuficientes</h2>
      <p className="text-gray-500 max-w-sm mt-2 font-medium">Tu rol actual no permite la gestión del inventario físico.</p>
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