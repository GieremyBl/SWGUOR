"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { Database } from '@/types/database';

type Usuario = Database['public']['Tables']['usuarios']['Row'];
import { useRouter } from 'next/navigation';
import { Upload, Eye, CheckCircle, AlertCircle, ClipboardList, Layers, FileText, Inbox } from 'lucide-react';

// --- INTERFACES ---
// Campos reales de la tabla 'productos' en Supabase
interface DBProducto {
  id: number;
  nombre: string | null;
  categoria_id: number | null;
  created_at: string;
}

// Campos reales de la tabla 'pedidos' en Supabase
interface DBPedido {
  id: number;
  nombre_producto_snapshot: string | null; 
  cantidad: number | null;
  updated_at: string | null;               
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
  
  // --- ESTADOS ---
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

  // --- LÓGICA ---
  const calculateDeadline = useCallback((fecha: string | null): string => {
    if (!fecha) return 'Sin fecha';
    const diff = Math.floor((new Date(fecha).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff < 0 ? 'Vencido' : diff === 0 ? 'Hoy' : `${diff} días`;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      
      const [productosRes, pedidosRes] = await Promise.all([
        supabase
          .from('productos')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false }),
        supabase
          .from('pedidos')
          .select('*')
          .in('estado', ['pendiente', 'corte', 'costura'])
          .order('created_at', { ascending: false })
          .limit(4)
      ]);

      const productosData = (productosRes.data as DBProducto[]) || [];
      const productosCount = productosRes.count || 0;

      // Usamos productosCount como base para diseñosCompletados
      setStats({
        productosActivos: productosCount,
        fichasPendientes: 0,          // ajusta según tu lógica real
        pedidosAsignados: pedidosRes.data?.length || 0,
        diseñosCompletados: productosCount
      });

      setActiveProducts(productosData.slice(0, 6).map((p: DBProducto) => ({
        id: p.id,
        name: p.nombre || 'Sin nombre',
        client: p.categoria_id ? `Cat. ${p.categoria_id}` : 'General', // categoria_id en lugar de categoria
        status: 'Activo',
        progress: 50,
        priority: 'normal'
      })));

      const pedidosData = (pedidosRes.data as unknown as DBPedido[]) || [];
      setAssignedOrders(pedidosData.map((pedido: DBPedido) => ({
        id: pedido.id,
        product: pedido.nombre_producto_snapshot || 'Sin descripción', // campo correcto
        quantity: pedido.cantidad || 0,
        deadline: calculateDeadline(pedido.updated_at),                // campo correcto
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
      try {
        const supabase = getSupabaseBrowserClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${productoId}-${Date.now()}.${fileExt}`;
        const filePath = `fichas/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('productos').upload(filePath, file);
        if (uploadError) throw new Error(uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(filePath);
        const { error: updateError } = await (supabase as any).from('productos').update({ imagen: publicUrl }).eq('id', productoId);
        if (updateError) throw new Error(updateError.message);

        await fetchDashboardData();
      } finally {
        setUploadingId(null);
      }
    };

    toast.promise(uploadPromise(), {
      loading: 'Subiendo archivo...',
      success: 'Archivo actualizado correctamente',
      error: (err: any) => `Error: ${err.message || 'Error desconocido'}`
    });
  };

  const handleViewFile = async (productoId: number) => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { data, error } = await supabase
      .from('productos')
      .select('imagen')
      .eq('id', productoId)
      .single() as { data: { imagen: string | null } | null, error: any };

      if (error) throw error;

      if (data?.imagen) {
        window.open(data.imagen, '_blank');
      } else {
        toast.error('Imagen no disponible', {
          description: 'Este producto aún no tiene una ficha técnica o imagen cargada.'
        });
      }
    } catch (error: any) {
      toast.error('Error al abrir archivo', { description: error.message });
    }
  };

  if (permissionsLoading || loading) return <LoadingDashboard />;

  return (
    <div className="space-y-10 p-6 bg-[#FDFDFF] min-h-screen font-sans">
      
      {/* HEADER */}
      <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-600"></span>
              </span>
              Estudio Creativo
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic">
              Studio <span className="text-pink-600 font-black">.</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-2">
              Gestión de Diseño • {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          
          <div className="flex gap-2 md:gap-3 h-fit">
            <QuickActionBtn 
              label="Nuevo Modelo" 
              color="bg-white border-slate-200 text-slate-900 hover:border-pink-500 hover:text-pink-600 shadow-sm" 
              onClick={() => router.push('/admin/Panel-Administrativo/productos')} 
            />
            <QuickActionBtn 
              label="Catálogo" 
              color="bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200" 
              onClick={() => router.push('/admin/Panel-Administrativo/productos')} 
            />
          </div>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Modelos Totales" value={stats.productosActivos} color="text-indigo-600" bgColor="bg-indigo-50" icon={Layers} />
        <StatCard label="Fichas por Hacer" value={stats.fichasPendientes} color="text-pink-600" bgColor="bg-pink-50" isCritical={stats.fichasPendientes > 0} icon={FileText} />
        <StatCard label="Pedidos en Cola" value={stats.pedidosAsignados} color="text-amber-600" bgColor="bg-amber-50" icon={Inbox} />
        <StatCard label="Listos para Taller" value={stats.diseñosCompletados} color="text-emerald-600" bgColor="bg-emerald-50" icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* BANDEJA DE PRODUCCIÓN */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Bandeja de Producción Reciente
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProducts.map((product) => (
              <div key={product.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-7 hover:shadow-2xl hover:shadow-pink-100/50 transition-all duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">SKU #{product.id}</p>
                    <h4 className="font-black text-slate-800 uppercase text-sm group-hover:text-pink-600 transition-colors">{product.name}</h4>
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Categoría</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase">{product.client}</p>
                </div>
                
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
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 bg-pink-600 text-white hover:bg-pink-700 shadow-lg shadow-pink-200"
                  >
                    {uploadingId === product.id ? (
                      <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Subir Imagen</>
                    )}
                  </label>

                  <button 
                    onClick={() => handleViewFile(product.id)}
                    className="w-14 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-pink-600 hover:border-pink-200 transition-all flex items-center justify-center hover:shadow-lg hover:shadow-pink-100"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR PRIORIDAD */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
              Prioridad Taller
            </h3>
            
            <div className="space-y-8">
              {assignedOrders.length > 0 ? assignedOrders.map((o) => (
                <div key={o.id} className="group">
                  <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-1">{o.deadline}</p>
                  <p className="font-bold text-xs uppercase leading-tight text-slate-200">{o.product}</p>
                  <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-pink-600 h-full w-1/3 group-hover:w-1/2 transition-all duration-700" />
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-slate-500 uppercase font-black text-center py-10">Sin pedidos críticos</p>
              )}
            </div>

            <button 
              onClick={() => router.push('/admin/Panel-Administrativo/pedidos')}
              className="w-full mt-12 py-5 bg-white text-slate-900 hover:bg-pink-50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-slate-900/20 hover:shadow-xl"
            >
              <ClipboardList className="w-4 h-4" />
              Hoja de Ruta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function StatusBadge({ status }: { status: string }) {
  const isOk = status === 'Aprobado';
  return (
    <span className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase flex items-center gap-1.5 ${
      isOk ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
    }`}>
      {isOk ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {status}
    </span>
  );
}

function StatCard({ label, value, color, bgColor, isCritical, icon: Icon }: any) {
  return (
    <div className={`bg-white p-6 rounded-[2rem] border transition-all flex items-center gap-5 ${
      isCritical ? 'border-pink-200 shadow-lg shadow-pink-50' : 'border-slate-100 shadow-sm'
    }`}>
      <div className={`${bgColor} w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}

function QuickActionBtn({ label, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`${color} px-8 py-4 rounded-2xl flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 border text-[10px] font-black uppercase tracking-widest`}
    >
      {label}
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