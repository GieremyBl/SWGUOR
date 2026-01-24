"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Search, Users, ShieldCheck, RefreshCcw, UserCheck, Loader2 } from "lucide-react";
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

  // 1. Cargamos el hook de permisos
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

  if (!authLoading && can('view', 'usuarios')) {
    if (isMounted) fetchUsuarios(); 
  }

  return () => { isMounted = false; };

}, [authLoading, can]);

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

  // 2. Bloqueo de seguridad: Si no está autorizado, no mostramos nada
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
            <p className="text-gray-500 text-sm italic">Personal autorizado y niveles de acceso GUOR</p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={fetchUsuarios} variant="outline" className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50 font-bold gap-2 h-11">
              <RefreshCcw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
            
            {/* 3. Permiso: Crear Usuario */}
            {can('create', 'usuarios') && (
              <Button className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 transition-all active:scale-95">
                <Plus className="w-5 h-5" /> NUEVO USUARIO
              </Button>
            )}
          </div>
        </div>

        {/* Cartas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="TOTAL EQUIPO" value={stats.total} icon={<Users />} isActive={statusFilter === null} color="pink" onClick={() => setStatusFilter(null)} />
          <StatCard title="SISTEMA ACTIVO" value={stats.activos} icon={<UserCheck />} isActive={statusFilter === 'ACTIVO'} color="emerald" onClick={() => setStatusFilter('ACTIVO')} />
          <StatCard title="ADMINS" value={stats.admins} icon={<ShieldCheck />} isActive={statusFilter === 'ADMIN'} color="orange" onClick={() => setStatusFilter(null)} />
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por nombre, email o cargo..." 
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla con Acciones Condicionales */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            <UsuariosTable 
              usuarios={filteredUsuarios} 
              onEdit={can('edit', 'usuarios') ? (u: any) => console.log('Edit', u) : undefined}
              onDelete={can('delete', 'usuarios') ? (u: any) => console.log('Delete', u) : undefined}
              onToggleStatus={can('edit', 'usuarios') ? (u: any) => console.log('Status', u) : undefined}
            />
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm text-xs text-gray-500">
              Mostrando <span className="font-bold text-gray-900">{filteredUsuarios.length}</span> colaboradores
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
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <div className="p-6 bg-red-50 rounded-full text-red-600">
        <ShieldCheck size={48} />
      </div>
      <h2 className="text-xl font-black text-slate-800 uppercase">Acceso Restringido</h2>
      <p className="text-slate-500 max-w-xs text-center">No tienes los privilegios necesarios para gestionar el personal del sistema.</p>
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
    pink: { active: "border-pink-500 ring-pink-50", iconActive: "bg-pink-600 text-white", textActive: "text-pink-600" },
    emerald: { active: "border-emerald-500 ring-emerald-50", iconActive: "bg-emerald-600 text-white", textActive: "text-emerald-600" },
    orange: { active: "border-orange-500 ring-orange-50", iconActive: "bg-orange-600 text-white", textActive: "text-orange-600" }
  };
  const currentStyle = styles[color];

  return (
    <button onClick={onClick} className={`p-4 rounded-xl border transition-all flex items-center gap-4 ${isActive ? `ring-4 shadow-xl scale-[1.02] bg-white ${currentStyle.active}` : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className={`p-3 rounded-lg ${isActive ? currentStyle.iconActive : 'bg-gray-100 text-gray-600'}`}> {icon} </div>
      <div className="text-left"> 
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black ${isActive ? currentStyle.textActive : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}