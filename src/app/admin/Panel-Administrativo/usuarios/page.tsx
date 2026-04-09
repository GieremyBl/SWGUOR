"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Search, Users, RefreshCw, UserCheck, UserMinus, ChevronLeft, ChevronRight, ShieldCheck, Plus, ShieldAlert } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Database } from "@/types/database";
type EstadoUsuario = Database['public']['Enums']['EstadoUsuario'];

// Componentes dinámicos
const UsuariosTable = dynamic(() => import("@/components/admin/usuarios/UsuarioTable"));
const EditUsuarioDialog = dynamic(() => import("@/components/admin/usuarios/EditUsuarioDialog"));
const CreateUsuarioDialog = dynamic(() => import("@/components/admin/usuarios/CreateUsuarioDialog"));
const DeleteUsuarioDialog = dynamic(() => import("@/components/admin/usuarios/DeleteUsuarioDialog"));

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "new" | "delete" | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<EstadoUsuario | null>(null);
  const pageSize = 10;

  // Stats 
  const [stats, setStats] = useState({ 
    total: 0, 
    activo: 0, 
    inactivo: 0, 
    administrador: 0, 
    taller: 0 
  });

  const loadStats = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const [resTotal, resActivos, resInactivos, resAdmins, resTaller] = await Promise.all([
        supabase.from("usuarios").select("*", { count: 'exact', head: true }),
        supabase.from("usuarios").select("*", { count: 'exact', head: true }).eq("estado", "activo"),
        supabase.from("usuarios").select("*", { count: 'exact', head: true }).eq("estado", "inactivo"),
        supabase.from("usuarios").select("*", { count: 'exact', head: true }).eq("rol", "administrador"),
        supabase.from("usuarios").select("*", { count: 'exact', head: true }).eq("rol", "representante_taller"),
      ]);
      
      setStats({
        total: resTotal.count || 0,
        activo: resActivos.count || 0,
        inactivo: resInactivos.count || 0,
        administrador: resAdmins.count || 0,
        taller: resTaller.count || 0
      });
    } catch (err) { console.error(err); }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      let query = supabase.from("usuarios").select("*", { count: 'exact' });
      
      // Filtro de estado (activo/inactivo)
      if (statusFilter) query = query.eq("estado", statusFilter);

      const from = currentPage * pageSize;
      const { data, error } = await query
        .order("nombre_completo", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      setUsuarios(data || []);
      loadStats(); 
    } catch (err) {
      toast.error("Error al sincronizar personal");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, loadStats]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  // Manejadores de acciones
  const handleToggleStatus = async (usuario: any) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
      const { error } = await (supabase.from("usuarios") as any)
        .update({ estado: nuevoEstado })
        .eq("id", usuario.id);

      if (error) throw error;
      toast.success(`Estado actualizado a ${nuevoEstado}`);
      fetchUsuarios();
    } catch (err) { toast.error("No se pudo cambiar el estado"); }
  };

  const handleEdit = (usuario: any) => {
    setSelectedUsuario(usuario);
    setDialogMode("edit");
  };

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(u => 
      u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usuarios, searchTerm]);

  const currentTotalForPagination = statusFilter ? (stats as any)[statusFilter] : stats.total;
  const totalPages = Math.ceil(currentTotalForPagination / pageSize);

  const { can, isLoading: authLoading } = usePermissions();

  if (!authLoading && !can('view', 'usuarios')) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Acceso Denegado</h2>
        <p className="text-gray-500 max-w-sm mt-2">No tienes permisos para gestionar el personal.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header idéntico a Clientes */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Personal
            </h1>
            <p className="text-gray-500 text-sm">Control de accesos y roles GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={fetchUsuarios} variant="outline" className="cursor-pointer bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-bold gap-2 h-11 transition-all active:scale-95">
              <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
            
            {can('create', 'usuarios') && (
              <Button 
                onClick={() => setDialogMode("new")}
                className="cursor-pointer bg-pink-600 hover:bg-pink-700 text-white shadow-lg font-bold gap-2 h-11 transition-all active:scale-95 px-6"
              >
                <Plus className="w-5 h-5" /> Nuevo Usuario
              </Button>
            )}
          </div>
        </div>

        {/* Cartas de Stats (5 Columnas como en Clientes) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard title="TOTAL" value={stats.total} icon={<Users className="w-5 h-5" />} isActive={statusFilter === null} color="pink" onClick={() => {setStatusFilter(null); setCurrentPage(0);}} />
          <StatCard title="ACTIVOS" value={stats.activo} icon={<UserCheck className="w-5 h-5" />} isActive={statusFilter === 'activo'} color="emerald" onClick={() => {setStatusFilter('activo'); setCurrentPage(0);}} />
          <StatCard title="INACTIVOS" value={stats.inactivo} icon={<UserMinus className="w-5 h-5" />} isActive={statusFilter === 'inactivo'} color="orange" onClick={() => {setStatusFilter('inactivo'); setCurrentPage(0);}} />
          <StatCard title="ADMINS" value={stats.administrador} icon={<ShieldCheck className="w-5 h-5" />} isActive={false} color="blue" onClick={() => {}} />
          <StatCard title="TALLER" value={stats.taller} icon={<Users className="w-5 h-5" />} isActive={false} color="red" onClick={() => {}} />
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input 
              placeholder="Buscar por nombre, email o cargo..." 
              className="w-full pl-10 h-11 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
            />
          </div>
        </div>

        {/* Tabla */}
        {!loading && (
          <UsuariosTable 
            usuarios={filteredUsuarios} 
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={(u: any) => {
              setSelectedUsuario(u);
              setDialogMode("delete");
            }}
          />
        )}

        <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500">
            Mostrando <span className="font-bold text-gray-900">{usuarios.length}</span> de <span className="font-bold text-gray-900">{currentTotalForPagination}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border rounded-lg flex items-center">
              Página {currentPage + 1} de {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Diálogos Dinámico */}
      <CreateUsuarioDialog 
        isOpen={dialogMode === "new"} 
        onClose={() => setDialogMode(null)} 
        onSuccess={fetchUsuarios} 
      />
      
      {selectedUsuario && dialogMode === "edit" && (
        <EditUsuarioDialog 
          isOpen={true} 
          onClose={() => {setDialogMode(null); setSelectedUsuario(null);}} 
          onSuccess={fetchUsuarios} 
          usuario={selectedUsuario} 
        />
      )}

      {selectedUsuario && dialogMode === "delete" && (
        <DeleteUsuarioDialog 
          isOpen={true}
          onClose={() => {setDialogMode(null); setSelectedUsuario(null);}}
          onSuccess={fetchUsuarios}
          usuario={selectedUsuario}
        />
      )}
    </div>
  );
}

