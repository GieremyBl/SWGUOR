'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Route, XCircle } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { DespachosStats } from '@/components/admin/despachos/DespachosStats';
import { DespachosToolbar } from '@/components/admin/despachos/DespachosToolbar';
import { DespachoTable } from '@/components/admin/despachos/DespachosTable';
import {
  AgruparDespachosModal,
  type DespachoAgrupable,
} from '@/components/admin/despachos/AgruparDespachosModal';
import { Button } from '@/components/ui/button';

export interface Despacho {
  id: number;
  despacho_id: string;
  pedido_id: string;
  cliente: string;
  direccion: string;
  estado: 'preparando' | 'en_ruta' | 'entregado' | 'incidencia' | 'pendiente';
  tracking: string;
  fecha_despacho: string;
  fecha_entrega: string;
  grupo_id?: string | null;
  numero_parada?: number;
  total_paradas_grupo?: number;
  es_ruta_agrupada?: boolean;
  estado_entrega_parada?: string;
}

const PAGE_SIZE = 10;

export default function DespachosPage() {
  const { can, isLoading: authLoading, hasRole } = usePermissions();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [currentPage, setCurrentPage] = useState(0);
  const [iniciandoId, setIniciandoId] = useState<number | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [modalAgruparOpen, setModalAgruparOpen] = useState(false);

  const canView = can('view', 'despachos');
  const puedeGestionar = can('update', 'despachos');
  const puedeConfirmarEntrega = hasRole('ayudante');

  const cargarDatos = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/despachos');
      if (!response.ok) throw new Error('Error al cargar despachos');
      const { data } = await response.json();
      setDespachos(
        data.map((item: Record<string, unknown>) => ({
          id: Number(item.id),
          despacho_id: String(item.despacho_id),
          pedido_id: String(item.pedido_id),
          cliente: String(item.cliente),
          direccion: String(item.direccion),
          estado: item.estado as Despacho['estado'],
          tracking: String(item.tracking || 'S/N'),
          fecha_despacho: item.fecha_despacho
            ? new Date(String(item.fecha_despacho)).toLocaleDateString('es-PE')
            : '---',
          fecha_entrega: item.fecha_entrega
            ? new Date(String(item.fecha_entrega)).toLocaleDateString('es-PE')
            : 'Pendiente',
          grupo_id: item.grupo_id != null ? String(item.grupo_id) : null,
          numero_parada: Number(item.numero_parada ?? 1),
          total_paradas_grupo: Number(item.total_paradas_grupo ?? 1),
          es_ruta_agrupada: Boolean(item.es_ruta_agrupada),
          estado_entrega_parada: String(item.estado_entrega_parada ?? 'en_espera'),
        })),
      );
      setSeleccionados(new Set());
    } catch {
      toast.error('No se pudieron sincronizar los despachos');
    } finally {
      setLoading(false);
    }
  }, [canView]);

  const handleIniciarRuta = useCallback(
    async (despachoId: number) => {
      setIniciandoId(despachoId);
      try {
        const res = await fetch(`/api/admin/despachos/${despachoId}/iniciar-ruta`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'No se pudo iniciar la ruta');
        toast.success('Ruta iniciada — ya puede confirmar entregas por parada');
        await cargarDatos();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error al iniciar ruta');
      } finally {
        setIniciandoId(null);
      }
    },
    [cargarDatos],
  );

  const toggleSeleccion = useCallback((id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!authLoading) cargarDatos();
  }, [authLoading, cargarDatos]);

  const filtered = useMemo(
    () =>
      despachos.filter((d) => {
        const matchesEstado = filtroEstado === 'todos' || d.estado === filtroEstado;
        const matchesSearch =
          d.despacho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.tracking.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesEstado && matchesSearch;
      }),
    [despachos, filtroEstado, searchTerm],
  );

  const candidatosAgrupar: DespachoAgrupable[] = useMemo(() => {
    return despachos
      .filter((d) => seleccionados.has(d.id) && d.estado === 'preparando' && !d.es_ruta_agrupada)
      .map((d) => ({
        id: d.id,
        despacho_id: d.despacho_id,
        pedido_id: d.pedido_id,
        cliente: d.cliente,
        direccion: d.direccion,
        fecha_entrega: d.fecha_entrega,
      }));
  }, [despachos, seleccionados]);

  const stats = useMemo(
    () => ({
      total: despachos.length,
      preparando: despachos.filter((d) => d.estado === 'preparando').length,
      transito: despachos.filter((d) => d.estado === 'en_ruta').length,
      entregados: despachos.filter((d) => d.estado === 'entregado').length,
    }),
    [despachos],
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  if (authLoading) return <LoadingSpinner />;
  if (!canView) return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <AdminPageHeader
          title="Gestión de Despachos"
          description="Monitoreo de logística, rutas agrupadas y última milla"
          actionLabel="Nuevo Despacho"
          onAction={undefined}
        />

        <DespachosStats
          stats={stats}
          filtroEstado={filtroEstado}
          onFiltroChange={(f) => {
            setFiltroEstado(f);
            setCurrentPage(0);
          }}
        />

        <DespachosToolbar
          searchTerm={searchTerm}
          onSearchChange={(v) => {
            setSearchTerm(v);
            setCurrentPage(0);
          }}
          loading={loading}
          onRefresh={cargarDatos}
        />

        {puedeGestionar && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <p className="text-xs text-indigo-800 flex-1 min-w-[200px]">
              Selecciona 2 o más despachos en <strong>preparando</strong> (clientes distintos) para
              armar una ruta del mismo día.
            </p>
            <Button
              type="button"
              size="sm"
              disabled={candidatosAgrupar.length < 2}
              onClick={() => setModalAgruparOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Route className="w-4 h-4 mr-1.5" />
              Agrupar ruta ({candidatosAgrupar.length})
            </Button>
          </div>
        )}

        <DespachoTable
          despachos={paginated}
          loading={loading}
          iniciandoId={iniciandoId}
          seleccionados={seleccionados}
          puedeGestionar={puedeGestionar}
          puedeConfirmarEntrega={puedeConfirmarEntrega}
          onToggleSeleccion={toggleSeleccion}
          onIniciarRuta={handleIniciarRuta}
        />

        {totalPages > 1 && (
          <p className="text-center text-xs text-gray-400">
            Página {currentPage + 1} de {totalPages}
          </p>
        )}
      </div>

      <AgruparDespachosModal
        open={modalAgruparOpen}
        onOpenChange={setModalAgruparOpen}
        candidatos={candidatosAgrupar}
        onAgrupado={cargarDatos}
      />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50/50">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm font-black uppercase tracking-widest animate-pulse">
        Sincronizando Logística...
      </p>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50/50 text-center p-6">
      <div className="p-4 bg-red-50 rounded-full mb-4">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
        Acceso Restringido
      </h2>
      <p className="text-slate-500 max-w-sm mt-2">
        No cuentas con los permisos necesarios para visualizar el módulo de logística.
      </p>
    </div>
  );
}
