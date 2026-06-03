"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  ChevronLeft, ChevronRight,
  FileText,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";
import { useInventario } from "@/lib/hooks/useInventario";
import { useMateriales } from "@/lib/hooks/useMateriales";
import { usePermissions } from "@/lib/hooks/usePermissions";

import AdminPageHeader from "@/components/admin/common/AdminPageHeader";
import InventarioToolbar from "@/components/admin/inventario/InventarioToolbar";
import InventarioStats from "@/components/admin/inventario/InventarioStats";
import InventarioTabs from "@/components/admin/inventario/InventarioTabs";
import InsumosTable from "@/components/admin/inventario/insumos/InsumosTable";
import MaterialesTable from "@/components/admin/inventario/materiales/MaterialesTable";

const CreateInsumoDialog = dynamic(() => import("@/components/admin/inventario/insumos/CreateInsumoDialog"));
const EditInsumoDialog = dynamic(() => import("@/components/admin/inventario/insumos/EditInsumoDialog"));
const DescontinuarInsumoDialog = dynamic(() => import("@/components/admin/inventario/insumos/DescontinuarInsumoDialog"));
const CreateMaterialDialog = dynamic(() => import("@/components/admin/inventario/materiales/CreateMaterialDialog"));
const EditMaterialDialog = dynamic(() => import("@/components/admin/inventario/materiales/EditMaterialDialog"));
const DescontinuarMaterialDialog = dynamic(() => import("@/components/admin/inventario/materiales/DescontinuarMaterialDialog"));

type ActiveTab = "insumos" | "materiales";

