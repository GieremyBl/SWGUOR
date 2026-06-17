"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { EstadoPersonal } from "@prisma/client";

import PersonalTable from "@/components/admin/personal/PersonalTable";
import type { PersonalRow } from "@/lib/services/personal-interno.service";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";
import PersonalFilters, {
  PersonalFiltrosState,
  EMPTY_PERSONAL_FILTERS,
} from "@/components/admin/personal/FiltersPersonal";
import StatsPersonal from "@/components/admin/personal/StatsPersonal";
import PersonalFormModal from "@/components/admin/personal/PersonalFormModal";
import { PersonalSuspendModal, PersonalDetailModal } from "@/components/admin/personal/PersonalModals";
import { exportPersonalToExcel, exportPersonalToPDF } from "@/lib/utils/export-utils";

export default function PersonalPage() {
  const { can } = usePermissions();

  const [personal, setPersonal] = useState<PersonalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [filters, setFilters] = useState<PersonalFiltrosState>(EMPTY_PERSONAL_FILTERS);

  const [statusFilter, setStatusFilter] = useState<EstadoPersonal | null>(null);

  // Modal states
  const [formTarget, setFormTarget] = useState<PersonalRow | null | undefined>(undefined);
  const [suspenderTarget, setSuspenderTarget] = useState<PersonalRow | null>(null);
  const [detalleTarget, setDetalleTarget] = useState<PersonalRow | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);
  const selectedPersonal = suspenderTarget;

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchPersonal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/personal");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Error al cargar personal");
      setPersonal(body.data ?? []);
    } catch (e) {
      // CORRECCIÓN TS 1005: Un solo bloque catch seguro y bien estructurado
      const error = e instanceof Error ? e : new Error("Error inesperado");
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPersonal(); }, [fetchPersonal]);

  // ── CORRECCIÓN ESTRICTA PARA EXPORTACIÓN ──
  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const toastId = toast.loading("Preparando Excel...");
    try {
      setExportingExcel(true);
      // CORRECCIÓN TS 2345: Saneamos convirtiendo nulos/indefinidos a "" para cumplir con el contrato de exportación
      const datosSaneados = filtered.map((p) => ({
        ...p,
        nombre_completo: p.nombre_completo ?? "",
        dni: p.dni ?? "",
        telefono: p.telefono ? String(p.telefono) : "",
        cargo: p.cargo ?? "",
        estado: p.estado ?? "",
      }));

      await exportPersonalToExcel(datosSaneados, {
        filename: `Personal_GUOR_${new Date().toISOString().split('T')[0]}`,
      });
      toast.success("Excel descargado correctamente", { id: toastId });
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Error al exportar");
      toast.error(error.message, { id: toastId });
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
      const datosSaneados = filtered.map((p) => ({
        ...p,
        nombre_completo: p.nombre_completo ?? "",
        dni: p.dni ?? "",
        telefono: p.telefono ? String(p.telefono) : "",
        cargo: p.cargo ?? "",
        estado: p.estado ?? "",
      }));

      await exportPersonalToPDF(datosSaneados, {
        filename: `Personal_GUOR_${new Date().toISOString().split('T')[0]}`,
      });
      toast.success("PDF descargado correctamente", { id: toastId });
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Error al exportar");
      toast.error(error.message, { id: toastId });
    } finally {
      setExportingPDF(false);
    }
  };

  // ── Manejo de suspensión ─────────────────────────────────────
  const handleSuspend = async (isSuspendido: boolean) => {
    if (!selectedPersonal) return;

    setIsSuspending(true);
    try {
      const res = await fetch(`/api/admin/personal/${selectedPersonal.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: isSuspendido ? 'suspendido' : 'activo' }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error ?? 'Error al cambiar estado');
      }

      toast.success(
        isSuspendido ? 'Colaborador suspendido' : 'Colaborador activado',
      );
      setSuspenderTarget(null);
      fetchPersonal(); // recargar lista
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error al actualizar estado');
      toast.error(err.message);
    } finally {
      setIsSuspending(false);
    }
  };

  // ── Filtrado local ────────────────────────────────────────────
  const filtered = useMemo(() => {
    return personal.filter((p) => {

      // Filtro por card de stats (statusFilter)
      if (statusFilter && p.estado !== statusFilter) return false;

      // Filtro por selector de estado en FiltersPersonal
      if (filters.estado && p.estado !== filters.estado) return false;

      // Filtro por cargo
      if (filters.cargo && p.cargo !== filters.cargo) return false;

      // Filtro por búsqueda de texto
      const q = filters.q.toLowerCase().trim();
      if (q) {
        const hayMatch =
          p.nombre_completo?.toLowerCase().includes(q) ||
          p.usuarios?.email?.toLowerCase().includes(q) ||
          p.dni?.toLowerCase().includes(q);
        if (!hayMatch) return false;
      }

      return true;
    });
  }, [personal, filters, statusFilter]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <AdminPageHeader
        title="Personal Interno"
        description={loading ? "Cargando…" : `${filtered.length} colaborador${filtered.length !== 1 ? "es" : ""}`}
        actionLabel="Nuevo Personal"
        onAction={() => setFormTarget(null)}
        showAction={can("create", "personal")}
        icon={UserPlus}
      >
        {can("export", "personal") && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-11 rounded-xl"
              onClick={handleExportExcel}
              disabled={loading || exportingExcel || filtered.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4" /> {exportingExcel ? "Excel..." : "Excel"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-700 border-red-200 hover:bg-red-50 h-11 rounded-xl"
              onClick={handleExportPDF}
              disabled={loading || exportingPDF || filtered.length === 0}
            >
              <FileText className="w-4 h-4" /> {exportingPDF ? "PDF..." : "PDF"}
            </Button>
          </>
        )}
      </AdminPageHeader>

      {/* Stats */}
      <StatsPersonal
        personal={personal}
        loading={loading}
        statusFilter={statusFilter}
        onFilterChange={(estado) => setStatusFilter(prev => prev === estado ? null : estado)}
      />

      {/* Filtros */}
      <PersonalFilters
        filters={filters}
        onChange={setFilters}
        totalCount={filtered.length}
      />

      {/* Tabla */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <PersonalTable
          data={filtered}
          loading={loading}
          onEdit={can("edit", "personal") ? setFormTarget : undefined}
          onDetalle={setDetalleTarget}
          onSuspender={can("archive", "personal") ? setSuspenderTarget : undefined}
        />
      </div>

      {/* Modales */}
      {formTarget !== undefined && (
        <PersonalFormModal
          personal={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSuccess={fetchPersonal}
        />
      )}

      {suspenderTarget && (
        <PersonalSuspendModal
          personal={suspenderTarget}
          isSuspending={isSuspending}
          onClose={() => setSuspenderTarget(null)}
          onConfirm={() => handleSuspend(suspenderTarget.estado === 'suspendido')}
        />
      )}

      {detalleTarget && (
        <PersonalDetailModal
          personal={detalleTarget}
          onClose={() => setDetalleTarget(null)}
        />
      )}

    </div>
  );
}