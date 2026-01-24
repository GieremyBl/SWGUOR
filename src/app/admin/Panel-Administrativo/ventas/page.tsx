"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, ShoppingBag, DollarSign, 
  RefreshCw, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Receipt,
  Clock, CheckCircle2, ShieldAlert
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";

// Carga dinámica de componentes pesados
const VentasTable = dynamic(() => import("@/components/admin/ventas/VentasTable"), {
  loading: () => <TableSkeleton />
});
const VentaDetalleDialog = dynamic(() => import("@/components/admin/ventas/VentaDetalleDialog"));

const ITEMS_PER_PAGE = 10;

export default function VentasPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [dateFilter, setDateFilter] = useState<"todas" | "hoy" | "semana" | "mes">("todas");
  const [totalRange, setTotalRange] = useState({ min: "", max: "" });
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVenta, setSelectedVenta] = useState<any>(null);

  const loadVentas = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("ventas")
        .select(`*, cliente:cliente_id(nombre, apellido), vendedor:vendedor_id(nombre)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVentas(data || []);
    } catch (error) {
      toast.error("Error al sincronizar caja GUOR");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    if (!authLoading && can('view', 'ventas')) {
      loadVentas(); 
    }
  }, [loadVentas, authLoading, can]);

  const filteredVentas = useMemo(() => {
    return ventas.filter((v) => {
      const term = searchTerm.toLowerCase();
      const clienteNombre = `${v.cliente?.nombre} ${v.cliente?.apellido}`.toLowerCase();
      const matchSearch = !term || v.codigo_pedido?.toLowerCase().includes(term) || clienteNombre.includes(term);
      const matchEstado = estadoFilter === "todos" || v.estado_pedido === estadoFilter;
      
      const minT = parseFloat(totalRange.min) || 0;
      const maxT = parseFloat(totalRange.max) || Infinity;
      const matchTotal = v.total >= minT && v.total <= maxT;

      let matchDate = true;
      const now = new Date();
      const createdDate = new Date(v.created_at);
      if (dateFilter === "hoy") matchDate = createdDate.toDateString() === now.toDateString();
      if (dateFilter === "semana") matchDate = createdDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (dateFilter === "mes") matchDate = createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();

      return matchSearch && matchEstado && matchDate && matchTotal;
    });
  }, [ventas, searchTerm, estadoFilter, dateFilter, totalRange]);

  const stats = useMemo(() => ({
    ingresos: filteredVentas.reduce((acc, v) => acc + Number(v.total), 0),
    total: filteredVentas.length,
    enProduccion: filteredVentas.filter(v => v.estado_pedido === 'en_produccion').length,
    entregados: filteredVentas.filter(v => v.estado_pedido === 'entregado').length
  }), [filteredVentas]);

  const totalPages = Math.ceil(filteredVentas.length / ITEMS_PER_PAGE);
  const paginatedData = filteredVentas.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handleExportPDF = () => {
    const headers = [["CÓDIGO", "FECHA", "CLIENTE", "ESTADO", "TOTAL"]];
    const body = filteredVentas.map(v => [
      v.codigo_pedido,
      new Date(v.created_at).toLocaleDateString(),
      v.cliente ? `${v.cliente.nombre} ${v.cliente.apellido}` : 'Venta Directa',
      v.estado_pedido.toUpperCase(),
      `S/ ${v.total.toFixed(2)}`
    ]);
    exportToPDF(headers, body, { 
      title: "REPORTE DE VENTAS - MODAS GUOR", 
      subtitle: `Filtro: ${dateFilter.toUpperCase()} | Generado por Sistema GUOR`,
      filename: `Ventas_${new Date().toISOString().split('T')[0]}` 
    });
  };

  if (authLoading || loading) return <LoadingState />;
  if (!can('view', 'ventas')) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Unificado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="text-pink-600" /> Ventas E-commerce
            </h1>
            <p className="text-gray-500 text-sm">Monitor de transacciones Modas y Estilos GUOR</p>
          </div>

          <div className="flex items-center gap-2">
            {can('export', 'ventas') && (
              <>
                <Button onClick={handleExportPDF} variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50 font-bold gap-2 h-11">
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </Button>
                <Button onClick={() => exportToExcel(filteredVentas, { filename: "Ventas_GUOR" })} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </Button>
              </>
            )}
            <Button variant="outline" className="h-11 border-gray-200 shadow-sm font-bold bg-white" onClick={loadVentas}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading && 'animate-spin'}`} /> Sincronizar
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="INGRESOS" value={`S/ ${stats.ingresos.toFixed(2)}`} icon={<DollarSign />} isActive={false} color="blue" onClick={() => {}} />
          <StatCard title="ÓRDENES" value={stats.total} icon={<ShoppingBag />} isActive={estadoFilter === "todos"} color="pink" onClick={() => {setEstadoFilter("todos"); setCurrentPage(0);}} />
          <StatCard title="EN TALLER" value={stats.enProduccion} icon={<Clock />} isActive={estadoFilter === "en_produccion"} color="orange" onClick={() => {setEstadoFilter("en_produccion"); setCurrentPage(0);}} />
          <StatCard title="ENTREGADOS" value={stats.entregados} icon={<CheckCircle2 />} isActive={estadoFilter === "entregado"} color="emerald" onClick={() => {setEstadoFilter("entregado"); setCurrentPage(0);}} />
        </div>

        {/* Filtros */}
        <div className="space-y-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Buscar por código de pedido o cliente..." 
                className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(0);}}
              />
            </div>
            <Select value={dateFilter} onValueChange={(v: any) => {setDateFilter(v); setCurrentPage(0);}}>
              <SelectTrigger className="h-11 w-full md:w-48 border-gray-200 bg-white">
                <SelectValue placeholder="Periodo de Venta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Cualquier fecha</SelectItem>
                <SelectItem value="hoy">Ventas de hoy</SelectItem>
                <SelectItem value="semana">Últimos 7 días</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar por monto:</span>
            <Input type="number" placeholder="Min" className="w-24 h-9 text-xs" value={totalRange.min} onChange={(e) => setTotalRange({...totalRange, min: e.target.value})} />
            <span className="text-gray-300">-</span>
            <Input type="number" placeholder="Max" className="w-24 h-9 text-xs" value={totalRange.max} onChange={(e) => setTotalRange({...totalRange, max: e.target.value})} />
          </div>
        </div>

        {/* Tabla */}
        <div className="space-y-4">
          <VentasTable data={paginatedData} onViewDetail={(v: any) => setSelectedVenta(v)} />
          
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-xs text-gray-500">
              Página <span className="font-bold text-gray-900">{currentPage + 1}</span> de <span className="font-bold text-gray-900">{totalPages || 1}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages}>
                Siguiente <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selectedVenta && (
        <VentaDetalleDialog ventaId={selectedVenta.id} isOpen={!!selectedVenta} onClose={() => setSelectedVenta(null)} />
      )}
    </div>
  );
}

