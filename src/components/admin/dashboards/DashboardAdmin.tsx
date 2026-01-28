"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, UserPlus, Building2, FileText, Package, 
  TrendingUp, Download, Settings, BarChart3, ShoppingCart, 
  AlertCircle, ArrowRight, ShieldCheck
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useRouter } from 'next/navigation';

interface ActividadReciente {
  action: string;
  user: string;
  time: string;
  rol: string;
  type: 'success' | 'info' | 'warning';
}

interface PedidoData {
  total: number | string | null;
}

interface StatsState {
  usuarios: number;
  clientes: number;
  talleres: number;
  pedidosActivos: number;
  productosInventario: number;
  ventasMes: string;
  productosConFicha: number; 
  totalProductos: number;
}

// Función para asignar colores según el rol
const getRoleBadgeColor = (rol: string) => {
  const roles: Record<string, string> = {
    administrador: 'bg-slate-900 text-white shadow-sm',
    recepcionista: 'bg-blue-600 text-white shadow-sm',
    diseñador: 'bg-rose-600 text-white shadow-sm',
    cortador: 'bg-orange-600 text-white shadow-sm',
    ayudante: 'bg-emerald-600 text-white shadow-sm',
    representante_taller: 'bg-violet-700 text-white shadow-sm'
  };
  return roles[rol.toLowerCase()] || 'bg-gray-100 text-gray-600';
};

