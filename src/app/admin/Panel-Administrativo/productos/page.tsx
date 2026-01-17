"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Producto, Categoria } from "@/types/supabase.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// AGREGADOS: ChevronLeft y ChevronRight a la importación
import { 
  Plus, Search, Download, BarChart3, Package, 
  AlertTriangle, XCircle, Upload, ChevronLeft, ChevronRight 
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { exportToExcel, exportProductosToPDFWithImages } from "@/lib/exports";

import CreateProductoDialog from "@/components/admin/productos/CreateProductoDialog";
import EditProductoDialog from "@/components/admin/productos/EditProductoDialog";
import DeleteProductoDialog from "@/components/admin/productos/DeleteProductoDialog";
import StockDialog from "@/components/admin/productos/StockDialog";
import ProductosTable from "@/components/admin/productos/ProductosTable";

export default function ProductosPage() {
  const { isLoading: userLoading } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todos");
  const [selectedEstado, setSelectedEstado] = useState<string>("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [activeDialog, setActiveDialog] = useState<"edit" | "delete" | "stock" | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const [prodRes, catRes] = await Promise.all([
        supabase.from("productos").select("*, categorias(nombre)").order("created_at", { ascending: false }),
        supabase.from("categorias").select("*").eq("activo", true).order("nombre")
      ]);

      if (prodRes.error) throw prodRes.error;
      setProductos(prodRes.data || []);
      setCategorias(catRes.data || []);
    } catch (error) {
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategoria === "todos" || p.categoria_id === Number(selectedCategoria);
      const matchEst = selectedEstado === "todos" || p.estado === selectedEstado;
      return matchSearch && matchCat && matchEst;
    });
  }, [productos, searchTerm, selectedCategoria, selectedEstado]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleAction = (producto: Producto, type: "edit" | "delete" | "stock") => {
    setSelectedProducto(producto);
    setActiveDialog(type);
  };

  const handleDownloadExcel = () => {
    const data = filteredProducts.map(p => ({
      SKU: p.sku,
      Producto: p.nombre,
      Stock: p.stock,
      Precio: p.precio,
      Estado: p.estado
    }));
    exportToExcel(data, { filename: "inventario_guor" });
    toast.success("Excel generado con éxito");
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Procesando imágenes...", { id: "pdf-toast" });
      await exportProductosToPDFWithImages(filteredProducts);
      toast.success("PDF generado", { id: "pdf-toast" });
    } catch (error) {
      toast.error("Error al generar el PDF", { id: "pdf-toast" });
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];
        console.log("Datos:", rows);
        toast.info("Importación procesada");
      } catch (err) {
        toast.error("Error al procesar Excel");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (userLoading || loading) return <LoadingState />;

  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600">Gestión de catálogo e inventario - Guor</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total" value={productos.length} icon={<Package className="text-blue-600"/>} />
          <StatCard title="Stock Bajo" value={productos.filter(p => p.stock <= (p.stock_minimo || 5)).length} icon={<AlertTriangle className="text-orange-600"/>} color="text-orange-600" />
          <StatCard title="Agotados" value={productos.filter(p => p.stock === 0).length} icon={<XCircle className="text-red-600"/>} color="text-red-600" />
          <StatCard title="Categorías" value={categorias.length} icon={<BarChart3 className="text-purple-600"/>} />
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-10" 
                  value={searchTerm} 
                  onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
                />
              </div>
              <Select value={selectedCategoria} onValueChange={(v) => {setSelectedCategoria(v); setCurrentPage(1);}}>
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedEstado} onValueChange={(v) => {setSelectedEstado(v); setCurrentPage(1);}}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="agotado">Agotado</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDownloadExcel}><Download className="w-4 h-4" /></Button>
                <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}><BarChart3 className="w-4 h-4" /></Button>
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /></Button>
                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImportExcel} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla Paginada (Única instancia centrada) */}
        <Card className="overflow-hidden shadow-sm border-0">
          <ProductosTable 
            data={paginatedProducts} 
            categorias={categorias}
            onEdit={(p) => handleAction(p, "edit")}
            onDelete={(p) => handleAction(p, "delete")}
            onStock={(p) => handleAction(p, "stock")}
          />

          {/* Footer de Paginación */}
          <div className="px-6 py-4 bg-white border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Mostrando <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="font-semibold text-gray-700">{filteredProducts.length}</span> productos
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${currentPage === page ? "bg-pink-600 hover:bg-pink-700" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Diálogos */}
      <CreateProductoDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadData} categorias={categorias} />
      {selectedProducto && (
        <>
          <EditProductoDialog isOpen={activeDialog === "edit"} producto={selectedProducto} onClose={() => setActiveDialog(null)} onSuccess={loadData} categorias={categorias} />
          <DeleteProductoDialog isOpen={activeDialog === "delete"} producto={selectedProducto} onClose={() => setActiveDialog(null)} onSuccess={loadData} />
          <StockDialog isOpen={activeDialog === "stock"} producto={selectedProducto} onClose={() => setActiveDialog(null)} onSuccess={loadData} />
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color = "" }: any) {
  return (
    <Card><CardContent className="pt-6 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
    </CardContent></Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
    </div>
  );
}