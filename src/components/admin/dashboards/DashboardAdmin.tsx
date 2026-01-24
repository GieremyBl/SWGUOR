"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, UserPlus, Building2, FileText, Package, 
  TrendingUp, Download, Settings, BarChart3, ShoppingCart, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useRouter } from 'next/navigation';

interface ActividadReciente {
  action: string;
  user: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

// Tipos para las respuestas de base de datos
interface PedidoData {
  total: number | string | null;
}

interface UsuarioData {
  nombre_completo: string | null;
  email: string;
  created_at: string;
}

interface StatsState {
  usuarios: number;
  clientes: number;
  talleres: number;
  pedidosActivos: number;
  productosInventario: number;
  ventasMes: string;
}

interface QuickAction {
  icon: any;
  label: string;
  color: string;
  path: string;
  show: boolean;
}
interface ModuleItem {
  icon: any;
  title: string;
  count: string | number;
  color: string;
  bgColor: string;
  path: string;
  show: boolean;
  alert?: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [stats, setStats] = useState<StatsState & { stockBajo: number }> ({
    usuarios: 0,
    clientes: 0,
    talleres: 0,
    pedidosActivos: 0,
    productosInventario: 0,
    ventasMes: 'S/ 0.00',
    stockBajo: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActividadReciente[]>([]);
  const [loading, setLoading] = useState(true);

  const getTimeAgo = useCallback((date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Lanzamos todas las peticiones al mismo tiempo
      const [
        { count: userCount },
        { count: clientCount },
        { count: workshopCount },
        { count: orderCount },
        { count: productCount },
        { data: lowStockData },
        { data: salesData },
        { data: activityData },
      ] = await Promise.all([
        supabase.from('usuarios').select('id', { count: 'exact'}),
        supabase.from('clientes').select('id', { count: 'exact'}),
        supabase.from('talleres').select('id', { count: 'exact'}),
        supabase.from('pedidos').select('id', { count: 'exact', head: false }).neq('estado', 'completado'),
        supabase.from('productos').select('id', { count: 'exact'}),
        supabase.from('productos').select('id').lte('stock', 400),
        supabase.from('pedidos').select('total').gte('created_at', startOfMonth.toISOString()),
        supabase.from('usuarios').select('nombre_completo, created_at, email').order('created_at', { ascending: false }).limit(5)
      ]);

       const totalVentas = (salesData as PedidoData[] | null)?.reduce(
        (sum: number, p: PedidoData) => sum + (Number(p.total) || 0), 
        0
      ) || 0;

      setStats({
        usuarios: userCount || 0,
        clientes: clientCount || 0,
        talleres: workshopCount || 0,
        pedidosActivos: orderCount || 0,
        productosInventario: productCount || 0,
        stockBajo: lowStockData?.length || 0,
        ventasMes: `S/ ${totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
      });

     if (activityData) {
        setRecentActivity((activityData as UsuarioData[]).map((u: UsuarioData) => ({
          action: 'Nuevo acceso concedido',
          user: u.nombre_completo || u.email,
          time: getTimeAgo(u.created_at),
          type: 'success'
        })));
      }
    } catch (error) {
      console.error('Error dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [getTimeAgo]);

 useEffect(() => {
  let isMounted = true;
  if (isMounted) {
    fetchDashboardData();
  }
  return () => { isMounted = false; };
}, [fetchDashboardData]);

  const quickActions = useMemo<QuickAction[]>(() => [
    { icon: UserPlus, label: 'Nuevo Usuario', color: 'bg-blue-600', path: '/admin/Panel-Administrativo/usuarios', show: can('create', 'usuarios') },
    { icon: Building2, label: 'Registrar Taller', color: 'bg-violet-600',path: '/admin/Panel-Administrativo/talleres', show: can('create', 'talleres') },
    { icon: Download, label: 'Reporte Excel', color: 'bg-amber-600',path: '', show: can('export', 'reportes') },
  ].filter(a => a.show), [can]);

  const modules = useMemo<ModuleItem[]>(() => [
    { icon: Users, title: 'Usuarios', count: stats.usuarios, color: 'text-blue-600', bgColor: 'bg-blue-50',path: '/admin/Panel-Administrativo/usuarios', show: can('view', 'usuarios') },
    { icon: Users, title: 'Clientes', count: stats.clientes, color: 'text-emerald-600', bgColor: 'bg-emerald-50',path: '/admin/Panel-Administrativo/clientes', show: can('view', 'clientes') },
    { icon: Building2, title: 'Talleres', count: stats.talleres, color: 'text-violet-600', bgColor: 'bg-violet-50', path: '/admin/Panel-Administrativo/talleres',show: can('view', 'talleres') },
    { icon: ShoppingCart, title: 'Pedidos Activos', count: stats.pedidosActivos, color: 'text-orange-600', bgColor: 'bg-orange-50', path: '/admin/Panel-Administrativo/pedidos', show: can('view', 'pedidos') },
    { icon: Package, title: 'Inventario Total', count: stats.productosInventario, color: 'text-indigo-600', bgColor: 'bg-indigo-50',path: '/admin/Panel-Administrativo/productos', show: can('view', 'inventario') },
    { icon: TrendingUp, title: 'Ingresos Mensuales', count: stats.ventasMes, color: 'text-pink-600', bgColor: 'bg-pink-50',path: '', show: can('view', 'reportes') },
    { icon: Package, title: 'Stock Bajos', count: stats.productosInventario, color: 'text-indigo-600', bgColor: 'bg-indigo-50', path: '/admin/Panel-Administrativo/productos', alert: stats.stockBajo > 0 ? `${stats.stockBajo} Críticos` : null, show: can('view', 'inventario') },
  ].filter(m => m.show), [stats, can]);

  if (permissionsLoading || loading) return <LoadingDashboard />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Acciones Rápidas */}
      {quickActions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => router.push(action.path)}
              className={`${action.color} text-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col gap-3 group`}
            >
              <action.icon className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs uppercase tracking-wider">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Módulos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module, idx) => (
          <button
            key={idx}
            onClick={() => router.push(module.path)}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative text-left"
          >
            {module.alert && (
              <div className="absolute top-6 right-6 flex items-center gap-1 bg-rose-100 text-rose-600 px-2 py-1 rounded-full animate-pulse">
                <AlertCircle size={12} />
                <span className="text-[10px] font-black uppercase">{module.alert}</span>
              </div>
            )}
            <div className={`${module.bgColor} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
              <module.icon className={`w-6 h-6 ${module.color}`} />
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{module.title}</h3>
            <p className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{module.count}</p>
            <div className="mt-4 flex items-center text-[10px] font-black text-pink-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Gestionar <ArrowRight size={14} className="ml-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Actividad y Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardContainer title="Historial de Acceso" icon={<FileText className="text-slate-300" />}>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                    {activity.user[0]}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase">{activity.user}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{activity.action}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-300">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContainer>

        <CardContainer title="Operatividad Taller" icon={<BarChart3 className="text-slate-300" />}>
          <div className="space-y-6">
            <ProgressBar label="Eficiencia Producción" value={88} color="bg-pink-500" />
            <ProgressBar label="Cumplimiento Entregas" value={94} color="bg-emerald-500" />
            <ProgressBar label="Capacidad Logística" value={72} color="bg-violet-500" />
          </div>
        </CardContainer>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES PARA LIMPIEZA DE CÓDIGO ---

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
      <div className="relative mb-4">
        <div className="h-16 w-16 rounded-full border-4 border-pink-50 border-t-pink-600 animate-spin" />
        <Settings className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-pink-600 w-6 h-6 animate-pulse" />
      </div>
      <p className="font-black text-gray-900 text-lg">Sincronizando GUOR...</p>
      <p className="text-gray-400 text-sm">Preparando métricas en tiempo real</p>
    </div>
  );
}