export default function AdminDashboard({ usuario }: { usuario: any }) {
  const router = useRouter();
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [stats, setStats] = useState<StatsState & { stockBajo: number }> ({
    usuarios: 0, clientes: 0, talleres: 0, pedidosActivos: 0,
    productosInventario: 0, ventasMes: 'S/ 0.00', productosConFicha: 0,
    totalProductos: 0, stockBajo: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActividadReciente[]>([]);
  const [loading, setLoading] = useState(true);

  const getTimeAgo = useCallback((date: string): string => {
    if (!date) return 'Sin registros';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Ahora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }, []);

  // 1. FUNCIÓN PARA ACTUALIZAR MI PROPIO ACCESO (FRONTEND)
  const updateMyLastAccess = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      await supabase
        .from('usuarios')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', session.user.id);
    }
  }, []);


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        { count: userCount },
        { count: clientCount },
        { count: workshopCount },
        { count: orderCount },
        { count: productCount },
        { data: lowStockData },
        { data: salesData },
        { data: fichasData },
        { data: accessData }
      ] = await Promise.all([
        supabase.from('usuarios').select('id', { count: 'exact'}),
        supabase.from('clientes').select('id', { count: 'exact'}),
        supabase.from('talleres').select('id', { count: 'exact'}),
        supabase.from('pedidos').select('id', { count: 'exact', head: false }).neq('estado', 'completado'),
        supabase.from('productos').select('id', { count: 'exact'}),
        supabase.from('productos').select('id').lte('stock', 400),
        supabase.from('pedidos').select('total').gte('created_at', startOfMonth.toISOString()),
        supabase.from('productos').select('ficha_url'),
        supabase.from('usuarios').select('nombre_completo, email, ultimo_acceso, created_at, rol').order('ultimo_acceso', { ascending: false, nullsFirst: false }).limit(5)
      ]);

      setStats({
        usuarios: userCount || 0,
        clientes: clientCount || 0,
        talleres: workshopCount || 0,
        pedidosActivos: orderCount || 0,
        productosInventario: productCount || 0,
        stockBajo: lowStockData?.length || 0,
        ventasMes: `S/ ${(salesData as PedidoData[] | null)?.reduce((sum, p) => sum + (Number(p.total) || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        productosConFicha: (fichasData as any[])?.filter(p => p.ficha_url).length || 0,
        totalProductos: productCount || 0 
      });

      if (accessData) {
        
        setRecentActivity((accessData as any[]).map((u) => {
          const fechaAMostrar = u.ultimo_acceso || u.created_at;

          return {
            action: u.ultimo_acceso ? 'Última conexión' : 'Usuario registrado',
            user: u.nombre_completo || u.email.split('@')[0],
            rol: u.rol || 'Sin rol',
            time: getTimeAgo(fechaAMostrar),
            type: 'success'
          };
        }));
      }
    } catch (error) {
      console.error('Error dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [getTimeAgo]);

// 2. EFECTO INICIAL: ACTUALIZAR ACCESO Y LUEGO CARGAR TODO
  useEffect(() => {
    const init = async () => {
      await updateMyLastAccess();
      await fetchDashboardData(); 
    };
    init();
  }, [updateMyLastAccess, fetchDashboardData]);

  // ... (useMemo para quickActions y modules se mantienen igual)
  const quickActions = useMemo(() => [
    { icon: UserPlus, label: 'Nuevo Usuario', color: 'bg-blue-600', path: '/admin/Panel-Administrativo/usuarios', show: can('create', 'usuarios') },
    { icon: Building2, label: 'Registrar Taller', color: 'bg-violet-600', path: '/admin/Panel-Administrativo/talleres', show: can('create', 'talleres') },
    { icon: Download, label: 'Reporte Excel', color: 'bg-amber-600', path: '', show: can('export', 'reportes') },
  ].filter(a => a.show), [can]);

  const modules = useMemo(() => [
    { icon: Users, title: 'Usuarios', count: stats.usuarios, color: 'text-blue-600', bgColor: 'bg-blue-50', path: '/admin/Panel-Administrativo/usuarios', show: can('view', 'usuarios') },
    { icon: Users, title: 'Clientes', count: stats.clientes, color: 'text-emerald-600', bgColor: 'bg-emerald-50', path: '/admin/Panel-Administrativo/clientes', show: can('view', 'clientes') },
    { icon: Building2, title: 'Talleres', count: stats.talleres, color: 'text-violet-600', bgColor: 'bg-violet-50', path: '/admin/Panel-Administrativo/talleres', show: can('view', 'talleres') },
    { icon: ShoppingCart, title: 'Pedidos Activos', count: stats.pedidosActivos, color: 'text-orange-600', bgColor: 'bg-orange-50', path: '/admin/Panel-Administrativo/pedidos', show: can('view', 'pedidos') },
    { icon: Package, title: 'Inventario Total', count: stats.productosInventario, color: 'text-indigo-600', bgColor: 'bg-indigo-50', path: '/admin/Panel-Administrativo/productos', show: can('view', 'inventario') },
    { icon: TrendingUp, title: 'Ingresos Mensuales', count: stats.ventasMes, color: 'text-pink-600', bgColor: 'bg-pink-50', path: '', show: can('view', 'reportes') },
  ].filter(m => m.show), [stats, can]);

  if (permissionsLoading || loading) return <LoadingDashboard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* TÍTULO BIENVENIDA */}
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">
        Bienvenido, <span>{usuario?.nombre_completo?.split(' ')[0] || "Usuario"}</span>
      </h1>

      {/* ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
          <button key={idx} onClick={() => router.push(action.path)} className={`${action.color} text-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col gap-3 group`}>
            <action.icon className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-wider">{action.label}</span>
          </button>
        ))}
      </div>

      {/* MÓDULOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module, idx) => (
          <button key={idx} onClick={() => router.push(module.path)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative text-left">
            <div className={`${module.bgColor} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
              <module.icon className={`w-6 h-6 ${module.color}`} />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{module.title}</h3>
            <p className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{module.count}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* HISTORIAL ACTUALIZADO */}
        <CardContainer title="Historial de Acceso" icon={<ShieldCheck className="text-slate-400" />}>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-sm shadow-md">
                    {activity.user[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-900 uppercase leading-none mb-2">{activity.user}</p>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${getRoleBadgeColor(activity.rol)}`}>
                      {activity.rol.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Última Actividad</p>
                  <span className={`text-[11px] font-black px-3 py-1 rounded-lg shadow-sm border ${activity.time === 'AHORA' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-900 border-slate-200'}`}>
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>

        <CardContainer title="Operatividad Taller" icon={<BarChart3 className="text-slate-400" />}>
          <div className="space-y-6 pt-2">
            <ProgressBar label="Eficiencia Producción" value={88} color="bg-rose-500" />
            <ProgressBar label="Cumplimiento Entregas" value={94} color="bg-emerald-500" />
            <ProgressBar label="Capacidad Logística" value={72} color="bg-indigo-500" />
          </div>
        </CardContainer>
      </div>
    </div>
  );
}

// Sub-componentes (CardContainer, ProgressBar, LoadingDashboard) se mantienen igual...
function CardContainer({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
        {icon}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-gray-600">{label}</span>
        <span className={color.replace('bg-', 'text-')}>{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-full border-4 border-pink-50 border-t-pink-600 animate-spin mb-4" />
      <p className="font-black text-gray-900 text-lg uppercase tracking-tighter">Sincronizando GUOR...</p>
    </div>
  );
}