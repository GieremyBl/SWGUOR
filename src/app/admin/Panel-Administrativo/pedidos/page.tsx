"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, Plus, Search, ShoppingBag, RefreshCw, 
  Clock, CheckCircle2, XCircle, Filter, Loader2, ShieldAlert,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/utils/export-utils";
import { usePermissions } from "@/lib/hooks/usePermissions";

// Importaciones Dinámicas
const PedidosTable = dynamic(() => import("@/components/admin/pedidos/PedidosTable"));
const CreatePedidoDialog = dynamic(() => import("@/components/admin/pedidos/CreatePedidoDialog"));
const ViewPedidoDialog = dynamic(() => import("@/components/admin/pedidos/ViewPedidoDialog"));
const CancelPedidoDialog = dynamic(() => import("@/components/admin/pedidos/CancelPedidoDialog"));

export default function PedidosPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "cancel" | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState<"todas" | "hoy" | "semana" | "mes">("todas");
  
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const [stats, setStats] = useState({ total: 0, pendientes: 0, completados: 0, cancelados: 0 });

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

  useEffect(() => { 
    if (!authLoading && can && can('view', 'pedidos')) {
      loadPedidos(); 
    }
  }, [loadPedidos, authLoading, can]);

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
      filename: `Pedidos_GUOR_${new Date().toISOString().split('T')[0]}` 
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

  if (authLoading) return <LoadingScreen />;
  if (!can('view', 'pedidos')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="text-pink-600" /> Registro de Pedidos
            </h1>
            <p className="text-gray-500 text-sm">Gestión de pedidos Modas GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            {can('export', 'pedidos') && (
              <Button 
                onClick={handleExport} 
                variant="outline" 
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </Button>
            )}

            {can('create', 'pedidos') && (
              <Button 
                onClick={() => setIsCreateOpen(true)} 
                className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 px-6 text-white transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" /> 
                <span>Nuevo Pedido</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="TOTAL VENTAS" 
            value={stats.total} 
            icon={<ShoppingBag className="w-6 h-6" />} 
            isActive={statusFilter === "todos"} 
            color="pink" 
            onClick={() => {setStatusFilter("todos"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="PENDIENTES" 
            value={stats.pendientes} 
            icon={<Clock className="w-6 h-6" />} 
            isActive={statusFilter === "pendiente"} 
            color="orange" 
            onClick={() => {setStatusFilter("pendiente"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="COMPLETADOS" 
            value={stats.completados} 
            icon={<CheckCircle2 className="w-6 h-6" />} 
            isActive={statusFilter === "completado"} 
            color="emerald" 
            onClick={() => {setStatusFilter("completado"); setCurrentPage(0);}} 
          />
          <StatCard 
            title="CANCELADOS" 
            value={stats.cancelados} 
            icon={<XCircle className="w-6 h-6" />} 
            isActive={statusFilter === "cancelado"} 
            color="red" 
            onClick={() => {setStatusFilter("cancelado"); setCurrentPage(0);}} 
          />
        </div>

        {/* Buscador y Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por cliente o N° de pedido..."
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
            />
          </div>

          <Select value={dateFilter} onValueChange={(v: any) => {setDateFilter(v); setCurrentPage(0);}}>
            <SelectTrigger className="w-full md:w-48 h-11 border-gray-200">
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Cualquier fecha</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Últimos 7 días</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-11 border-gray-200" onClick={loadPedidos}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase">Sincronizando...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <PedidosTable 
              data={paginatedData} 
              onView={(p: any) => { setSelectedPedido(p); setDialogMode("view"); }}
              onCancel={can('delete', 'pedidos') ? (p: any) => { setSelectedPedido(p); setDialogMode("cancel"); } : undefined}
            />

            {/* Paginación */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de <span className="font-bold text-gray-900">{filteredPedidos.length}</span>
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

      {/* Modales */}
      <CreatePedidoDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadPedidos} />
      
      {selectedPedido && dialogMode === "view" && (
        <ViewPedidoDialog isOpen pedido={selectedPedido} onClose={() => { setSelectedPedido(null); setDialogMode(null); }} />
      )}

      {selectedPedido && dialogMode === "cancel" && (
        <CancelPedidoDialog 
          isOpen 
          pedido={selectedPedido} 
          onClose={() => { setSelectedPedido(null); setDialogMode(null); }} 
          onSuccess={loadPedidos} 
        />
      )}
    </div>
  );
}

// Componentes Auxiliares
function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    pink: {
      active: "border-pink-500 ring-pink-50 bg-white",
      iconActive: "bg-pink-600 text-white",
      textActive: "text-pink-600"
    },
    orange: {
      active: "border-orange-500 ring-orange-50 bg-white",
      iconActive: "bg-orange-600 text-white",
      textActive: "text-orange-600"
    },
    emerald: {
      active: "border-emerald-500 ring-emerald-50 bg-white",
      iconActive: "bg-emerald-600 text-white",
      textActive: "text-emerald-600"
    },
    red: {
      active: "border-red-500 ring-red-50 bg-white",
      iconActive: "bg-red-600 text-white",
      textActive: "text-red-600"
    }
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

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
      <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Verificando Credenciales...</p>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 uppercase">Acceso Denegado</h2>
      <p className="text-gray-500 max-w-sm mt-2">No tienes permisos para gestionar pedidos. Contacta al administrador del sistema.</p>
    </div>
  );
}