"use client";

import React, { useState, useEffect } from 'react';
import { Palette, Package, FileText, TrendingUp, Clock, CheckCircle, Eye, Edit3, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/lib/hooks/usePermissions';

// 1. Interfaz para el estado 'activeProducts'
interface ProductoActivo {
    id: number;
    name: string;
    client: string;
    status: string;
    progress: number;
    priority: string; 
}

// 2. Interfaz para el estado 'assignedOrders'
interface PedidoAsignado {
    id: number;
    product: string;
    quantity: number;
    deadline: string;
    status: string;
}

// 3. Interfaz para el estado 'recentProducts'
interface ProductoReciente {
    name: string;
    category: string;
    colors: number;
    sizes: string;
    price: string;
}

type Usuario = {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
};

export default function DisenadorDashboard({ usuario }: { usuario: Usuario }) {
  const { can, isLoading } = usePermissions();
  const [stats, setStats] = useState({
    productosActivos: 0,
    diseñosEnProceso: 0,
    pedidosAsignados: 0,
    diseñosCompletados: 0
  });
  const [activeProducts, setActiveProducts] = useState<ProductoActivo[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<PedidoAsignado[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductoReciente[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Productos activos
      const { data: productosData, count: productosCount } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      // Pedidos asignados (ajusta según tu estructura)
      const { data: pedidosData, count: pedidosCount } = await supabase
        .from('pedidos')
        .select('*')
        .in('estado', ['pendiente', 'en_proceso'])
        .order('created_at', { ascending: false })
        .limit(3);

      // Productos recientes (últimos 3)
      const { data: recentProductsData } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        productosActivos: productosCount || 0,
        diseñosEnProceso: Math.floor((productosCount || 0) * 0.2), // Estimado 20%
        pedidosAsignados: pedidosCount || 0,
        diseñosCompletados: productosCount || 0
      });

      // Formatear productos activos
      if (productosData && productosData.length > 0) {
        const formatted = (productosData as any[]).slice(0, 4).map(producto => ({
          id: producto.id,
          name: producto.nombre || 'Producto sin nombre',
          client: producto.categoria || 'General',
          status: producto.estado || 'Activo',
          progress: Math.floor(Math.random() * 100), // Simular progreso
          priority: 'medium'
        }));
        setActiveProducts(formatted);
      }

      // Formatear pedidos asignados
      if (pedidosData) {
        const formatted = (pedidosData as any[]).map(pedido => ({
          id: pedido.id,
          product: pedido.descripcion || 'Sin descripción',
          quantity: pedido.cantidad || 0,
          deadline: calculateDeadline(pedido.fecha_entrega),
          status: pedido.prioridad === 'alta' ? 'Urgente' : 'Normal'
        }));
        setAssignedOrders(formatted);
      }

      // Formatear productos recientes
      if (recentProductsData) {
        const formatted = (recentProductsData as any[]).map(producto => ({
          name: producto.nombre || 'Producto sin nombre',
          category: producto.categoria || 'Sin categoría',
          colors: Math.floor(Math.random() * 5) + 1,
          sizes: 'S-XXL',
          price: `S/ ${producto.precio || 0}`
        }));
        setRecentProducts(formatted);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeadline = (fechaEntrega: string | null): string => {
    if (!fechaEntrega) return 'Sin fecha';
    const diff = Math.floor((new Date(fechaEntrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Vencido';
    if (diff === 0) return 'Hoy';
    if (diff === 1) return '1 día';
    return `${diff} días`;
  };

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'Urgente': return 'text-red-600 bg-red-100';
      case 'En revisión': return 'text-yellow-600 bg-yellow-100';
      case 'Aprobado': return 'text-green-600 bg-green-100';
      case 'Activo': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const quickActions = [
    { icon: Palette, label: 'Nuevo Diseño', color: 'bg-purple-500', show: can('create', 'productos') },
    { icon: Edit3, label: 'Editar Producto', color: 'bg-blue-500', show: can('edit', 'productos') },
    { icon: Eye, label: 'Ver Pedidos', color: 'bg-green-500', show: can('view', 'pedidos') },
    { icon: FileText, label: 'Exportar Catálogo', color: 'bg-orange-500', show: can('export', 'productos') },
  ].filter(action => action.show);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Diseñador</h1>
          <p className="text-gray-600">Gestión de diseños y catálogo de productos</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Productos Activos</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.productosActivos}</p>
            <p className="text-sm text-green-600 mt-2">En catálogo</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Palette className="w-6 h-6 text-blue-600" />
              </div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">En Proceso</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.diseñosEnProceso}</p>
            <p className="text-sm text-blue-600 mt-2">Diseños activos</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pedidos Asignados</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pedidosAsignados}</p>
            <p className="text-sm text-green-600 mt-2">Requieren diseño</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Completados</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.diseñosCompletados}</p>
            <p className="text-sm text-gray-600 mt-2">Total histórico</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Products */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Productos Activos</h2>
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            {activeProducts.length > 0 ? (
              <div className="space-y-4">
                {activeProducts.map((product, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.client}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span className="font-semibold">{product.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{width: `${product.progress}%`}}
                        />
                      </div>
                    </div>
                    <button className="w-full mt-3 bg-purple-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors">
                      Editar producto
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay productos activos</p>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Assigned Orders */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pedidos Asignados</h2>
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">
                  {assignedOrders.length}
                </span>
              </div>
              {assignedOrders.length > 0 ? (
                <div className="space-y-3">
                  {assignedOrders.map((order, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">#{order.id}</p>
                          <p className="text-xs text-gray-600">{order.product}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Cantidad: {order.quantity}</span>
                        <span>Entrega: {order.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay pedidos asignados</p>
              )}
            </div>

            {/* Recent Products */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Productos Recientes</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                  Ver catálogo
                </button>
              </div>
              {recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {recentProducts.map((product, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.category}</p>
                        </div>
                        <span className="text-sm font-bold text-purple-600">{product.price}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span>{product.colors} colores</span>
                        <span>•</span>
                        <span>Tallas {product.sizes}</span>
                      </div>
                      <button className="w-full mt-2 bg-blue-500 text-white py-1.5 rounded text-xs font-semibold hover:bg-blue-600 transition-colors">
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay productos recientes</p>
              )}
            </div>
          </div>
        </div>

        {/* Creative Tips */}
        <div className="mt-6 bg-linear-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">🎨 Inspiración del día</h3>
              <p className="text-purple-100">Los mejores diseños nacen de entender las necesidades del cliente. Revisa los comentarios de los pedidos para crear productos que superen las expectativas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}