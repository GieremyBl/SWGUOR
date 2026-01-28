"use client";

import { useState, useEffect, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { 
  LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, Calendar, Download, 
  ShoppingBag, Users, FileBarChart, ShieldAlert,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

// --- Constantes y Tipos ---
const COLORS = ['#db2777', '#f472b6', '#9333ea', '#3b82f6', '#10b981'];

interface VentaData {
  fecha: string;
  ventas: number;
}

interface CategoriaData {
  name: string;
  value: number;
}

// --- Componentes de Apoyo ---
const StatCard = ({ title, value, trend, icon: Icon, colorClass }: any) => (
  <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon size={24} className="group-hover:scale-110 transition-transform" />
        </div>
      </div>
      <p className={`text-xs font-bold mt-4 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend} vs mes anterior
      </p>
    </CardContent>
  </Card>
);

export default function ReportesPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const [dataVentas, setDataVentas] = useState<VentaData[]>([]);
  const [dataCategorias, setDataCategorias] = useState<CategoriaData[]>([]);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulación de fetch - En producción: await fetch(`/api/admin/reportes?range=${range}`)
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      setDataVentas([
        { fecha: 'Lun', ventas: 4000 },
        { fecha: 'Mar', ventas: 3000 },
        { fecha: 'Mie', ventas: 5000 },
        { fecha: 'Jue', ventas: 2780 },
        { fecha: 'Vie', ventas: 6890 },
        { fecha: 'Sab', ventas: 8390 },
        { fecha: 'Dom', ventas: 2490 },
      ]);

      setDataCategorias([
        { name: 'Vestidos', value: 400 },
        { name: 'Blusas', value: 300 },
        { name: 'Pantalones', value: 300 },
        { name: 'Accesorios', value: 200 },
      ]);
    } catch (error) {
      toast.error("Error al sincronizar datos estratégicos");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (!authLoading && can('view', 'reportes')) {
      loadReportData();
    }
  }, [authLoading, can, loadReportData]);

  if (authLoading || loading) return <LoadingSpinner />;
  if (!can('view', 'reportes')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#fafafa] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 italic tracking-tighter">
              <FileBarChart className="text-pink-600 w-8 h-8" /> REPORTES ESTRATÉGICOS
            </h1>
            <p className="text-gray-500 text-sm font-medium">Panel de control de rendimiento de Modas GUOR</p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-44 bg-white border-gray-200 rounded-xl font-bold">
                <Calendar className="w-4 h-4 mr-2 text-pink-500" />
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl font-medium">
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 border-pink-200 text-pink-700 hover:bg-pink-50 rounded-xl font-bold transition-all active:scale-95">
              <Download className="w-4 h-4" /> Exportar
            </Button>
          </div>
        </div>

        {/* Top Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Ingresos Totales" 
            value="S/ 45,230.00" 
            trend="+12.5%" 
            icon={TrendingUp} 
            colorClass="bg-pink-50 text-pink-600"
          />
          <StatCard 
            title="Pedidos Completados" 
            value="128" 
            trend="+5.2%" 
            icon={ShoppingBag} 
            colorClass="bg-blue-50 text-blue-600"
          />
          <StatCard 
            title="Nuevos Clientes" 
            value="24" 
            trend="+18%" 
            icon={Users} 
            colorClass="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sales Trend Chart */}
          <Card className="border-none shadow-sm bg-white p-6 rounded-3xl">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <TrendingUp size={16} className="text-pink-600" /> Fluctuación Semanal de Ventas
              </CardTitle>
            </CardHeader>
            <div className="h-80 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataVentas}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="fecha" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fontWeight: 700, fill: '#9ca3af'}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fill: '#9ca3af'}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#db2777" 
                    strokeWidth={4} 
                    dot={{r: 6, fill: '#db2777', strokeWidth: 3, stroke: '#fff'}}
                    activeDot={{r: 8, strokeWidth: 0}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Categories Pie Chart */}
          <Card className="border-none shadow-sm bg-white p-6 rounded-3xl">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">
                Distribución por Categoría de Prenda
              </CardTitle>
            </CardHeader>
            <div className="h-80 w-full mt-4 flex flex-col md:flex-row items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataCategorias}
                    cx="50%" 
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    cornerRadius={6}
                    >
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3 shrink-0">
                {dataCategorias.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-tighter">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Componentes de Estado ---
function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Acceso Restringido</h2>
      <p className="text-gray-500 max-w-sm mt-2 font-medium">Solo los administradores de Modas GUOR tienen acceso a los reportes financieros y estratégicos.</p>
    </div>
  );
}

function LoadingSpinner() { 
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 bg-gray-50">
      <div className="relative flex items-center justify-center">
        <div className="h-20 w-20 rounded-full border-4 border-pink-100 border-t-pink-600 animate-spin" />
        <Loader2 className="absolute text-pink-600 animate-pulse" size={24} />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Generando Análisis GUOR...</p>
    </div>
  );
}