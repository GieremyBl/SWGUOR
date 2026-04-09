"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileSpreadsheet, Users, UserCheck, UserMinus, ChevronLeft, ChevronRight, 
  Ban, Star, Search, RefreshCw, XCircle 
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/utils/export-utils";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Database } from "@/types/database";

type EstadoCliente = Database['public']['Enums']['EstadoCliente'];

const ClientesTable = dynamic(() => import("@/components/admin/clientes/ClientesTable"));
const EditClienteDialog = dynamic(() => import("@/components/admin/clientes/EditClienteDialog"));
const DeleteClienteDialog = dynamic(() => import("@/components/admin/clientes/DeleteClienteDialog"));

export default function ClientesPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<EstadoCliente | null>(null)
  const pageSize = 10;

  const [stats, setStats] = useState({ 
    total: 0, 
    activo: 0, 
    inactivo: 0, 
    suspendido: 0, 
    potencial: 0 
  });

  // Permisos
  const canView = can('view', 'clientes');
  const canCreate = can('create', 'clientes');
  const canEdit = can('edit', 'clientes');
  const canDelete = can('delete', 'clientes');
  const canExport = can('export', 'clientes');

  const loadStats = useCallback(async () => {
    if (!canView) return;

    try {
      const supabase = getSupabaseBrowserClient();
      const [resTotal, resActivos, resInactivos, resSusp, resPot] = await Promise.all([
        supabase.from("clientes").select("*", { count: 'exact', head: true }),
        supabase.from("clientes").select("*", { count: 'exact', head: true }).eq("activo", "activo"),
        supabase.from("clientes").select("*", { count: 'exact', head: true }).eq("activo", "inactivo"),
        supabase.from("clientes").select("*", { count: 'exact', head: true }).eq("activo", "suspendido"),
        supabase.from("clientes").select("*", { count: 'exact', head: true }).eq("activo", "potencial"),
      ]);
      
      setStats({
        total: resTotal.count || 0,
        activo: resActivos.count || 0,
        inactivo: resInactivos.count || 0,
        suspendido: resSusp.count || 0,
        potencial: resPot.count || 0
      });
    } catch (err) { 
      console.error(err); 
    }
  }, [canView]);

  const fetchClientes = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      let query = supabase.from("clientes").select("*", { count: 'exact' });
      
      if (statusFilter) query = query.eq("activo", statusFilter);

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
  }, [currentPage, statusFilter, loadStats, canView]);

  useEffect(() => { 
    if (!authLoading) {
      fetchClientes(); 
    }
  }, [fetchClientes, authLoading]);

  const handleToggleStatus = async (cliente: any) => {
    if (!canEdit) {
      toast.error("No tienes permisos para cambiar el estado");
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const nuevoEstado = cliente.activo === 'activo' ? 'inactivo' : 'activo';
     
      const { error } = await (supabase.from("clientes") as any)
        .update({ activo: nuevoEstado })
        .eq("id", cliente.id);

      if (error) throw error;
      toast.success(`Cliente actualizado a ${nuevoEstado}`);
      fetchClientes();
    } catch (err) { 
      toast.error("No se pudo cambiar el estado"); 
    }
  };

  const handleEdit = (cliente: any) => {
    if (!canEdit) {
      toast.error("No tienes permisos para editar clientes");
      return;
    }
    setSelectedCliente(cliente);
    setDialogMode("edit");
  };

  const handleDeleteTrigger = (cliente: any) => {
    if (!canDelete) {
      toast.error("No tienes permisos para eliminar clientes");
      return;
    }
    setSelectedCliente(cliente);
    setDialogMode("delete");
  };

  const handleExportExcel = () => {
    if (!canExport) {
      toast.error("No tienes permisos para exportar");
      return;
    }
    if (clientes.length === 0) return toast.error("No hay datos para exportar");
    
    const dataToExport = clientes.map(c => ({
      "Razón Social": c.razon_social,
      "RUC": c.ruc,
      "Correo": c.email,
      "Teléfono": c.telefono,
      "Dirección": c.direccion,
      "Estado": c.activo?.toUpperCase() || "SIN ESTADO",
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

  const currentTotalForPagination = statusFilter ? (stats as any)[statusFilter] : stats.total;
  const totalPages = Math.ceil(currentTotalForPagination / pageSize);

  // Mientras se cargan los permisos
  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Verificando permisos...</p>
      </div>
    );
  }

  // Sin permisos de visualización
  if (!canView) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500">No tienes permisos para ver el directorio de clientes</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Directorio de Clientes
            </h1>
            <p className="text-gray-500 text-sm">Gestión de base de datos GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            {canExport && (
              <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 transition-all active:scale-95">
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard 
            title="TOTAL" 
            value={stats.total} 
            icon={<Users className="w-5 h-5" />} 
            isActive={statusFilter === null} 
            color="pink" 
            onClick={() => {setStatusFilter(null); setCurrentPage(0);}} 
          />
          <StatCard 
            title="ACTIVOS" 
            value={stats.activo} 
            icon={<UserCheck className="w-5 h-5" />} 
            isActive={statusFilter === 'activo'} 
            color="emerald" 
            onClick={() => {setStatusFilter('activo'); setCurrentPage(0);}} 
          />
          <StatCard 
            title="INACTIVOS" 
            value={stats.inactivo} 
            icon={<UserMinus className="w-5 h-5" />} 
            isActive={statusFilter === 'inactivo'} 
            color="orange" 
            onClick={() => {setStatusFilter('inactivo'); setCurrentPage(0);}} 
          />
          <StatCard 
            title="SUSPENDIDOS" 
            value={stats.suspendido} 
            icon={<Ban className="w-5 h-5" />} 
            isActive={statusFilter === 'suspendido'} 
            color="red" 
            onClick={() => {setStatusFilter('suspendido'); setCurrentPage(0);}} 
          />
          <StatCard 
            title="POTENCIALES" 
            value={stats.potencial} 
            icon={<Star className="w-5 h-5" />} 
            isActive={statusFilter === 'potencial'} 
            color="blue" 
            onClick={() => {setStatusFilter('potencial'); setCurrentPage(0);}} 
          />
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por razón social o RUC..." 
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
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
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sincronizando clientes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ClientesTable 
              data={filteredClientes} 
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
              onToggleStatus={handleToggleStatus}
            />
            
            {/* Paginación */}
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
      {canEdit && selectedCliente && dialogMode === "edit" && (
        <EditClienteDialog 
          isOpen={true} 
          onClose={() => {setDialogMode(null); setSelectedCliente(null);}} 
          onSuccess={fetchClientes} 
          cliente={selectedCliente} 
        />
      )}
      {canDelete && selectedCliente && dialogMode === "delete" && (
        <DeleteClienteDialog 
          isOpen={true} 
          onClose={() => {setDialogMode(null); setSelectedCliente(null);}} 
          onSuccess={fetchClientes} 
          cliente={selectedCliente} 
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    pink: { 
      active: "border-pink-500 ring-pink-50 bg-white", 
      iconActive: "bg-pink-600 text-white",
      iconInactive: "bg-gray-100 text-gray-600",
      textActive: "text-pink-600",
      textInactive: "text-gray-800"
    },
    emerald: { 
      active: "border-emerald-500 ring-emerald-50 bg-white", 
      iconActive: "bg-emerald-600 text-white",
      iconInactive: "bg-gray-100 text-gray-600",
      textActive: "text-emerald-600",
      textInactive: "text-gray-800"
    },
    orange: { 
      active: "border-orange-500 ring-orange-50 bg-white", 
      iconActive: "bg-orange-600 text-white",
      iconInactive: "bg-gray-100 text-gray-600",
      textActive: "text-orange-600",
      textInactive: "text-gray-800"
    },
    red: { 
      active: "border-red-500 ring-red-50 bg-white", 
      iconActive: "bg-red-600 text-white",
      iconInactive: "bg-gray-100 text-gray-600",
      textActive: "text-red-600",
      textInactive: "text-gray-800"
    },
    blue: { 
      active: "border-blue-500 ring-blue-50 bg-white", 
      iconActive: "bg-blue-600 text-white",
      iconInactive: "bg-gray-100 text-gray-600",
      textActive: "text-blue-600",
      textInactive: "text-gray-800"
    }
  };

  const currentStyle = styles[color] || styles.pink;

  return (
    <button 
      onClick={onClick} 
      className={`group p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer ${
        isActive 
          ? `ring-4 shadow-xl scale-[1.02] z-10 ${currentStyle.active}` 
          : 'bg-white border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95'
      }`}
    >
      <div className={`p-2 rounded-lg transition-all duration-300 ${
        isActive ? `${currentStyle.iconActive} rotate-3` : `${currentStyle.iconInactive} group-hover:rotate-3`
      }`}>
        {icon}
      </div>
      <div className="text-left overflow-hidden"> 
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest truncate">{title}</p>
        <p className={`text-xl font-black tracking-tight ${isActive ? currentStyle.textActive : currentStyle.textInactive}`}>
          {value}
        </p>
      </div>
    </button>
  );
}