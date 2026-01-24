"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Plus, Search, Users, RefreshCw, UserCheck, UserMinus, ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/utils/export-utils";
import { usePermissions } from "@/lib/hooks/usePermissions";

// Lazy loading
const ClientesTable = dynamic(() => import("@/components/admin/clientes/ClientesTable"));
const EditClienteDialog = dynamic(() => import("@/components/admin/clientes/EditClienteDialog"));
const DeleteClienteDialog = dynamic(() => import("@/components/admin/clientes/DeleteClienteDialog"));

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const pageSize = 10;

  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0 });

  const loadStats = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const [resTotal, resActivos, resInactivos] = await Promise.all([
        supabase.from("clientes").select("*", { count: 'exact', head: true }),
        supabase.from("clientes").select("*", { count: 'exact', head: true }).eq("activo", true),
        supabase.from("clientes").select("*", { count: 'exact', head: true }).eq("activo", false),
      ]);
      setStats({
        total: resTotal.count || 0,
        activos: resActivos.count || 0,
        inactivos: resInactivos.count || 0
      });
    } catch (err) { console.error(err); }
  }, []);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      let query = supabase.from("clientes").select("*", { count: 'exact' });
      if (statusFilter !== null) query = query.eq("activo", statusFilter);

      const from = currentPage * pageSize;
      const { data, error } = await query
        .order("razon_social", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      setClientes(data || []);
      loadStats(); 
    } catch (err) {
      toast.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, loadStats]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const handleEdit = (cliente: any) => {
    setSelectedCliente(cliente);
    setDialogMode("edit");
  };

  const handleDeleteTrigger = (cliente: any) => {
    setSelectedCliente(cliente);
    setDialogMode("delete");
  };

  const handleToggleStatus = async (cliente: any) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("clientes")
        .update({ activo: !cliente.activo })
        .eq("id", cliente.id);
      if (error) throw error;
      toast.success(`Cliente ${!cliente.activo ? 'activado' : 'desactivado'}`);
      fetchClientes();
    } catch (err) { toast.error("No se pudo cambiar el estado"); }
  };

  const handleExportExcel = () => {
    if (clientes.length === 0) return toast.error("No hay datos para exportar");
    const dataToExport = clientes.map(c => ({
      "Razón Social": c.razon_social,
      "RUC/DNI": c.ruc,
      "Correo": c.email,
      "Teléfono": c.telefono,
      "Estado": c.activo ? "Activo" : "Inactivo",
      "Registro": new Date(c.created_at).toLocaleDateString()
    }));
    exportToExcel(dataToExport, { filename: `Clientes_GUOR_${new Date().toISOString().split('T')[0]}` });
    toast.success("Excel generado exitosamente");
  };

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => 
      c.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ruc?.toString().includes(searchTerm)
    );
  }, [clientes, searchTerm]);

  const currentTotalForPagination = statusFilter === null ? stats.total : 
                                   statusFilter === true ? stats.activos : stats.inactivos;
  const totalPages = Math.ceil(currentTotalForPagination / pageSize);

  const { can, isLoading: authLoading } = usePermissions();

  if (!authLoading && !can('view', 'clientes')) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500 font-bold uppercase tracking-tighter">No tienes permisos para ver este módulo</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-pink-600" /> Directorio de Clientes
            </h1>
            <p className="text-gray-500 text-sm">Gestión unificada de clientes GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            {can('export', 'clientes') && (
              <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 transition-all active:scale-95">
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </Button>
            )}
          </div>
        </div>

        {/* CARTAS DE ESTADÍSTICAS CORREGIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="TOTAL GENERAL" 
            value={stats.total} 
            icon={<Users className="w-6 h-6" />} 
            isActive={statusFilter === null} 
            color="pink" 
            onClick={() => {setStatusFilter(null); setCurrentPage(0);}} 
          />
          <StatCard 
            title="ACTIVOS" 
            value={stats.activos} 
            icon={<UserCheck className="w-6 h-6" />} 
            isActive={statusFilter === true} 
            color="emerald" 
            onClick={() => {setStatusFilter(true); setCurrentPage(0);}} 
          />
          <StatCard 
            title="INACTIVOS" 
            value={stats.inactivos} 
            icon={<UserMinus className="w-6 h-6" />} 
            isActive={statusFilter === false} 
            color="orange" 
            onClick={() => {setStatusFilter(false); setCurrentPage(0);}} 
          />
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por razón social, RUC o correo..." 
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 border-gray-200" onClick={fetchClientes}>
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
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
            <ClientesTable 
              data={filteredClientes} 
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
              onToggleStatus={handleToggleStatus}
            />
            
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{clientes.length}</span> de <span className="font-bold text-gray-900">{currentTotalForPagination}</span>
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

      {/* Diálogos */}
      {selectedCliente && dialogMode === "edit" && (
        <EditClienteDialog isOpen={true} onClose={() => {setDialogMode(null); setSelectedCliente(null);}} onSuccess={fetchClientes} cliente={selectedCliente} />
      )}
      {selectedCliente && dialogMode === "delete" && (
        <DeleteClienteDialog isOpen={true} onClose={() => {setDialogMode(null); setSelectedCliente(null);}} onSuccess={fetchClientes} cliente={selectedCliente} />
      )}
    </div>
  );
}

// SUBCOMPONENTE CORREGIDO CON CLASES ESTÁTICAS PARA TAILWIND
function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  // Configuración de estilos según color
  const styles: any = {
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
    }
  };

  const currentStyle = styles[color];

  return (
    <button onClick={onClick} className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${isActive ? `ring-4 shadow-xl scale-[1.02] z-10 ${currentStyle.active}` : 'bg-white border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95'}`}>
      <div className={`p-3 rounded-lg transition-all duration-300 ${isActive ? `${currentStyle.iconActive} rotate-3` : 'bg-gray-100 text-gray-600 group-hover:rotate-3'}`}> {icon} </div>
      <div className="text-left"> 
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${isActive ? currentStyle.textActive : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}