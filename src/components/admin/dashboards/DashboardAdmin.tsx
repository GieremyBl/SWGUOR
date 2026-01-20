"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, UserPlus, Building2, FileText, Package, 
  TrendingUp, Download, Settings, BarChart3, ShoppingCart 
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePermissions } from '@/lib/hooks/usePermissions';

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

export default function AdminDashboard() {
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [stats, setStats] = useState<StatsState>({
    usuarios: 0,
    clientes: 0,
    talleres: 0,
    pedidosActivos: 0,
    productosInventario: 0,
    ventasMes: 'S/ 0.00'
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
        { data: salesData },
        { data: activityData }
      ] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('talleres').select('*', { count: 'exact', head: true }),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).neq('estado', 'completado'),
        supabase.from('productos').select('*', { count: 'exact', head: true }),
        supabase.from('pedidos').select('total').gte('created_at', startOfMonth.toISOString()),
        supabase.from('usuarios').select('nombre_completo, created_at, email').order('created_at', { ascending: false }).limit(4)
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
        ventasMes: `S/ ${totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
      });

     if (activityData) {
        setRecentActivity((activityData as UsuarioData[]).map((u: UsuarioData) => ({
          action: 'Usuario registrado',
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
    fetchDashboardData();
  }, [fetchDashboardData]);

  const quickActions = useMemo(() => [
    { icon: UserPlus, label: 'Crear Usuario', color: 'bg-blue-600', show: can('create', 'usuarios') },
    { icon: Users, label: 'Crear Cliente', color: 'bg-emerald-600', show: can('create', 'clientes') },
    { icon: Building2, label: 'Registrar Taller', color: 'bg-violet-600', show: can('create', 'talleres') },
    { icon: Download, label: 'Exportar Reportes', color: 'bg-amber-600', show: can('export', 'reportes') },
  ].filter(a => a.show), [can]);

  const modules = useMemo(() => [
    { icon: Users, title: 'Usuarios', count: stats.usuarios, color: 'text-blue-600', bgColor: 'bg-blue-50', show: can('view', 'usuarios') },
    { icon: Users, title: 'Clientes', count: stats.clientes, color: 'text-emerald-600', bgColor: 'bg-emerald-50', show: can('view', 'clientes') },
    { icon: Building2, title: 'Talleres', count: stats.talleres, color: 'text-violet-600', bgColor: 'bg-violet-50', show: can('view', 'talleres') },
    { icon: ShoppingCart, title: 'Pedidos', count: stats.pedidosActivos, color: 'text-orange-600', bgColor: 'bg-orange-50', show: can('view', 'pedidos') },
    { icon: Package, title: 'Inventario', count: stats.productosInventario, color: 'text-indigo-600', bgColor: 'bg-indigo-50', show: can('view', 'inventario') },
    { icon: TrendingUp, title: 'Ventas del Mes', count: stats.ventasMes, color: 'text-pink-600', bgColor: 'bg-pink-50', show: can('view', 'reportes') },
  ].filter(m => m.show), [stats, can]);

  if (permissionsLoading || loading) return <LoadingDashboard />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 font-medium">Modas y Estilos GUOR - Gestión Administrativa</p>
        </header>

        {/* Acciones Rápidas con Efectos de Puntero */}
        {quickActions.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className={`${action.color} text-white p-4 rounded-xl shadow-sm cursor-pointer
                transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg
                flex items-center gap-4 group overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <action.icon className="w-6 h-6 shrink-0" />
                <span className="font-bold tracking-wide">{action.label}</span>
              </button>
            ))}
          </section>
        )}

        {/* Módulos / Stats con Hover dinámico */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 
            hover:shadow-md transition-all group cursor-pointer active:bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className={`${module.bgColor} p-3 rounded-xl transition-transform group-hover:scale-110`}>
                  <module.icon className={`w-6 h-6 ${module.color}`} />
                </div>
                <Settings className="w-5 h-5 text-gray-300 hover:text-gray-600 transition-colors" />
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">{module.title}</h3>
              <p className="text-3xl font-black text-gray-900 mt-1">{module.count}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-pink-600 group-hover:translate-x-1 transition-transform">
                Gestionar módulo <span className="ml-1">→</span>
              </div>
            </div>
          ))}
        </section>

        {/* Actividad y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Actividad Reciente */}
          <CardContainer title="Actividad Reciente" icon={<FileText className="text-gray-400" />}>
            {recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full mt-2 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{activity.action}</p>
                      <p className="text-xs text-gray-500 font-medium">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-10 italic">Sin movimientos recientes</p>
            )}
          </CardContainer>

          {/* Estadísticas Visuales */}
          <CardContainer title="Rendimiento del Sistema" icon={<BarChart3 className="text-gray-400" />}>
            <div className="space-y-6">
              <ProgressBar label="Eficiencia de Pedidos" value={stats.pedidosActivos > 0 ? 85 : 0} color="bg-pink-500" />
              <ProgressBar label="Retención de Clientes" value={stats.clientes > 0 ? 92 : 0} color="bg-emerald-500" />
              <ProgressBar label="Capacidad de Talleres" value={stats.talleres > 0 ? 70 : 0} color="bg-violet-500" />
            </div>
          </CardContainer>
        </div>
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