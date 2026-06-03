"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, FileText, ChevronLeft, ChevronRight,
  ShieldAlert, Loader2
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/utils/export-utils";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { usePedidos } from "@/lib/hooks/usePedidos";

import AdminPageHeader from "@/components/admin/common/AdminPageHeader";
import PedidosStats from "@/components/admin/pedidos/PedidosStats";
import PedidosToolbar from "@/components/admin/pedidos/PedidosToolbar";

const PedidosTable       = dynamic(() => import("@/components/admin/pedidos/PedidosTable"));
const CreatePedidoDialog = dynamic(() => import("@/components/admin/pedidos/CreatePedidoDialog"));
const CancelPedidoDialog = dynamic(() => import("@/components/admin/pedidos/CancelPedidoDialog"));

export default function PedidosPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const { pedidos, isLoading, refetch } = usePedidos();

  const [searchTerm,     setSearchTerm]     = useState("");
  const [isCreateOpen,   setIsCreateOpen]   = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [dialogMode,     setDialogMode]     = useState<"view" | "cancel" | null>(null);
  const [statusFilter,   setStatusFilter]   = useState("todos");
  const [dateFilter,     setDateFilter]     = useState<"todas" | "hoy" | "semana" | "mes">("todas");
  const [currentPage,    setCurrentPage]    = useState(0);
  const pageSize = 10;

  const stats = useMemo(() => ({
    total:       pedidos.length,
    pendientes:  pedidos.filter((p: any) =>
      ["pendiente", "en_produccion", "listo_para_despacho"].includes(p.estado)
    ).length,
    completados: pedidos.filter((p: any) =>
      ["entregado", "pagado"].includes(p.estado)
    ).length,
    cancelados:  pedidos.filter((p: any) => p.estado === "cancelado").length,
  }), [pedidos]);

  const filteredPedidos = useMemo(() => {
    if (!pedidos.length) return [];
    return pedidos.filter((p: any) => {
      const cliente    = (p.clientes?.razon_social ?? "Venta Directa").toLowerCase();
      const matchSearch = cliente.includes(searchTerm.toLowerCase()) || String(p.id).includes(searchTerm);
      const matchStatus = statusFilter === "todos" || p.estado === statusFilter;

      const now         = new Date();
      const createdDate = new Date(p.created_at);
      const matchDate =
        dateFilter === "hoy"    ? createdDate.toDateString() === now.toDateString() :
        dateFilter === "semana" ? createdDate >= new Date(now.getTime() - 7 * 86400000) :
        dateFilter === "mes"    ? createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear() :
        true;

      return matchSearch && matchStatus && matchDate;
    });
  }, [pedidos, searchTerm, statusFilter, dateFilter]);

  const totalPages    = Math.ceil(filteredPedidos.length / pageSize);
  const paginatedData = filteredPedidos.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleExport = () => {
    if (!filteredPedidos.length) { toast.error("No hay datos para exportar"); return; }
    exportToExcel(
      filteredPedidos.map((p: any) => ({
        "N° Pedido": p.id,
        "Fecha":     p.created_at ? new Date(p.created_at).toLocaleDateString() : "Sin fecha",
        "Cliente":   p.clientes?.razon_social ?? "Desconocido",
        "Total":     p.total ?? 0,
        "Estado":    (p.estado_label ?? p.estado)?.toUpperCase() ?? "SIN ESTADO",
      })),
      { filename: `Pedidos_GUOR_${new Date().toISOString().split("T")[0]}` }
    );
    toast.success("Excel generado correctamente");
  };

  if (authLoading) return <LoadingScreen />;
  if (!can("view", "pedidos")) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <AdminPageHeader
          title="Registro de Pedidos"
          description="Gestión integral de pedidos y órdenes de clientes"
          actionLabel="Nuevo Pedido"
          onAction={can("create", "pedidos") ? () => setIsCreateOpen(true) : undefined}
        >
          {can("export", "pedidos") && (
            <Button onClick={handleExport} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 rounded-xl shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </Button>
          )}
        </AdminPageHeader>

        <PedidosStats 
          stats={stats} 
          statusFilter={statusFilter} 
          setStatusFilter={setStatusFilter} 
          onPageReset={() => setCurrentPage(0)} 
        />

        <PedidosToolbar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onPageReset={() => setCurrentPage(0)}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Cargando pedidos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <PedidosTable
                data={paginatedData}
                onCancel={can("archive", "pedidos") 
                  ? (p) => { setSelectedPedido(p); setDialogMode("cancel"); } 
                  : undefined}
              />
            </div>

            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de{" "}
                <span className="font-bold text-gray-900">{filteredPedidos.length}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl flex items-center">
                  Página {currentPage + 1} de {totalPages || 1}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages} className="rounded-xl">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreatePedidoDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => refetch()} />
      {selectedPedido && dialogMode === "cancel" && (
        <CancelPedidoDialog isOpen pedido={selectedPedido} onClose={() => { setSelectedPedido(null); setDialogMode(null); }} onSuccess={() => refetch()} />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Sincronizando pedidos...</p>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4 opacity-20" />
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Acceso Restringido</h2>
      <p className="text-gray-500 max-w-sm mt-2 font-medium">No cuentas con los privilegios necesarios para gestionar el registro de pedidos.</p>
    </div>
  );
}