"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Search, Users, ShieldCheck, RefreshCw, UserCheck, Loader2, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UsuariosTable } from "@/components/admin/usuarios/UsuarioTable";
import { Database } from "@/types/supabase.types";
import { toast } from "sonner";
import { usePermissions } from "@/lib/hooks/usePermissions";

type Usuario = Database['public']['Tables']['usuarios']['Row'];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Cargamos el hook de permisos
  const { can, isLoading: authLoading } = usePermissions();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/usuarios');
      if (!response.ok) throw new Error(`Error ${response.status}: API no encontrada`);
      const data = await response.json();
      setUsuarios(data);
    } catch (error: any) {
      toast.error(error.message || "Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    let isMounted = true;

    if (!authLoading && can && can('view', 'usuarios')) {
      if (isMounted) fetchUsuarios(); 
    }

    return () => { isMounted = false; };
  }, [authLoading, can, fetchUsuarios]);

  // Estadísticas calculadas
  const stats = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => String(u.estado).toUpperCase() === 'ACTIVO').length,
    admins: usuarios.filter(u => (u.rol as string).toLowerCase() === 'administrador').length,
  }), [usuarios]);

  // Filtrado
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(u => {
      const matchesSearch = u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? String(u.estado).toUpperCase() === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [usuarios, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredUsuarios.length / pageSize);
  const paginatedData = filteredUsuarios.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // Bloqueo de seguridad
  if (authLoading) return <LoadingScreen />;
  if (!can('view', 'usuarios')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-pink-600" /> Control de Usuarios
            </h1>
            <p className="text-gray-500 text-sm">Personal autorizado y niveles de acceso GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={fetchUsuarios} variant="outline" className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-bold gap-2 h-11 transition-all active:scale-95">
              <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
            
            {can('create', 'usuarios') && (
              <Button className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 transition-all active:scale-95">
                <Plus className="w-5 h-5" /> Nuevo Usuario
              </Button>
            )}
          </div>
        </div>

        {/* Cartas de Estadísticas */}
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
            isActive={statusFilter === 'ACTIVO'} 
            color="emerald" 
            onClick={() => {setStatusFilter('ACTIVO'); setCurrentPage(0);}} 
          />
          <StatCard 
            title="ADMINISTRADORES" 
            value={stats.admins} 
            icon={<ShieldCheck className="w-6 h-6" />} 
            isActive={false} 
            color="orange" 
            onClick={() => {}} 
          />
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por nombre, email o cargo..." 
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
            />
          </div>
          <Button variant="outline" className="h-11 border-gray-200" onClick={fetchUsuarios}>
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          </Button>
        </div>

        {/* Tabla con Acciones Condicionales */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            <UsuariosTable 
              usuarios={paginatedData} 
              onEdit={can('edit', 'usuarios') ? (u: any) => console.log('Edit', u) : undefined}
              onDelete={can('delete', 'usuarios') ? (u: any) => console.log('Delete', u) : undefined}
              onToggleStatus={can('edit', 'usuarios') ? (u: any) => console.log('Status', u) : undefined}
            />

            {/* Paginación */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de <span className="font-bold text-gray-900">{filteredUsuarios.length}</span>
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
    </div>
  );
}

// --- Componentes Auxiliares ---

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
      <p className="text-sm font-bold text-gray-400 uppercase">Verificando credenciales...</p>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 uppercase">Acceso Restringido</h2>
      <p className="text-gray-500 max-w-sm mt-2">No tienes los privilegios necesarios para gestionar el personal del sistema.</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border animate-pulse">
      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Cargando Personal...</p>
    </div>
  );
}

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
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