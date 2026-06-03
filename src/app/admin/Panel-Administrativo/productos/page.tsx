"use client";

import { useState, useMemo, useEffect } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useProductos } from "@/lib/hooks/useProductos";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, RefreshCw, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText
} from "lucide-react";
import dynamic from "next/dynamic";
import ProductFilters from "@/components/admin/productos/ProductsFilters";
import ProductosTable from "@/components/admin/productos/ProductsTable";
import { toast } from "sonner";
import { useProductoStockResumen } from "@/lib/hooks/useStockResumen";
import { cn } from "@/lib/utils";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";
import ProductosStats from "@/components/admin/productos/ProductosStats";
import {
  exportProductosToExcel,
  exportInventarioToPDF
} from "@/lib/utils/export-utils";

const DescontinuarProductoDialog = dynamic(() =>
  import("@/components/admin/productos/DescontinuarProductDialog")
);

export default function ProductosPage() {
  const { can, role, isLoading: authLoading } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("all");
  const [colorFilter, setColorFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>("none");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProducto, setSelectedProducto] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const pageSize = 10;
  const { data: stockResumen } = useProductoStockResumen();

  // Estados de carga para las exportaciones
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const { productos, categorias, isLoading, refetch, toggleEstado, remove } = useProductos({
    categoriaId: selectedCategoria !== "all" ? selectedCategoria : undefined,
    busqueda: searchTerm || undefined,
    color: colorFilter || undefined,
    talla: sizeFilter || undefined,
    sortOrder
  });

  const productosProcesados = useMemo(() => {
    let result = [...productos];

    if (statusFilter === "activo") {
      result = result.filter((p: any) => p.estado === "activo");
    } else if (statusFilter === "bajoStock") {
      result = result.filter((p: any) => p.stock > 0 && p.stock <= 5);
    }

    return result.sort((a: any, b: any) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
  }, [productos, statusFilter]);

  const stats = useMemo(() => ({
    total: productos.length,
    activos: productos.filter((p: any) => p.estado === "activo").length,
    bajoStock: productos.filter((p: any) => p.stock > 0 && p.stock <= 5).length
  }), [productos]);

  const totalPages = Math.ceil(productosProcesados.length / pageSize);

  const paginatedData = productosProcesados
    .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    .map((p: any) => ({
      ...p,
      stock: stockResumen?.find((s) => s.producto_id === Number(p.id))?.stock_total_adicional ?? p.stock ?? 0
    }));

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedCategoria, colorFilter, sizeFilter, sortOrder, statusFilter]);

  // ── LÓGICA DE EXPORTACIÓN EXCEL Y PDF (SANEADA PARA TYPESCRIPT) ──

  const handleExportExcel = async () => {
    if (productosProcesados.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    const toastId = toast.loading("Generando Excel...");
    try {
      setExportingExcel(true);

      // CORRECCIÓN TS: Removemos nulos convirtiéndolos a cadenas vacías o undefined
      const productosSaneados = productosProcesados.map((p: any) => ({
        ...p,
        sku: p.sku ?? "",
        codigo: p.codigo ?? "",
        descripcion: p.descripcion ?? undefined,
        precio: Number(p.precio ?? 0),
        stock: Number(p.stock ?? 0),
        estado: p.estado ?? "inactivo"
      }));

      await exportProductosToExcel(
        productosSaneados,
        stockResumen ?? [],
        "Inventario"
      );
      toast.success("Excel descargado correctamente", { id: toastId });
    } catch (e: any) {
      console.error("[Excel export]", e);
      toast.error(e?.message ?? "Error al generar Excel", { id: toastId });
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (productosProcesados.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    const toastId = toast.loading("Generando PDF...");
    try {
      setExportingPDF(true);

      // CORRECCIÓN TS: Mapeamos de igual forma para cumplir la firma estricta del PDF
      const productosSaneados = productosProcesados.map((p: any) => ({
        ...p,
        sku: p.sku ?? "",
        codigo: p.codigo ?? "",
        descripcion: p.descripcion ?? undefined,
        precio: Number(p.precio ?? 0),
        stock: Number(p.stock ?? 0),
        estado: p.estado ?? "inactivo"
      }));

      await exportInventarioToPDF(productosSaneados, categorias, {
        filename: "Inventario",
        title: "REPORTE DE INVENTARIO",
      });
      toast.success("PDF descargado correctamente", { id: toastId });
    } catch (e: any) {
      console.error("[PDF export]", e);
      toast.error(e?.message ?? "Error al generar PDF", { id: toastId });
    } finally {
      setExportingPDF(false);
    }
  };

  if (authLoading) return <LoadingScreen />;
  if (!can("view", "productos")) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        <AdminPageHeader
          title="Gestión de Inventario"
          description="Control centralizado de productos, SKU y existencias"
          actionLabel="Nuevo Producto"
          showAction={can("create", "productos")}
          onAction={() => {
            window.location.href = "/admin/Panel-Administrativo/productos/nuevo";
          }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportingExcel || isLoading}
              className="h-11 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
              {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportingPDF || isLoading}
              className="h-11 rounded-xl border-red-200 hover:bg-red-50 hover:text-red-700 text-gray-600 font-medium transition-all"
            >
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        </AdminPageHeader>

        <ProductosStats
          stats={stats}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onPageReset={() => setCurrentPage(0)}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex-1">
              <ProductFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategoria={selectedCategoria}
                setSelectedCategoria={setSelectedCategoria}
                colorFilter={colorFilter}
                setColorFilter={setColorFilter}
                sizeFilter={sizeFilter}
                setSizeFilter={setSizeFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                categorias={categorias}
                colors={[]}
              />
            </div>
            <Button variant="outline" className="h-11 w-11 p-0 border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95" onClick={() => refetch()}>
              <RefreshCw className={cn("w-4 h-4 text-gray-500", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sincronizando productos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ProductosTable
              data={paginatedData}
              categorias={categorias}
              loading={isLoading}
              onEdit={(p) => { setSelectedProducto(p); }}
              onArchive={(p) => { setSelectedProducto(p); setIsDeleteOpen(true); }}
              onStatusChange={(p) => toggleEstado(p.id.toString(), p.estado === 'activo' ? 'inactivo' : 'activo')}
            />

            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de <span className="font-bold text-gray-900">{productosProcesados.length}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl flex items-center">
                  Página {currentPage + 1} de {totalPages || 1}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages} className="rounded-xl">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {role && (
        <DescontinuarProductoDialog
          isOpen={isDeleteOpen}
          producto={selectedProducto}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={() => remove(selectedProducto?.id?.toString())}
          rolUsuario={role}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Cargando inventario...</p>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4 opacity-20" />
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Acceso Restringido</h2>
      <p className="text-gray-500 max-w-sm mt-2 font-medium">No cuentas con los privilegios necesarios para visualizar el catálogo de productos.</p>
    </div>
  );
}