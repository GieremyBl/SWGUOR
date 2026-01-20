"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, Plus, Search, ShoppingBag, RefreshCw, 
  Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Filter 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/export-utils";
import { Input } from "@/components/ui/input";

const PedidosTable = dynamic(() => import("@/components/admin/pedidos/PedidosTable"));
const CreatePedidoDialog = dynamic(() => import("@/components/admin/pedidos/CreatePedidoDialog"));
const ViewPedidoDialog = dynamic(() => import("@/components/admin/pedidos/ViewPedidoDialog"));
const CancelPedidoDialog = dynamic(() => import("@/components/admin/pedidos/CancelPedidoDialog"));

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "cancel" | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState<"todas" | "hoy" | "semana" | "mes">("todas");
  
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, pendientes: 0, completados: 0, cancelados: 0 });

  // Función para cargar pedidos
  const loadPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, clientes(nombre, apellido)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const res = data || [];
      setPedidos(res);

      setStats({
        total: res.length,
        pendientes: res.filter((p: any) => p.estado === "pendiente").length,
        completados: res.filter((p: any) => p.estado === "completado").length,
        cancelados: res.filter((p: any) => p.estado === "cancelado").length
      });
    } catch (err) {
      toast.error("Error al sincronizar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);

  // Función para exportar a Excel
  const handleExport = () => {
  if (filteredPedidos.length === 0) {
    toast.error("No hay datos para exportar");
    return;
  }
  
  const dataToExport = filteredPedidos.map(p => ({
    "N° Pedido": p.id,
    "Fecha": new Date(p.created_at).toLocaleDateString(),
    "Cliente": `${p.clientes?.nombre} ${p.clientes?.apellido}`,
    "Total": p.total,
    "Estado": p.estado.toUpperCase(),
    "Método Pago": p.metodo_pago || 'No especificado'
  }));

  exportToExcel(dataToExport, { 
    filename: `Pedidos_ModasGUOR_${new Date().toISOString().split('T')[0]}` 
  });
  toast.success("Excel generado correctamente");
};

  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p: any) => {
      const clienteNombre = `${p.clientes?.nombre} ${p.clientes?.apellido}`.toLowerCase();
      const matchSearch = clienteNombre.includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm);
      const matchStatus = statusFilter === "todos" || p.estado === statusFilter;
      
      let matchDate = true;
      const now = new Date();
      const createdDate = new Date(p.created_at);
      if (dateFilter === "hoy") matchDate = createdDate.toDateString() === now.toDateString();
      if (dateFilter === "semana") matchDate = createdDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (dateFilter === "mes") matchDate = createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      
      return matchSearch && matchStatus && matchDate;
    });
  }, [pedidos, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredPedidos.length / pageSize);
  const paginatedData = filteredPedidos.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="text-pink-600" /> Registro de Ventas
                </h1>
                <p className="text-gray-500 text-sm font-medium">Gestión de pedidos Modas GUOR</p>
            </div>

                <div className="flex items-center gap-3">
                    {/* Botón Exportar Excel con estilo esmeralda */}
                    <Button 
                        onClick={handleExport} 
                        variant="outline" 
                        className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11"
                    >
                    <FileSpreadsheet className="w-5 h-5" />
                        <span className="hidden sm:inline">Exportar Excel</span>
                    </Button>

                    {/* Botón Nuevo Pedido */}
                    <Button 
                        onClick={() => setIsCreateOpen(true)} 
                        className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 px-6 text-white"
                    >
                    <Plus className="w-5 h-5" /> 
                        <span>Nuevo Pedido</span>
                    </Button>
                </div>
            </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="TOTAL VENTAS" value={stats.total} icon={<ShoppingBag className="w-6 h-6" />} isActive={statusFilter === "todos"} color="blue" onClick={() => setStatusFilter("todos")} />
          <StatCard title="PENDIENTES" value={stats.pendientes} icon={<Clock className="w-6 h-6" />} isActive={statusFilter === "pendiente"} color="orange" onClick={() => setStatusFilter("pendiente")} />
          <StatCard title="COMPLETADOS" value={stats.completados} icon={<CheckCircle2 className="w-6 h-6" />} isActive={statusFilter === "completado"} color="emerald" onClick={() => setStatusFilter("completado")} />
          <StatCard title="CANCELADOS" value={stats.cancelados} icon={<XCircle className="w-6 h-6" />} isActive={statusFilter === "cancelado"} color="red" onClick={() => setStatusFilter("cancelado")} />
        </div>

       {/* BUSCADOR Y FILTRO DE FECHA UNIFICADOS (Diseño Limpio) */}
