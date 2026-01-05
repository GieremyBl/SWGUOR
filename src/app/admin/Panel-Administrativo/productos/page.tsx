"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
import type { Producto, Categoria } from "@/types/supabase.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Trash2, Edit, Download, Upload, BarChart3 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "sonner";

const CreateProductoDialog = dynamic(
  () => import("@/components/admin/productos/CreateProductoDialog"),
  { loading: () => <p className="text-sm text-gray-500">Cargando formulario...</p> }
);

const EditProductoDialog = dynamic(
  () => import("@/components/admin/productos/EditProductoDialog"),
  { loading: () => <p className="text-sm text-gray-500">Cargando formulario...</p> }
);

const DeleteProductoDialog = dynamic(
  () => import("@/components/admin/productos/DeleteProductoDialog"),
  { loading: () => <p className="text-sm text-gray-500">Cargando confirmación...</p> }
);

const StockDialog = dynamic(
  () => import("@/components/admin/productos/StockDialog"),
  { loading: () => <p className="text-sm text-gray-500">Cargando diálogo...</p> }
);

export default function ProductosPage() {
  const { usuario, isLoading: userLoading } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todos");
  const [selectedEstado, setSelectedEstado] = useState<string>("todos");

  // Diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Cargar productos y categorías
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar productos
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select("*, categorias(nombre)")
        .order("created_at", { ascending: false });

      if (productosError) throw productosError;

      // Cargar categorías
      const { data: categoriasData, error: categoriasError } = await supabase
        .from("categorias")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (categoriasError) throw categoriasError;

      setProductos(productosData || []);
      setCategorias(categoriasData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const productosFiltered = productos.filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategoria = selectedCategoria === "todos" || p.categoria_id === Number(selectedCategoria);

    const matchEstado = selectedEstado === "todos" || p.estado === selectedEstado;

    return matchSearch && matchCategoria && matchEstado;
  });

  // Exportar a Excel
  const exportToExcel = () => {
    try {
      const dataToExport = productosFiltered.map((p) => ({
        SKU: p.sku,
        Nombre: p.nombre,
        Descripción: p.descripcion || "",
        Categoría: categorias.find((c) => c.id === p.categoria_id)?.nombre || "",
        Precio: `S/ ${p.precio.toFixed(2)}`,
        Stock: p.stock,
        Stock_Mínimo: p.stock_minimo,
        Estado: p.estado,
        "Fecha Creación": new Date(p.created_at).toLocaleDateString("es-PE"),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

      // Ajustar ancho de columnas
      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 16 },
      ];

      XLSX.writeFile(workbook, `productos_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Productos exportados a Excel");
    } catch (error) {
      console.error("Error exportando Excel:", error);
      toast.error("Error al exportar a Excel");
    }
  };

  // Exportar a PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Encabezado
      doc.setFontSize(18);
      doc.text("Reporte de Productos", pageWidth / 2, 15, { align: "center" });

      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-PE")}`, 14, 25);
      doc.text(`Total de Productos: ${productosFiltered.length}`, 14, 31);

      // Tabla
      const tableData = productosFiltered.map((p) => [
        p.sku,
        p.nombre,
        p.descripcion?.substring(0, 20) || "",
        categorias.find((c) => c.id === p.categoria_id)?.nombre || "",
        `S/ ${p.precio.toFixed(2)}`,
        p.stock,
        p.stock_minimo,
        p.estado,
      ]);

      (doc as any).autoTable({
        head: [["SKU", "Nombre", "Descripción", "Categoría", "Precio", "Stock", "Mín", "Estado"]],
        body: tableData,
        startY: 40,
        theme: "grid",
        headerStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 40, right: 14, bottom: 14, left: 14 },
        didDrawPage: (data: any) => {
          // Footer
          const pageCount = (doc as any).internal.pages.length - 1;
          doc.setFontSize(8);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        },
      });

      doc.save(`productos_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Productos exportados a PDF");
    } catch (error) {
      console.error("Error exportando PDF:", error);
      toast.error("Error al exportar a PDF");
    }
  };

  // Importar desde Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const workbook = XLSX.read(event.target?.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          let successCount = 0;
          let errorCount = 0;

          for (const row of jsonData) {
            try {
              const categoria = categorias.find(
                (c) => c.nombre.toLowerCase() === (row as any).Categoría?.toLowerCase()
              );

              if (!categoria) {
                errorCount++;
                continue;
              }

              const { error } = await supabase.from("productos").insert([
                {
                  nombre: (row as any).Nombre,
                  descripcion: (row as any).Descripción || null,
                  sku: (row as any).SKU,
                  precio: parseFloat((row as any).Precio?.replace("S/ ", "") || "0"),
                  stock: parseInt((row as any).Stock || "0"),
                  stock_minimo: parseInt((row as any).Stock_Mínimo || "0"),
                  categoria_id: categoria.id,
                  estado: (row as any).Estado || "activo",
                  updated_at: new Date().toISOString(),
                } as any,
              ] as any);

              if (error) {
                errorCount++;
              } else {
                successCount++;
              }
            } catch (err) {
              errorCount++;
            }
          }

          await loadData();

          if (successCount > 0) {
            toast.success(`${successCount} productos importados correctamente`);
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} productos no pudieron importarse`);
          }
        } catch (error) {
          console.error("Error procesando archivo:", error);
          toast.error("Error al procesar el archivo Excel");
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error importando Excel:", error);
      toast.error("Error al importar desde Excel");
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Obtener nombre de categoría
  const getCategoriaName = (categoriaId: number) => {
    return categorias.find((c) => c.id === categoriaId)?.nombre || "Sin categoría";
  };

  // Obtener color de estado
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-green-100 text-green-800";
      case "inactivo":
        return "bg-gray-100 text-gray-800";
      case "agotado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Obtener color de stock
  const getStockColor = (stock: number, stockMinimo: number) => {
    if (stock === 0) return "text-red-600 font-bold";
    if (stock <= stockMinimo) return "text-orange-600 font-bold";
    return "text-green-600";
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gestiona tu catálogo de productos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{productos.length}</p>
            <p className="text-xs text-gray-600 mt-1">En el catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Stock Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{productos.reduce((sum, p) => sum + p.stock, 0)}</p>
            <p className="text-xs text-gray-600 mt-1">Unidades en stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bajo Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {productos.filter((p) => p.stock <= p.stock_minimo).length}
            </p>
            <p className="text-xs text-gray-600 mt-1">Por debajo del mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agotados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {productos.filter((p) => p.stock === 0).length}
            </p>
            <p className="text-xs text-gray-600 mt-1">Sin existencias</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categoría */}
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Estado */}
            <Select value={selectedEstado} onValueChange={setSelectedEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="agotado">Agotado</SelectItem>
              </SelectContent>
            </Select>

            {/* Acciones de exportación */}
            <div className="flex gap-2">
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="flex-1"
                title="Exportar a Excel"
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">Excel</span>
              </Button>
              <Button
                onClick={exportToPDF}
                variant="outline"
                size="sm"
                className="flex-1"
                title="Exportar a PDF"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">PDF</span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="flex-1"
                title="Importar desde Excel"
              >
                <Upload className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">Importar</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {productosFiltered.length} producto{productosFiltered.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            {selectedCategoria !== "todos" && `Categoría: ${getCategoriaName(Number(selectedCategoria))}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Vista Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltered.length > 0 ? (
                  productosFiltered.map((producto) => (
                    <TableRow key={producto.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{producto.sku}</TableCell>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>{getCategoriaName(producto.categoria_id)}</TableCell>
                      <TableCell>S/ {producto.precio.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={getStockColor(producto.stock, producto.stock_minimo)}>
                          {producto.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoBadgeColor(producto.estado)}>
                          {producto.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(producto.created_at).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProducto(producto);
                                setShowStockDialog(true);
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Ajustar Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProducto(producto);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProducto(producto);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <p className="text-gray-500">No hay productos que coincidan con los filtros</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vista Mobile */}
          <div className="md:hidden space-y-3">
            {productosFiltered.length > 0 ? (
              productosFiltered.map((producto) => (
                <Card key={producto.id} className="border">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-base">{producto.nombre}</p>
                          <p className="text-xs text-gray-600 mt-1">SKU: {producto.sku}</p>
                        </div>
                        <Badge className={getEstadoBadgeColor(producto.estado)}>
                          {producto.estado}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Categoría</p>
                          <p className="font-medium">{getCategoriaName(producto.categoria_id)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Precio</p>
                          <p className="font-medium">S/ {producto.precio.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Stock</p>
                          <p className={getStockColor(producto.stock, producto.stock_minimo)}>
                            {producto.stock}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Mínimo</p>
                          <p className="font-medium">{producto.stock_minimo}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setSelectedProducto(producto);
                            setShowStockDialog(true);
                          }}
                        >
                          Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setSelectedProducto(producto);
                            setShowEditDialog(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs text-red-600"
                          onClick={() => {
                            setSelectedProducto(producto);
                            setShowDeleteDialog(true);
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No hay productos que coincidan con los filtros</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogos */}
      {showCreateDialog && (
        <CreateProductoDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadData();
          }}
          categorias={categorias}
        />
      )}

      {showEditDialog && selectedProducto && (
        <EditProductoDialog
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedProducto(null);
          }}
          onSuccess={() => {
            setShowEditDialog(false);
            setSelectedProducto(null);
            loadData();
          }}
          producto={selectedProducto}
          categorias={categorias}
        />
      )}

      {showDeleteDialog && selectedProducto && (
        <DeleteProductoDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedProducto(null);
          }}
          onSuccess={() => {
            setShowDeleteDialog(false);
            setSelectedProducto(null);
            loadData();
          }}
          producto={selectedProducto}
        />
      )}

      {showStockDialog && selectedProducto && (
        <StockDialog
          isOpen={showStockDialog}
          onClose={() => {
            setShowStockDialog(false);
            setSelectedProducto(null);
          }}
          onSuccess={() => {
            setShowStockDialog(false);
            setSelectedProducto(null);
            loadData();
          }}
          producto={selectedProducto}
        />
      )}
    </div>
  );
}
