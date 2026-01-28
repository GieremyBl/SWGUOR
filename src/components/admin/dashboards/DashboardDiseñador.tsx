"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Palette, Package, FileText, CheckCircle, 
  ShoppingCart, Upload, Eye, AlertCircle, 
  ArrowRight, Search, Plus
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Usuario } from '@/types/supabase.types';
import { useRouter } from 'next/navigation';

// Interfaces
interface DBProducto {
  id: number;
  nombre: string | null;
  categoria: string | null;
  ficha_url: string | null;
  created_at: string;
}

interface DBPedido {
  id: number;
  descripcion: string | null;
  cantidad: number | null;
  fecha_entrega: string | null;
  prioridad: string | null;
}

interface ProductoActivo {
  id: number;
  name: string;
  client: string;
  status: string;
  progress: number;
  priority: string; 
}

interface PedidoAsignado {
  id: number;
  product: string;
  quantity: number;
  deadline: string;
  status: string;
}

export default function DisenadorDashboard({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [stats, setStats] = useState({
    productosActivos: 0,
    fichasPendientes: 0,
    pedidosAsignados: 0,
    diseñosCompletados: 0
  });
  const [activeProducts, setActiveProducts] = useState<ProductoActivo[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<PedidoAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const calculateDeadline = useCallback((fechaEntrega: string | null): string => {
    if (!fechaEntrega) return 'Sin fecha';
    const diff = Math.floor((new Date(fechaEntrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff < 0 ? 'Vencido' : diff === 0 ? 'Hoy' : `${diff} días`;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      
      const [productosRes, pedidosRes] = await Promise.all([
        supabase.from('productos').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
        supabase.from('pedidos').select('*').in('estado', ['pendiente', 'en_proceso']).order('created_at', { ascending: false }).limit(4)
      ]);

      const productosData = (productosRes.data as DBProducto[]) || [];
      const productosCount = productosRes.count || 0;
      const productosSinFicha = productosData.filter((p: DBProducto) => !p.ficha_url).length;

      setStats({
        productosActivos: productosCount,
        fichasPendientes: productosSinFicha,
        pedidosAsignados: pedidosRes.data?.length || 0,
        diseñosCompletados: Math.max(0, productosCount - productosSinFicha)
      });

      setActiveProducts(productosData.slice(0, 6).map((p: DBProducto) => ({
        id: p.id,
        name: p.nombre || 'Sin nombre',
        client: p.categoria || 'General',
        status: p.ficha_url ? 'Aprobado' : 'Pendiente',
        progress: p.ficha_url ? 100 : 30,
        priority: p.ficha_url ? 'low' : 'high'
      })));

      const pedidosData = (pedidosRes.data as DBPedido[]) || [];
      setAssignedOrders(pedidosData.map((pedido: DBPedido) => ({
        id: pedido.id,
        product: pedido.descripcion || 'Sin descripción',
        quantity: pedido.cantidad || 0,
        deadline: calculateDeadline(pedido.fecha_entrega),
        status: pedido.prioridad === 'alta' ? 'Urgente' : 'Normal'
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateDeadline]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, productoId: number) => {
    if (!can('edit', 'productos')) {
      toast.error("Acceso denegado", { description: "No tienes permisos para editar productos." });
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingId(productoId);
    const uploadPromise = async () => {
      const supabase = getSupabaseBrowserClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${productoId}-${Date.now()}.${fileExt}`;
      const filePath = `fichas/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('productos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('productos').update({ ficha_url: publicUrl }).eq('id', productoId);
      if (updateError) throw updateError;

      await fetchDashboardData();
    };

    toast.promise(uploadPromise(), {
      loading: 'Subiendo ficha...',
      success: 'Ficha actualizada',
      error: (err) => { setUploadingId(null); return `Error: ${err.message}`; },
      finally: () => setUploadingId(null)
    });
  };

  const handleViewFile = async (productoId: number) => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.from('productos').select('ficha_url').eq('id', productoId).single();
    if (data?.ficha_url) window.open(data.ficha_url, '_blank');
  };

  if (permissionsLoading || loading) return <LoadingDashboard />;

return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 bg-slate-50/50">
      
      {/* Botones de Acción Superior - CORREGIDO: Más anchos y altos */}
      <div className="flex flex-wrap gap-4">
        <QuickActionBtn 
          icon={Plus} 
          label="Nuevo Producto" 
          color="bg-white border-slate-200 text-slate-900 hover:border-pink-500 hover:text-pink-600 shadow-sm" 
          onClick={() => router.push('/admin/Panel-Administrativo/productos')} 
        />
        <QuickActionBtn 
          icon={Search} 
          label="Buscar Ficha Técnica" 
          color="bg-slate-900 text-white hover:bg-slate-800 shadow-md" 
          onClick={() => router.push('/admin/Panel-Administrativo/productos')} 
        />
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard label="Catálogo" value={stats.productosActivos} icon={<Package />} color="text-blue-600" bgColor="bg-blue-50" />
  <StatCard label="Pendientes" value={stats.fichasPendientes} icon={<FileText />} color="text-rose-600" bgColor="bg-rose-50" />
  <StatCard label="En Cola" value={stats.pedidosAsignados} icon={<ShoppingCart />} color="text-amber-600" bgColor="bg-amber-50" />
  <StatCard label="Listos" value={stats.diseñosCompletados} icon={<CheckCircle />} color="text-emerald-600" bgColor="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bandeja de Producción */}
        <div className="lg:col-span-2 bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-3">
              <Palette className="text-pink-600" size={24} />
              Bandeja de Producción
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProducts.map((product) => (
              <div key={product.id} className="p-6 rounded-3xl bg-white border border-slate-100 hover:border-pink-200 transition-all hover:shadow-md group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    product.status === 'Aprobado' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {product.status}
                  </span>
                  <span className="text-[10px] font-black text-slate-300">#{product.id}</span>
                </div>
                
                <h4 className="font-bold text-slate-800 uppercase text-xs mb-1">{product.name}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">{product.client}</p>
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    id={`file-${product.id}`}
                    className="hidden"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => handleFileUpload(e, product.id)}
                    disabled={uploadingId === product.id}
                  />
                  <label 
                    htmlFor={`file-${product.id}`}
                    className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                      product.status === 'Aprobado' 
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200' 
                        : 'bg-pink-600 text-white hover:bg-pink-700 shadow-sm shadow-pink-200'
                    }`}
                  >
                    {uploadingId === product.id ? (
                      <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <><Upload size={14} /> {product.status === 'Aprobado' ? 'Reemplazar' : 'Subir Ficha Técnica'}</>
                    )}
                  </label>

                  {product.status === 'Aprobado' && (
                    <button 
                      onClick={() => handleViewFile(product.id)}
                      className="px-4 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-pink-600 hover:border-pink-200 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Prioridad */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-4xl text-white shadow-xl">
            <div className="flex items-center gap-2 mb-8">
              <AlertCircle size={18} className="text-pink-500" />
              <h3 className="text-md font-black uppercase italic tracking-tighter">Prioridad Taller</h3>
            </div>
            
            <div className="space-y-6">
              {assignedOrders.length > 0 ? assignedOrders.map((o) => (
                <div key={o.id} className="border-l border-slate-700 pl-4">
                  <p className="text-[9px] font-bold text-pink-500 uppercase tracking-widest mb-1">{o.deadline}</p>
                  <p className="font-bold text-xs uppercase leading-tight text-slate-200">{o.product}</p>
                </div>
              )) : (
                <p className="text-[10px] text-slate-500 uppercase font-bold">No hay pedidos pendientes</p>
              )}
            </div>

            {/* Botón de Hoja de Ruta - CORREGIDO: py-4 para mayor cuerpo */}
            <button 
              onClick={() => router.push('/admin/Panel-Administrativo/pedidos')}
              className="w-full mt-10 py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-black/20"
            >
              Ver hoja de ruta <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- SUB-COMPONENTES AUXILIARES ---

function StatCard({ label, value, icon, color, bgColor }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-default">
      {/* Icono contenido en un cuadro fijo para evitar deformación */}
      <div className={`${bgColor} shrink-0 w-12 h-12 rounded-xl flex items-center justify-center`}>
        <div className={color}>{icon}</div>
      </div>
      
      {/* Información alineada */}
      <div className="flex flex-col justify-center overflow-hidden">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickActionBtn({ icon: Icon, label, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`${color} min-w-50 px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 cursor-pointer border active:scale-95`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-bold text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );
}

function LoadingDashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <div className="h-12 w-12 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin" />
      <p className="font-black text-slate-900 text-sm uppercase tracking-widest italic animate-pulse">Cargando Studio...</p>
    </div>
  );
}