<div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4">
  <div className="flex items-center gap-3">
    
    {/* Cápsula Principal: Buscador (Expandido) + Fecha */}
    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-2xl px-4 h-14 focus-within:ring-2 focus-within:ring-pink-100 transition-all shadow-sm">
      <Search className="text-gray-400 w-5 h-5 mr-4 shrink-0" />
      <input 
        type="text"
        placeholder="Buscar por cliente, RUC o N° de pedido..." 
        className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Selector de Fecha integrado */}
      <div className="shrink-0">
        <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
          <SelectTrigger className="border-none shadow-none focus:ring-0 h-10 text-sm font-bold text-gray-600 gap-2 hover:bg-gray-50 rounded-xl px-3 transition-colors">
            <Filter className="w-4 h-4 text-pink-500" />
            <SelectValue placeholder="Todas las fechas" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
            <SelectItem value="todas">Todas las fechas</SelectItem>
            <SelectItem value="hoy">Hoy</SelectItem>
            <SelectItem value="semana">Últimos 7 días</SelectItem>
            <SelectItem value="mes">Este mes</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Botón de Refresco Circular (Manteniendo la estética de la imagen) */}
    <Button 
      onClick={loadPedidos} 
      variant="outline" 
      className="h-14 w-14 rounded-full border-gray-200 shrink-0 hover:bg-pink-50 hover:text-pink-600 transition-all shadow-sm group"
    >
      <RefreshCw className={`w-6 h-6 text-gray-500 group-hover:text-pink-600 ${loading && 'animate-spin'}`} />
    </Button>
  </div>

  {/* Área de Filtros Activos (Chips) */}
  {(searchTerm || statusFilter !== "todos" || dateFilter !== "todas") && (
    <div className="flex items-center flex-wrap gap-2 pt-1">
      {searchTerm && (
        <FilterChip 
          label={`Búsqueda: ${searchTerm}`} 
          onClear={() => setSearchTerm("")} 
        />
      )}
      {statusFilter !== "todos" && (
        <FilterChip 
          label={`Estado: ${statusFilter.toUpperCase()}`} 
          onClear={() => setStatusFilter("todos")} 
          color="emerald" 
        />
      )}
      {dateFilter !== "todas" && (
        <FilterChip 
          label={`Periodo: ${dateFilter}`} 
          onClear={() => setDateFilter("todas")} 
          color="blue" 
        />
      )}
      
      <button 
        onClick={() => {setSearchTerm(""); setStatusFilter("todos"); setDateFilter("todas");}}
        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors ml-auto px-2"
      >
        Limpiar todos los filtros
      </button>
    </div>
  )}
</div>
        {/* Tabla */}
        <div className="space-y-4">
          {!loading && (
            <PedidosTable 
              data={paginatedData} 
              onView={(p: any) => { setSelectedPedido(p); setDialogMode("view"); }}
              // SE ELIMINÓ onCancel PARA EVITAR EL ERROR DE TYPESCRIPT HASTA QUE ACTUALICES EL COMPONENTE
            />
          )}
        </div>
      </div>

      {/* Modales */}
      <CreatePedidoDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadPedidos} />
      {selectedPedido && dialogMode === "view" && <ViewPedidoDialog isOpen pedido={selectedPedido} onClose={() => setSelectedPedido(null)} />}
    </div>
  );
}

// Componentes auxiliares
function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    blue: "border-blue-500 bg-white ring-blue-50",
    orange: "border-orange-500 bg-white ring-orange-50",
    emerald: "border-emerald-500 bg-white ring-emerald-50",
    red: "border-red-500 bg-white ring-red-50"
  };
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isActive ? `ring-4 ${styles[color]}` : 'bg-white border-gray-100 hover:shadow-md'}`}>
      <div className={`p-3 rounded-lg ${isActive ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{icon}</div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase">{title}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
      </div>
    </button>
  );
}

function FilterChip({ label, onClear, color = "pink" }: any) {
  const colors: any = {
    pink: "bg-pink-50 text-pink-700 border-pink-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100"
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${colors[color]}`}>
      {label}
      <button onClick={onClear}><XCircle className="w-3.5 h-3.5" /></button>
    </div>
  );
}