"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { usuarios } from "@prisma/client";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";

import UsuariosTable from "@/components/admin/usuarios/UsuarioTable";
import UsuarioFilters, {
  UsuarioFiltrosState,
  EMPTY_FILTERS,
} from "@/components/admin/usuarios/UsuarioFilter";
import StatsUsuarios from "@/components/admin/usuarios/StatsUsuarios";
import UsuarioFormModal from "@/components/admin/usuarios/UsuarioFormModal";
import { UsuarioSuspendModal } from "@/components/admin/usuarios/UsuarioModals";

export default function UsuariosPage() {
  const { can } = usePermissions();

  const [usuarios, setUsuarios] = useState<usuarios[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [filters, setFilters] = useState<UsuarioFiltrosState>(EMPTY_FILTERS);
  const [statusFilter, setStatusFilter] = useState<"activo" | "inactivo" | null>(null);

  // Modal states
  const [formTarget, setFormTarget] = useState<usuarios | null | undefined>(undefined);
  const [suspenderTarget, setSuspenderTarget] = useState<usuarios | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/usuarios");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Error al cargar usuarios");
      setUsuarios(body.data ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const filtered = useMemo(() => {
    return usuarios.filter((u) => {
      // 1. Filtro por chips de stats
      if (statusFilter && u.estado !== statusFilter) return false;

      // 2. Filtro por barra de búsqueda y selectores
      if (filters.estado && u.estado !== filters.estado) return false;
      if (filters.rol && u.rol !== filters.rol) return false;

      const q = filters.q.toLowerCase().trim();
      if (q && !u.email?.toLowerCase().includes(q)) return false;

      return true;
    });
  }, [usuarios, filters, statusFilter]);

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const toastId = toast.loading("Preparando Excel...");
    try {
      setExportingExcel(true);
      await exportToExcel(
        filtered.map((u) => ({
          "EMAIL": u.email ?? "—",
          "ROL": u.rol ?? "—",
          "ESTADO": u.estado ?? "—",
          "ÚLTIMO ACCESO": u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-PE') : '—',
        })),
        {
          filename: `Usuarios_GUOR_${new Date().toISOString().split("T")[0]}`,
          sheetName: "Usuarios",
        },
      );
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
      await exportToPDF(
        [["EMAIL", "ROL", "ÚLTIMO ACCESO", "ESTADO"]],
        filtered.map((u) => [
          u.email ?? "—",
          u.rol ?? "—",
          u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-PE') : '—',
          u.estado ?? '—',
        ]),
        {
          title: "DIRECTORIO DE USUARIOS",
          subtitle: "Modas y Estilos GUOR S.A.C.",
          filename: `Usuarios_GUOR_${new Date().toISOString().split("T")[0]}`,
          orientation: "landscape",
        },
      );
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
          title="Gestión de Accesos"
          description="Control de cuentas de usuario y permisos del sistema"
          actionLabel="Nuevo Usuario"
          onAction={() => setFormTarget(null)}
        />

        {/* Botones de Exportación */}
        {can("export", "usuarios") && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-11 gap-2 border-emerald-200 rounded-xl hover:bg-emerald-50 font-bold text-emerald-700 transition-all active:scale-95"
              onClick={handleExportExcel}
              disabled={loading || exportingExcel || filtered.length === 0}
            >
              <FileSpreadsheet size={18} /> {exportingExcel ? "Excel..." : "Descargar Excel"}
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-2 border-red-200 rounded-xl hover:bg-red-50 font-bold text-red-700 transition-all active:scale-95"
              onClick={handleExportPDF}
              disabled={loading || exportingPDF || filtered.length === 0}
            >
              <FileText size={18} /> {exportingPDF ? "PDF..." : "Descargar PDF"}
            </Button>
          </div>
        )}

        {/* Stats */}
        <StatsUsuarios
          usuarios={usuarios}
          loading={loading}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {/* Filtros */}
        <UsuarioFilters
          filters={filters}
          onChange={setFilters}
          totalCount={filtered.length}
          onRefresh={fetchUsuarios}
          isRefreshing={loading}
        />

        {/* Tabla */}
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
          <UsuariosTable
            usuarios={filtered}
            loading={loading}
            onEdit={can("edit", "usuarios") ? setFormTarget : undefined}
            onSuspender={can("archive", "usuarios") ? setSuspenderTarget : undefined}
          />
        </div>

        {/* Modales */}
        {formTarget !== undefined && (
          <UsuarioFormModal
            usuario={formTarget}
            onClose={() => setFormTarget(undefined)}
            onSuccess={fetchUsuarios}
          />
        )}

        {suspenderTarget && (
          <UsuarioSuspendModal
            usuario={suspenderTarget}
            onClose={() => setSuspenderTarget(null)}
            onSuccess={fetchUsuarios}
          />
        )}

      </div>
    </div>
  );
}