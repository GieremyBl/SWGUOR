"use client";

import { useState, useEffect, useMemo } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Categoria } from "@/types/supabase.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, Search, Layers, CheckCircle2, 
  XCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import CategoriasTable from "@/components/admin/categorias/CategoriasTable";
import CreateCategoriaDialog from "@/components/admin/categorias/CreateCategoriaDialog";
import EditCategoriaDialog from "@/components/admin/categorias/EditCategoriaDialog";
import DeleteCategoriaDialog from "@/components/admin/categorias/DeleteCategoriaDialog";

export default function CategoriasPage() {
  const { isLoading: userLoading } = usePermissions();
  
  // Estados de datos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados de Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [activeDialog, setActiveDialog] = useState<"edit" | "delete" | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<string>("todos");

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      toast.error("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  // 1. Filtrado Lógico
  const filteredCategorias = useMemo(() => {
  return categorias.filter((c) => {
    const matchSearch = 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = 
      selectedEstado === "todos" || 
      (selectedEstado === "activo" ? c.activo : !c.activo);

    return matchSearch && matchEstado;
  });
}, [categorias, searchTerm, selectedEstado]);

  // 2. Cálculo de Paginación
  const totalPages = Math.ceil(filteredCategorias.length / itemsPerPage);
  const paginatedCategorias = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCategorias.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCategorias, currentPage]);

  const handleAction = (categoria: Categoria, type: "edit" | "delete") => {
    setSelectedCategoria(categoria);
    setActiveDialog(type);
  };

  if (userLoading || loading) return <LoadingState />;

  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Contenedor con Ancho Máximo Centrado */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header con Título y Botón Principal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-600">Organización del catálogo textil - Guor</p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-pink-600 hover:bg-pink-700 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
          </Button>
        </div>

       {/* Tarjetas de Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                title="Total Categorías" 
                value={categorias.length} 
                icon={<Layers className="text-blue-600 w-6 h-6"/>} 
            />
            <StatCard 
                title="Activas" 
                value={categorias.filter(c => c.activo).length} 
                icon={<CheckCircle2 className="text-green-600 w-6 h-6"/>} 
            />
            <StatCard 
                title="Inactivas" 
                value={categorias.filter(c => !c.activo).length} 
                icon={<XCircle className="text-red-600 w-6 h-6"/>} 
            />
        </div>

        {/* Barra de Búsqueda */}
        <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Buscador */}
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <Input 
                    placeholder="Buscar por nombre o descripción..." 
                    className="pl-10 h-11" 
                    value={searchTerm} 
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }} 
                    />
                </div>

                {/* Filtro de Estado */}
                <Select value={selectedEstado} onValueChange={(v) => {
                    setSelectedEstado(v);
                    setCurrentPage(1);
                }}>
                    <SelectTrigger className="h-11">
                    <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activo">Solo Activos</SelectItem>
                    <SelectItem value="inactivo">Solo Inactivos</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </CardContent>
            </Card>
        {/* Tabla Principal Centrada */}
        <Card className="overflow-hidden shadow-md border-0">
          <CategoriasTable 
            data={paginatedCategorias}
            onEdit={(c) => handleAction(c, "edit")}
            onDelete={(c) => handleAction(c, "delete")}
          />

          {/* Pie de Página con Controles de Paginación */}
          <div className="px-6 py-4 bg-white border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 font-medium">
              Mostrando {filteredCategorias.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredCategorias.length)} de {filteredCategorias.length} categorías
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

      {/* Renderizado Condicional de Modales */}
      <CreateCategoriaDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={loadCategorias} 
      />
      
      {selectedCategoria && (
        <>
          <EditCategoriaDialog 
            isOpen={activeDialog === "edit"} 
            categoria={selectedCategoria} 
            onClose={() => setActiveDialog(null)} 
            onSuccess={loadCategorias} 
          />
          <DeleteCategoriaDialog 
            isOpen={activeDialog === "delete"} 
            categoria={selectedCategoria} 
            onClose={() => setActiveDialog(null)} 
            onSuccess={loadCategorias} 
          />
        </>
      )}
    </div>
  );
}

// Sub-componentes internos para el Page
function StatCard({ title, value, icon }: any) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      <p className="text-sm text-gray-500 font-medium">Cargando categorías...</p>
    </div>
  );
}