// StatCard con cursor-pointer 
function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    pink: { active: "border-pink-500 ring-pink-50 bg-white", icon: "bg-pink-600 text-white", text: "text-pink-600" },
    emerald: { active: "border-emerald-500 ring-emerald-50 bg-white", icon: "bg-emerald-600 text-white", text: "text-emerald-600" },
    orange: { active: "border-orange-500 ring-orange-50 bg-white", icon: "bg-orange-600 text-white", text: "text-orange-600" },
    red: { active: "border-red-500 ring-red-50 bg-white", icon: "bg-red-600 text-white", text: "text-red-600" },
    blue: { active: "border-blue-500 ring-blue-50 bg-white", icon: "bg-blue-600 text-white", text: "text-blue-600" }
  };
  const currentStyle = styles[color] || styles.pink;

  return (
    <button onClick={onClick} className={`group p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer ${isActive ? `ring-4 shadow-md scale-[1.02] ${currentStyle.active}` : 'bg-white border-gray-100 hover:shadow-md active:scale-95'}`}>
      <div className={`p-2 rounded-lg ${isActive ? currentStyle.icon : 'bg-gray-100 text-gray-600'}`}> {icon} </div>
      <div className="text-left overflow-hidden"> 
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter truncate">{title}</p>
        <p className={`text-xl font-black ${isActive ? currentStyle.text : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}