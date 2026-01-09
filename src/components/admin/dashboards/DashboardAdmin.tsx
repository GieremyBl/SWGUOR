"use client";

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Building2, FileText, Package, TrendingUp, Download, Settings, BarChart3, ShoppingCart } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface ActividadReciente {
    action: string;
    user: string;
    time: string;
    type: string;
}

export default function AdminDashboard() {
  const { can, isLoading } = usePermissions();
  const [stats, setStats] = useState({
    usuarios: 0,
    clientes: 0,
    talleres: 0,
    pedidosActivos: 0,
    productosInventario: 0,
    ventasMes: 'S/ 0'
  });

  const [recentActivity, setRecentActivity] = useState<ActividadReciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const supabase = getSupabaseBrowserClient();
      // Contar usuarios
      const { count: usuariosCount } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });

      // Contar clientes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      // Contar talleres
      const { count: talleresCount } = await supabase
        .from('talleres')
        .select('*', { count: 'exact', head: true });

      // Contar pedidos activos
      const { count: pedidosCount } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .neq('estado', 'completado');

      // Contar productos en inventario
      const { count: productosCount } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      // Calcular ventas del mes
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: ventasData } = await supabase
        .from('pedidos')
        .select('total')
        .gte('created_at', startOfMonth.toISOString());

      const totalVentas = ventasData?.reduce((sum: number, pedido: any) => sum + (pedido.total || 0), 0) || 0;

      setStats({
        usuarios: usuariosCount || 0,
        clientes: clientesCount || 0,
        talleres: talleresCount || 0,
        pedidosActivos: pedidosCount || 0,
        productosInventario: productosCount || 0,
        ventasMes: `S/ ${totalVentas.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
      });

      // Obtener actividad reciente
      const { data: activityData } = await supabase
        .from('usuarios')
        .select('nombre_completo, created_at, email')
        .order('created_at', { ascending: false })
        .limit(4);

      if (activityData) {
        const formattedActivity = (activityData as any[]).map(user => ({
          action: 'Usuario registrado',
          user: user.nombre_completo || user.email,
          time: getTimeAgo(user.created_at),
          type: 'success'
        }));
        setRecentActivity(formattedActivity);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const quickActions = [
    { icon: UserPlus, label: 'Crear Usuario', color: 'bg-blue-500', permission: 'usuarios.create', show: can('create', 'usuarios') },
    { icon: Users, label: 'Crear Cliente', color: 'bg-green-500', permission: 'clientes.create', show: can('create', 'clientes') },
    { icon: Building2, label: 'Registrar Taller', color: 'bg-purple-500', permission: 'talleres.create', show: can('create', 'talleres') },
    { icon: Download, label: 'Exportar Reportes', color: 'bg-orange-500', permission: 'reportes.export', show: can('export', 'reportes') },
  ].filter(action => action.show);

  const modules = [
    { icon: Users, title: 'Usuarios', count: stats.usuarios, color: 'text-blue-600', bgColor: 'bg-blue-100', link: '/usuarios', show: can('view', 'usuarios') },
    { icon: Users, title: 'Clientes', count: stats.clientes, color: 'text-green-600', bgColor: 'bg-green-100', link: '/clientes', show: can('view', 'clientes') },
    { icon: Building2, title: 'Talleres', count: stats.talleres, color: 'text-purple-600', bgColor: 'bg-purple-100', link: '/talleres', show: can('view', 'talleres') },
    { icon: ShoppingCart, title: 'Pedidos', count: stats.pedidosActivos, color: 'text-orange-600', bgColor: 'bg-orange-100', link: '/pedidos', show: can('view', 'pedidos') },
    { icon: Package, title: 'Inventario', count: stats.productosInventario, color: 'text-indigo-600', bgColor: 'bg-indigo-100', link: '/inventario', show: can('view', 'inventario') },
    { icon: TrendingUp, title: 'Ventas del Mes', count: stats.ventasMes, color: 'text-pink-600', bgColor: 'bg-pink-100', link: '/reportes', show: can('view', 'reportes') },
  ].filter(module => module.show);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrador</h1>
          <p className="text-gray-600">Acceso completo al sistema - Gestión total</p>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className={`${action.color} text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center gap-3`}
              >
                <action.icon className="w-6 h-6" />
                <span className="font-semibold">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`${module.bgColor} p-3 rounded-lg`}>
                  <module.icon className={`w-6 h-6 ${module.color}`} />
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{module.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{module.count}</p>
              <div className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                Ver detalles →
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN DE GRÁFICAS */}
        {/* DashboardCharts puede ser agregado aquí cuando esté disponible */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Actividad Reciente</h2>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'info' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay actividad reciente</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Estadísticas Rápidas</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Usuarios Activos</span>
                <span className="font-bold text-green-600">{stats.usuarios > 0 ? '100%' : '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: stats.usuarios > 0 ? '100%' : '0%'}}></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600">Clientes Registrados</span>
                <span className="font-bold text-blue-600">{stats.clientes}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: stats.clientes > 0 ? '85%' : '0%'}}></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600">Pedidos Activos</span>
                <span className="font-bold text-purple-600">{stats.pedidosActivos}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: stats.pedidosActivos > 0 ? '70%' : '0%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Config Access */}
        <div className="mt-6 bg-linear-to-r from-red-500 to-red-600 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Configuración del Sistema</h3>
              <p className="text-red-100">Acceso a configuración avanzada y gestión del sistema</p>
            </div>
            <button className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}