// --- Componentes de Apoyo ---

function StatCard({ title, value, icon, isActive, color, onClick }: any) {
  const styles: any = {
    blue: { active: "border-blue-500 ring-blue-50 bg-white", iconActive: "bg-blue-600 text-white", textActive: "text-blue-600" },
    pink: { active: "border-pink-500 ring-pink-50 bg-white", iconActive: "bg-pink-600 text-white", textActive: "text-pink-600" },
    emerald: { active: "border-emerald-500 ring-emerald-50 bg-white", iconActive: "bg-emerald-600 text-white", textActive: "text-emerald-600" },
    orange: { active: "border-orange-500 ring-orange-50 bg-white", iconActive: "bg-orange-600 text-white", textActive: "text-orange-600" }
  };
  const currentStyle = styles[color] || styles.pink;

  return (
    <button onClick={onClick} className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 ${isActive ? `ring-4 shadow-xl scale-[1.02] ${currentStyle.active}` : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
      <div className={`p-3 rounded-lg ${isActive ? currentStyle.iconActive : 'bg-gray-100 text-gray-600'}`}>{icon}</div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black ${isActive ? currentStyle.textActive : 'text-gray-800'}`}>{value}</p>
      </div>
    </button>
  );
}

function AccessDenied() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 uppercase">Acceso Restringido</h2>
      <p className="text-gray-500 max-w-sm mt-2">Solo personal autorizado del área financiera puede visualizar el registro de ventas.</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-gray-50">
      <div className="h-16 w-16 rounded-full border-4 border-pink-100 border-t-pink-600 animate-spin" />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Sincronizando caja GUOR...</p>
    </div>
  );
}