export default function InventarioPage() {
  const { can, role, isLoading: authLoading } = usePermissions();
  const { insumos, cargando: cargandoInsumos, obtenerInsumosList } = useInventario();
  const { materiales, isLoading: cargandoMateriales, refetch: refetchMateriales } = useMateriales();

  const [activeTab, setActiveTab] = useState<ActiveTab>("insumos");

  // Insumos state
  const [searchTermIns, setSearchTermIns] = useState("");
  const [selectedTipoIns, setSelectedTipoIns] = useState("todos");
  const [statusFilterIns, setStatusFilterIns] = useState<string | null>(null);
  const [currentPageIns, setCurrentPageIns] = useState(0);
  const [isCreateInsumoOpen, setIsCreateInsumoOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<any>(null);
  const [dialogModeIns, setDialogModeIns] = useState<"edit" | "archive" | null>(null);

  // Materiales state
  const [searchTermMat, setSearchTermMat] = useState("");
  const [selectedTipoMat, setSelectedTipoMat] = useState("todos");
  const [statusFilterMat, setStatusFilterMat] = useState<string | null>(null);
  const [currentPageMat, setCurrentPageMat] = useState(0);
  const [isCreateMatOpen, setIsCreateMatOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [dialogModeMat, setDialogModeMat] = useState<"edit" | "archive" | null>(null);

  const pageSize = 10;
  const canCreate = can("create", "inventario");
  const canEdit = can("edit", "inventario");
  const canDelete = can("archive", "inventario");
  const canExport = can("export", "inventario");

  // ── SOLUCIÓN ESLINT: Se agrega 'can' al arreglo de dependencias ──
  useEffect(() => {
    if (!authLoading && can("view", "inventario")) obtenerInsumosList();
  }, [obtenerInsumosList, authLoading, can]);

  const statsIns = useMemo(() => {
    const total = insumos.length;
    const bajoStock = insumos.filter((i: any) => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo).length;
    const sinStock = insumos.filter((i: any) => i.stock_actual <= 0).length;
    const optimo = total - bajoStock - sinStock;
    const valorAlmacen = insumos.reduce((acc: number, i: any) => acc + (Number(i.precio_unitario ?? 0) * i.stock_actual), 0);
    return { total, bajoStock, sinStock, optimo, valorAlmacen };
  }, [insumos]);

  const statsMat = useMemo(() => {
    const total = materiales.length;
    const bajoStock = materiales.filter((m: any) => m.stock_actual > 0 && m.stock_actual <= m.stock_minimo).length;
    const sinStock = materiales.filter((m: any) => m.stock_actual <= 0).length;
    const optimo = total - bajoStock - sinStock;
    const valorAlmacen = materiales.reduce((acc: number, m: any) => acc + (Number(m.precio_unitario ?? 0) * Number(m.stock_actual ?? 0)), 0);
    return { total, bajoStock, sinStock, optimo, valorAlmacen };
  }, [materiales]);

  const filteredInsumos = useMemo(() => insumos.filter((i: any) => {
    const matchSearch = !searchTermIns || i.nombre.toLowerCase().includes(searchTermIns.toLowerCase());
    const matchTipo = selectedTipoIns === "todos" || i.tipo === selectedTipoIns;
    let matchStatus = true;
    if (statusFilterIns === "bajoStock") matchStatus = i.stock_actual > 0 && i.stock_actual <= i.stock_minimo;
    if (statusFilterIns === "sinStock") matchStatus = i.stock_actual <= 0;
    if (statusFilterIns === "optimo") matchStatus = i.stock_actual > i.stock_minimo;
    return matchSearch && matchTipo && matchStatus;
  }), [insumos, searchTermIns, selectedTipoIns, statusFilterIns]);

  const filteredMateriales = useMemo(() => materiales.filter((m: any) => {
    const matchSearch = !searchTermMat || m.nombre.toLowerCase().includes(searchTermMat.toLowerCase());
    const matchTipo = selectedTipoMat === "todos" || m.tipo === selectedTipoMat;
    let matchStatus = true;
    if (statusFilterMat === "bajoStock") matchStatus = m.stock_actual > 0 && m.stock_actual <= m.stock_minimo;
    if (statusFilterMat === "sinStock") matchStatus = m.stock_actual <= 0;
    if (statusFilterMat === "optimo") matchStatus = m.stock_actual > m.stock_minimo;
    return matchSearch && matchTipo && matchStatus;
  }), [materiales, searchTermMat, selectedTipoMat, statusFilterMat]);

  useEffect(() => { setCurrentPageIns(0); }, [searchTermIns, selectedTipoIns, statusFilterIns]);
  useEffect(() => { setCurrentPageMat(0); }, [searchTermMat, selectedTipoMat, statusFilterMat]);

  const totalPagesIns = Math.ceil(filteredInsumos.length / pageSize);
  const paginatedInsumos = filteredInsumos.slice(currentPageIns * pageSize, (currentPageIns + 1) * pageSize);
  const totalPagesMat = Math.ceil(filteredMateriales.length / pageSize);
  const paginatedMateriales = filteredMateriales.slice(currentPageMat * pageSize, (currentPageMat + 1) * pageSize);

  const handleExportPDF = () => {
    if (!canExport) return toast.error("Sin permisos");
    if (activeTab === "insumos") {
      exportToPDF(
        [["INSUMO", "TIPO", "STOCK", "PRECIO", "VALOR TOTAL"]],
        filteredInsumos.map((i: any) => [i.nombre.toUpperCase(), i.tipo, `${i.stock_actual} ${i.unidad_medida}`, `S/ ${Number(i.precio_unitario).toFixed(2)}`, `S/ ${(i.stock_actual * Number(i.precio_unitario)).toFixed(2)}`]),
        { title: "REPORTE VALORIZADO — INSUMOS", filename: `Kardex_Insumos_GUOR_${new Date().toLocaleDateString()}` }
      );
    } else {
      exportToPDF(
        [["MATERIAL", "TIPO", "COMPOSICIÓN", "GRAMAJE", "STOCK", "PRECIO", "VALOR TOTAL"]],
        filteredMateriales.map((m: any) => [m.nombre.toUpperCase(), m.tipo ?? "—", m.composicion ?? "—", m.gramaje ? `${m.gramaje} g/m²` : "—", `${m.stock_actual} ${m.unidad_medida ?? "m"}`, `S/ ${Number(m.precio_unitario ?? 0).toFixed(2)}`, `S/ ${(Number(m.stock_actual) * Number(m.precio_unitario ?? 0)).toFixed(2)}`]),
        { title: "REPORTE VALORIZADO — MATERIALES", filename: `Kardex_Materiales_GUOR_${new Date().toLocaleDateString()}` }
      );
    }
  };

  const handleExportExcel = () => {
    if (!canExport) return toast.error("Sin permisos para exportar");
    if (activeTab === "insumos") {
      if (!filteredInsumos.length) return toast.error("No hay datos para exportar");
      exportToExcel(filteredInsumos.map((i: any) => ({
        "INSUMO": i.nombre.toUpperCase(), "CATEGORÍA": i.tipo,
        "STOCK ACTUAL": i.stock_actual, "U.M.": i.unidad_medida,
        "PRECIO REPOSICIÓN": Number(i.precio_unitario || 0).toFixed(2),
        "VALOR TOTAL STOCK": (i.stock_actual * Number(i.precio_unitario || 0)).toFixed(2),
        "STOCK MÍNIMO": i.stock_minimo,
        "ESTADO": i.stock_actual === 0 ? "AGOTADO" : i.stock_actual <= i.stock_minimo ? "STOCK BAJO" : "ÓPTIMO",
        "ÚLTIMA ACTUALIZACIÓN": i.updated_at ? new Date(i.updated_at).toLocaleDateString() : "N/A",
      })), { filename: `Kardex_Insumos_GUOR_${new Date().toISOString().split("T")[0]}` });
    } else {
      if (!filteredMateriales.length) return toast.error("No hay datos para exportar");
      exportToExcel(filteredMateriales.map((m: any) => ({
        "MATERIAL": m.nombre.toUpperCase(), "TIPO": m.tipo ?? "—",
        "COMPOSICIÓN": m.composicion ?? "—", "GRAMAJE (g/m²)": m.gramaje ?? "—",
        "COLOR": m.color ?? "—", "ANCHO TOTAL (m)": m.ancho_total ?? "—",
        "STOCK ACTUAL": m.stock_actual, "U.M.": m.unidad_medida ?? "metros",
        "PRECIO UNITARIO": Number(m.precio_unitario || 0).toFixed(2),
        "VALOR TOTAL STOCK": (Number(m.stock_actual) * Number(m.precio_unitario || 0)).toFixed(2),
        "STOCK MÍNIMO": m.stock_minimo,
        "ESTADO": m.stock_actual === 0 ? "AGOTADO" : m.stock_actual <= m.stock_minimo ? "STOCK BAJO" : "ÓPTIMO",
        "ÚLTIMA ACTUALIZACIÓN": m.updated_at ? new Date(m.updated_at).toLocaleDateString() : "N/A",
      })), { filename: `Kardex_Materiales_GUOR_${new Date().toISOString().split("T")[0]}` });
    }
    toast.success("Excel generado correctamente");
  };

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Verificando acceso...</p>
      </div>
    );
  }

  const isInsumos = activeTab === "insumos";
  const cargando = isInsumos ? cargandoInsumos : cargandoMateriales;
  const stats = isInsumos ? statsIns : statsMat;
  const statusFilter = isInsumos ? statusFilterIns : statusFilterMat;
  const setStatusFilter = isInsumos
    ? (v: string | null) => setStatusFilterIns(v)
    : (v: string | null) => setStatusFilterMat(v);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <AdminPageHeader
          title="Gestión de Inventario"
          description="Control de telas, avíos e insumos de Modas y Estilos GUOR"
          actionLabel={isInsumos ? "Nuevo Insumo" : "Nuevo Material"}
          onAction={canCreate ? () => isInsumos ? setIsCreateInsumoOpen(true) : setIsCreateMatOpen(true) : undefined}
        >
          {canExport && (
            <div className="flex gap-2 mr-2">
              <Button onClick={handleExportPDF} variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50 font-bold gap-2 h-11 active:scale-95 rounded-xl">
                <FileText className="w-5 h-5" /><span className="hidden sm:inline">PDF</span>
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 active:scale-95 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" /><span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          )}
        </AdminPageHeader>

        {/* Tabs */}
        <InventarioTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{ insumos: statsIns.total, materiales: statsMat.total }}
        />

        {/* Stats */}
        <InventarioStats
          stats={stats}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Toolbar */}
        <InventarioToolbar
          isInsumos={isInsumos}
          searchTermIns={searchTermIns} setSearchTermIns={setSearchTermIns}
          searchTermMat={searchTermMat} setSearchTermMat={setSearchTermMat}
          selectedTipoIns={selectedTipoIns} setSelectedTipoIns={setSelectedTipoIns}
          selectedTipoMat={selectedTipoMat} setSelectedTipoMat={setSelectedTipoMat}
          cargando={cargando}
          onRefresh={() => isInsumos ? obtenerInsumosList() : refetchMateriales()}
        />

        {/* Tabla */}
        {cargando ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Cargando {isInsumos ? "insumos" : "materiales"}...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {isInsumos ? (
                // ── SOLUCIÓN TYPESCRIPT: Forzamos el casteo limpio a 'as any' para unificar tipos con la tabla hijo ──
                <InsumosTable data={paginatedInsumos as any} loading={cargandoInsumos} canEdit={canEdit} canDelete={canDelete}
                  onEdit={(item: any) => { setSelectedInsumo(item); setDialogModeIns("edit"); }}
                  onDelete={(item: any) => { setSelectedInsumo(item); setDialogModeIns("archive"); }} />
              ) : (
                <MaterialesTable data={paginatedMateriales} loading={cargandoMateriales} canEdit={canEdit} canDelete={canDelete}
                  onEdit={(item: any) => { setSelectedMaterial(item); setDialogModeMat("edit"); }}
                  onDelete={(item: any) => { setSelectedMaterial(item); setDialogModeMat("archive"); }} />
              )}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{isInsumos ? paginatedInsumos.length : paginatedMateriales.length}</span> de <span className="font-bold text-gray-900">{isInsumos ? filteredInsumos.length : filteredMateriales.length}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => isInsumos ? setCurrentPageIns(p => p - 1) : setCurrentPageMat(p => p - 1)} disabled={isInsumos ? currentPageIns === 0 : currentPageMat === 0} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl flex items-center">
                  Página {(isInsumos ? currentPageIns : currentPageMat) + 1} de {(isInsumos ? totalPagesIns : totalPagesMat) || 1}
                </div>
                <Button variant="outline" size="sm" onClick={() => isInsumos ? setCurrentPageIns(p => p + 1) : setCurrentPageMat(p => p + 1)} disabled={isInsumos ? currentPageIns + 1 >= totalPagesIns : currentPageMat + 1 >= totalPagesMat} className="rounded-xl">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {canCreate && (
        <>
          <CreateInsumoDialog isOpen={isCreateInsumoOpen} onClose={() => setIsCreateInsumoOpen(false)} onSuccess={obtenerInsumosList} />
          <CreateMaterialDialog isOpen={isCreateMatOpen} onClose={() => setIsCreateMatOpen(false)} onSuccess={refetchMateriales} />
        </>
      )}
      {selectedInsumo && (
        <>
          <EditInsumoDialog isOpen={dialogModeIns === "edit"} insumo={selectedInsumo} onClose={() => setDialogModeIns(null)} onSuccess={obtenerInsumosList} />
          <DescontinuarInsumoDialog isOpen={dialogModeIns === "archive"} insumo={selectedInsumo} onClose={() => setDialogModeIns(null)} onSuccess={obtenerInsumosList} rolUsuario={role} />
        </>
      )}
      {selectedMaterial && (
        <>
          <EditMaterialDialog isOpen={dialogModeMat === "edit"} material={selectedMaterial} onClose={() => setDialogModeMat(null)} onSuccess={refetchMateriales} />
          <DescontinuarMaterialDialog isOpen={dialogModeMat === "archive"} material={selectedMaterial} onClose={() => setDialogModeMat(null)} onSuccess={refetchMateriales} rolUsuario={role} />
        </>
      )}
    </div>
  );
}