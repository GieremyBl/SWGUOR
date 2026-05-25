'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText, Search, RefreshCw, DollarSign,
  CheckCircle2, AlertTriangle, Calendar,
  ChevronLeft, ChevronRight, FileSpreadsheet, Eye,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportCotizacionesToPDF } from '@/lib/utils/export-utils';
import { exportToExcel } from '@/lib/utils/export-utils';
import type { CotizacionRow } from '@/lib/services/cotizaciones.service';
import { CotizacionActions } from '@/components/admin/cotizaciones/CotizacionActions';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import Link from 'next/link';

const PAGE_SIZE = 10;

type EstadoFiltro = string | null;

const ESTADO_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  borrador:   { bg: 'bg-slate-100',    text: 'text-slate-600',   label: 'Borrador'   },
  enviada:    { bg: 'bg-amber-100',    text: 'text-amber-700',   label: 'Enviada'    },
  aprobada:   { bg: 'bg-emerald-100',  text: 'text-emerald-700', label: 'Aprobada'   },
  convertida: { bg: 'bg-blue-100',     text: 'text-blue-700',    label: 'Convertida' },
  rechazada:  { bg: 'bg-red-100',      text: 'text-red-700',     label: 'Rechazada'  },
  expirada:   { bg: 'bg-orange-100',   text: 'text-orange-700',  label: 'Expirada'   },
};

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [stats, setStats] = useState({
    pendientes: 0,
    aprobadas: 0,
    expiradas: 0,
    totalValor: 0,
  });

  // Estados de carga para las exportaciones (Sincronizado con órdenes de compra)
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // ── Carga de datos ────────────────────────────────────────────────────────
  const loadCotizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cotizaciones', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar cotizaciones');
      const json = await res.json();
      const data: CotizacionRow[] = json.data ?? json;

      setCotizaciones(data);
      setStats({
        pendientes: data.filter((c) => c.estado === 'borrador' || c.estado === 'enviada').length,
        aprobadas: data.filter((c) => c.estado === 'aprobada' || c.estado === 'convertida').length,
        expiradas: data.filter((c) => c.estado === 'expirada').length,
        totalValor: data
          .filter((c) => c.estado !== 'rechazada' && c.estado !== 'expirada')
          .reduce((sum, c) => sum + c.monto, 0),
      });
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCotizaciones(); }, [loadCotizaciones]);

  // ── Filtrado y paginación ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return cotizaciones.filter((c) => {
      const matchSearch =
        c.cotizacion_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cliente ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descripcion ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = estadoFiltro === null || c.estado === estadoFiltro;
      return matchSearch && matchEstado;
    });
  }, [cotizaciones, searchTerm, estadoFiltro]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const resetPage = () => setCurrentPage(0);

  // ── LÓGICA DE EXPORTACIÓN EXCEL Y PDF ────────────────────────────────────────
  const handleExportPDF = async () => {
    if (filtered.length === 0) return toast.error('No hay datos para exportar');
    const toastId = toast.loading('Preparando PDF...');
    try {
      setExportingPDF(true);
      await exportCotizacionesToPDF(filtered, {
        title: 'REPORTE DE COTIZACIONES',
        filename: `Cotizaciones_GUOR_${new Date().toISOString().split('T')[0]}`,
      });
      toast.success('PDF generado correctamente', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el PDF', { id: toastId });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (filtered.length === 0) return toast.error('No hay datos para exportar');
    try {
      setExportingExcel(true);
      const data = filtered.map((c) => ({
        'N° Cotización': c.cotizacion_id,
        'Cliente': c.cliente ?? '---',
        'Monto (S/.)': c.monto,
        'Estado': c.estado.toUpperCase(),
        'Vencimiento': c.fecha_vencimiento,
        'Creación': c.fecha_creacion,
        'Descripción': c.descripcion ?? '---',
      }));
      exportToExcel(data, {
        filename: `Cotizaciones_GUOR_${new Date().toISOString().split('T')[0]}`,
        sheetName: 'Cotizaciones',
      });
      toast.success('Excel generado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar a Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <AdminPageHeader
            title="Cotizaciones"
            description="Gestión de propuestas comerciales de Modas y Estilos GUOR"
            actionLabel="Nueva Cotización"
            onAction={undefined}
          />
          <div className="flex items-center gap-3">
            {/* BOTÓN EXPORTAR EXCEL CON TU DISEÑO UNIFICADO */}
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              className="h-11 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 font-medium transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
              {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
            </Button>

            {/* BOTÓN EXPORTAR PDF CON TU DISEÑO UNIFICADO */}
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportingPDF || loading}
              className="h-11 rounded-xl border-red-200 hover:bg-red-50 hover:text-red-700 text-gray-600 font-medium transition-all"
            >
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={Calendar}
            color="orange"
            isActive={estadoFiltro === 'enviada'}
            onClick={() => { setEstadoFiltro(estadoFiltro === 'enviada' ? null : 'enviada'); resetPage(); }}
          />
          <StatCard
            title="Aprobadas"
            value={stats.aprobadas}
            icon={CheckCircle2}
            color="emerald"
            isActive={estadoFiltro === 'aprobada'}
            onClick={() => { setEstadoFiltro(estadoFiltro === 'aprobada' ? null : 'aprobada'); resetPage(); }}
          />
          <StatCard
            title="Expiradas"
            value={stats.expiradas}
            icon={AlertTriangle}
            color="orange"
            isActive={estadoFiltro === 'expirada'}
            onClick={() => { setEstadoFiltro(estadoFiltro === 'expirada' ? null : 'expirada'); resetPage(); }}
          />
          <StatCard
            title="Valor Activo"
            value={`S/ ${stats.totalValor.toLocaleString('es-PE')}`}
            icon={DollarSign}
            color="blue"
            disabled
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente o descripción..."
              className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
            />
          </div>
          <select
            value={estadoFiltro ?? 'todos'}
            onChange={(e) => { setEstadoFiltro(e.target.value === 'todos' ? null : e.target.value); resetPage(); }}
            className="h-11 px-4 border border-gray-200 rounded-xl text-xs font-bold uppercase bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="todos">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aprobada">Aprobada</option>
            <option value="convertida">Convertida</option>
            <option value="rechazada">Rechazada</option>
            <option value="expirada">Expirada</option>
          </select>
          <Button variant="outline" className="h-11 rounded-xl border-gray-200 hover:bg-gray-50" onClick={loadCotizaciones}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 border-b border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cotización</th>
                    <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Descripción</th>
                    <th className="text-right py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monto</th>
                    <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                    <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Vencimiento</th>
                    <th className="text-center py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="w-8 h-8 text-gray-300" />
                          <span className="text-gray-400 italic text-sm">No hay cotizaciones que mostrar</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginated.map((cot) => {
                    const badge = ESTADO_BADGE[cot.estado] ?? ESTADO_BADGE.borrador;
                    const isExpirada = cot.estado === 'expirada';
                    return (
                      <tr
                        key={cot.id}
                        className={`group border-b border-gray-50 hover:bg-slate-50/50 transition-colors ${isExpirada ? 'bg-orange-50/30' : ''}`}
                      >
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                            {cot.cotizacion_id}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-600 text-sm">{cot.cliente ?? '—'}</td>
                        <td className="py-4 px-5 text-slate-400 text-xs max-w-xs truncate hidden lg:table-cell">{cot.descripcion ?? '—'}</td>
                        <td className="py-4 px-5 text-right font-bold text-slate-800 text-sm">
                          S/ {cot.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-xs hidden md:table-cell">
                          {cot.fecha_vencimiento}
                          {isExpirada && (
                            <span className="ml-2 text-[10px] text-orange-600 font-bold uppercase">(Vencida)</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center">
                          {['borrador', 'enviada'].includes(cot.estado) ? (
                            <CotizacionActions
                              cotizacionId={cot.id}
                              estado={cot.estado}
                              validaHasta={cot.fecha_vencimiento}
                              onSuccess={loadCotizaciones}
                            />
                          ) : (
                            <Button variant="ghost" size="sm" className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90">
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginated.length}</span> de{' '}
                <span className="font-bold text-gray-900">{filtered.length}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border rounded-xl flex items-center">
                  Página {currentPage + 1} de {totalPages || 1}
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage + 1 >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}