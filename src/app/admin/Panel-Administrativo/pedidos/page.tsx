"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, Plus, Search, ShoppingBag, RefreshCw, 
  Clock, CheckCircle2, XCircle, Filter, Loader2 
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
    if (!authLoading && can('view', 'pedidos')) {
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
            <p className="text-gray-500 text-sm font-medium">Gestión de pedidos Modas GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            {can('export', 'pedidos') && (
              <Button 
                onClick={handleExport} 
                variant="outline" 
                className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </Button>
            )}

            {can('create', 'pedidos') && (
              <Button 
                onClick={() => setIsCreateOpen(true)} 
                className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 px-6 text-white"
              >
                <Plus className="w-5 h-5" /> 
                <span>Nuevo Pedido</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="TOTAL VENTAS" value={stats.total} icon={<ShoppingBag />} isActive={statusFilter === "todos"} color="blue" onClick={() => setStatusFilter("todos")} />
          <StatCard title="PENDIENTES" value={stats.pendientes} icon={<Clock />} isActive={statusFilter === "pendiente"} color="orange" onClick={() => setStatusFilter("pendiente")} />
          <StatCard title="COMPLETADOS" value={stats.completados} icon={<CheckCircle2 />} isActive={statusFilter === "completado"} color="emerald" onClick={() => setStatusFilter("completado")} />
          <StatCard title="CANCELADOS" value={stats.cancelados} icon={<XCircle />} isActive={statusFilter === "cancelado"} color="red" onClick={() => setStatusFilter("cancelado")} />
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente o N° de pedido..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-pink-200 focus:ring-4 focus:ring-pink-50 transition-all outline-none text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-48">
            <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
              <SelectTrigger className="w-full h-11 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-pink-500" />
                  <SelectValue placeholder="Fecha" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Cualquier fecha</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Últimos 7 días</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button onClick={loadPedidos} className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-pink-600 rounded-xl transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabla */}
        <div className="space-y-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-xl border italic text-gray-400">Cargando pedidos...</div>
          ) : (
            <PedidosTable 
              data={filteredPedidos} 
              onView={(p: any) => { setSelectedPedido(p); setDialogMode("view"); }}
              onCancel={can('delete', 'pedidos') ? (p: any) => { setSelectedPedido(p); setDialogMode("cancel"); } : undefined}
            />
          )}
        </div>
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

// Componentes Auxiliares Internos
function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    blue: "border-blue-500 ring-blue-50",
    orange: "border-orange-500 ring-orange-50",
    emerald: "border-emerald-500 ring-emerald-50",
    red: "border-red-500 ring-red-50"
  };
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isActive ? `ring-4 ${styles[color]} bg-white shadow-md` : 'bg-white border-gray-100 hover:shadow-sm'}`}>
      <div className={`p-3 rounded-lg ${isActive ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{icon}</div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
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
      <XCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 uppercase">Acceso Denegado</h2>
      <p className="text-gray-500 max-w-sm mt-2">No tienes permisos para gestionar pedidos. Contacta al administrador del sistema.</p>
    </div>
  );
}