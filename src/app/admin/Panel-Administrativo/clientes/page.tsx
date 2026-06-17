"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, UserPlus, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { cn } from "@/lib/utils";

import ClientesTable from "@/components/admin/clientes/ClientesTable";
import ClienteFilters, {
  ClienteFiltrosState,
  EMPTY_CLIENTE_FILTERS,
} from "@/components/admin/clientes/FiltersClientes";
import StatsClientes from "@/components/admin/clientes/StatsCliente";
import ClienteFormModal from "@/components/admin/clientes/ClienteFormModal";
import { ClienteSuspendModal } from "@/components/admin/clientes/ClienteModals";
import type { ClienteListItem } from "@/lib/services/clientes.service";
import { exportClientesListToExcel, exportClientesListToPDF } from "@/lib/utils/export-utils";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";

export default function ClientesPage() {
  const { can } = usePermissions();
  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [filters, setFilters] = useState<ClienteFiltrosState>(EMPTY_CLIENTE_FILTERS);
  const [statusFilter, setStatusFilter] = useState<"activo" | "inactivo" | "conPedidos" | null>(null);

  // Modal states
  const [formTarget, setFormTarget] = useState<ClienteListItem | null | undefined>(undefined);
  const [suspenderTarget, setSuspenderTarget] = useState<ClienteListItem | null>(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clientes");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Error al cargar clientes");
      setClientes(body.data ?? []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      // 1. Filtro por chips de stats
      if (statusFilter === "activo" && c.activo !== "activo") return false;
      if (statusFilter === "inactivo" && c.activo === "activo") return false;
      if (statusFilter === "conPedidos") {
        if (!c.ultimo_pedido_en) return false;
        const diff = Date.now() - new Date(c.ultimo_pedido_en).getTime();
        if (diff > 90 * 24 * 60 * 60 * 1000) return false;
      }

      // 2. Filtro por barra de búsqueda y selectores
      if (filters.estado && c.activo !== filters.estado) return false;
      
      const q = filters.q.toLowerCase().trim();
      if (q) {
        const match = 
          c.razon_social?.toLowerCase().includes(q) ||
          c.ruc?.includes(q) ||
          c.email?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [clientes, filters, statusFilter]);

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const toastId = toast.loading("Preparando Excel...");
    try {
      setExportingExcel(true);
      await exportClientesListToExcel(filtered, {
        filename: `Clientes_GUOR_${new Date().toISOString().split("T")[0]}`,
      });
      toast.success("Excel descargado correctamente", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar a Excel", { id: toastId });
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (filtered.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const toastId = toast.loading("Preparando PDF...");
    try {
      setExportingPDF(true);
      await exportClientesListToPDF(filtered, {
        filename: `Clientes_GUOR_${new Date().toISOString().split("T")[0]}`,
      });
      toast.success("PDF descargado correctamente", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar a PDF", { id: toastId });
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <AdminPageHeader
          title="Directorio de Clientes"
          description="Gestión de cartera empresarial y contactos"
          actionLabel="Nuevo Cliente"
          onAction={() => setFormTarget(null)}
          showAction={can("create", "clientes")}
          icon={UserPlus}
        >
          <Button
            variant="outline"
            onClick={fetchClientes}
            disabled={loading}
            className="h-11 w-11 p-0 border-slate-200 rounded-xl hover:bg-white transition-all active:scale-95"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-500", loading && "animate-spin")} />
          </Button>
          {can("export", "clientes") && (
            <>
              <Button
                variant="outline"
                className="h-11 gap-2 border-emerald-200 rounded-xl hover:bg-emerald-50 font-bold text-emerald-700 transition-all active:scale-95"
                onClick={handleExportExcel}
                disabled={loading || exportingExcel || filtered.length === 0}
              >
                <FileSpreadsheet size={18} /> {exportingExcel ? "Exportando..." : "Excel"}
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-2 border-red-200 rounded-xl hover:bg-red-50 font-bold text-red-700 transition-all active:scale-95"
                onClick={handleExportPDF}
                disabled={loading || exportingPDF || filtered.length === 0}
              >
                <FileText size={18} /> {exportingPDF ? "Exportando..." : "PDF"}
              </Button>
            </>
          )}
        </AdminPageHeader>

        {/* Stats */}
        <StatsClientes 
          clientes={clientes} 
          loading={loading} 
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {/* Filtros */}
        <ClienteFilters 
          filters={filters} 
          onChange={setFilters} 
          totalCount={filtered.length} 
        />

        {/* Tabla */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
          <ClientesTable 
            clientes={filtered} 
            loading={loading}
            onEdit={can("edit", "clientes") ? setFormTarget : undefined}
            onSuspender={can("archive", "clientes") ? setSuspenderTarget : undefined}
          />
        </div>

        {/* Modales */}
        {formTarget !== undefined && (
          <ClienteFormModal
            cliente={formTarget}
            onClose={() => setFormTarget(undefined)}
            onSuccess={fetchClientes}
          />
        )}

        {suspenderTarget && (
          <ClienteSuspendModal
            cliente={suspenderTarget}
            onClose={() => setSuspenderTarget(null)}
            onSuccess={fetchClientes}
          />
        )}

      </div>
    </div>
  );
}
