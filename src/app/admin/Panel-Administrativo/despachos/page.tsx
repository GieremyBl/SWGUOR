'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { DespachosStats }   from '@/components/admin/despachos/DespachosStats';
import { DespachosToolbar } from '@/components/admin/despachos/DespachosToolbar';
import { DespachoTable }   from '@/components/admin/despachos/DespachosTable';
import { DespachoDetalleDialog } from '@/components/admin/despachos/DespachoDetalleDialog';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { getUsuarioData } from '@/lib/helpers/usuarios-helpers';

export interface Despacho {
  id:             number;
  despacho_id:    string;
  pedido_id:      string;
  cliente:        string;
  direccion:      string;
  cantidad_pedida: number;
  estado:         string;
  tracking:       string;
  fecha_despacho: string;
  fecha_entrega:  string;
}

const PAGE_SIZE = 10;

export default function DespachosPage() {
  const { can, role, isLoading: authLoading } = usePermissions();
  const [despachos, setDespachos]       = useState<Despacho[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [currentPage, setCurrentPage]   = useState(0);
  const [iniciandoId, setIniciandoId]   = useState<number | null>(null);
  const [verificandoId, setVerificandoId] = useState<number | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleDespacho, setDetalleDespacho] = useState<Despacho | null>(null);
  const [perfilAyudante, setPerfilAyudante] = useState<{ nombreCompleto: string | null; placaVehiculo: string | null } | null>(null);

  const canView = can('view', 'despachos');

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { data } = await getUsuarioData(session.user.id);
        const payload = data as any;
        setPerfilAyudante({
          nombreCompleto: payload?.nombre_completo ?? null,
          placaVehiculo: null,
        });
      } catch {
        setPerfilAyudante(null);
      }
    };

    if (canView) void cargarPerfil();
  }, [canView]);

  const cargarDatos = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/despachos');
      if (!response.ok) throw new Error('Error al cargar despachos');
      const { data } = await response.json();
      setDespachos(data.map((item: any) => ({
        id:             item.id,
        despacho_id:    item.despacho_id,
        pedido_id:      String(item.pedido_id),
        cliente:        item.cliente,
        direccion:      item.direccion,
        cantidad_pedida: Number(item.cantidad_pedida ?? 0),
        estado:         item.estado,
        tracking:       item.tracking || 'S/N',
        fecha_despacho: item.fecha_despacho ? new Date(item.fecha_despacho).toLocaleDateString('es-PE') : '---',
        fecha_entrega:  item.fecha_entrega  ? new Date(item.fecha_entrega).toLocaleDateString('es-PE')  : 'Pendiente',
      })));
    } catch {
      toast.error('No se pudieron sincronizar los despachos');
    } finally {
      setLoading(false);
    }
  }, [canView]);

  const handleIniciarRuta = useCallback(async (despachoId: number) => {
    setIniciandoId(despachoId);
    try {
      const res = await fetch(`/api/admin/despachos/${despachoId}/iniciar-ruta`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo iniciar la ruta');
      toast.success('Despacho en ruta — ya puede confirmar la entrega');
      await cargarDatos();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al iniciar ruta');
    } finally {
      setIniciandoId(null);
    }
  }, [cargarDatos]);

  const handleVerificarAlmacen = useCallback(async (despachoId: number) => {
    const despacho = despachos.find((d) => d.id === despachoId);
    if (!despacho) {
      toast.error('No se encontró el despacho seleccionado');
      return;
    }

    const input = window.prompt(
      `Ingrese la cantidad verificada en almacén para ${despacho.despacho_id} (pedido: ${despacho.cantidad_pedida}):`,
      String(despacho.cantidad_pedida),
    );

    if (input == null) return;

    const cantidad = Number(input);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      toast.error('Debe ingresar una cantidad entera mayor a cero');
      return;
    }

    setVerificandoId(despachoId);
    try {
      const res = await fetch(`/api/admin/despachos/${despachoId}/verificar-almacen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad_verificada: cantidad }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo registrar verificación de almacén');

      toast.success('Verificación de almacén registrada correctamente');
      await cargarDatos();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al verificar almacén');
    } finally {
      setVerificandoId(null);
    }
  }, [despachos, cargarDatos]);

  const handleVerSeguimiento = useCallback((despachoId: number) => {
    const despacho = despachos.find((item) => item.id === despachoId) ?? null;
    setDetalleDespacho(despacho);
    setDetalleOpen(Boolean(despacho));
  }, [despachos]);

  useEffect(() => { if (!authLoading) cargarDatos(); }, [authLoading, cargarDatos]);

  const filtered = useMemo(() => despachos.filter((d) => {
    const matchesEstado  = filtroEstado === 'todos' || d.estado === filtroEstado;
    const matchesSearch  =
      d.despacho_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tracking.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEstado && matchesSearch;
  }), [despachos, filtroEstado, searchTerm]);

  const stats = useMemo(() => ({
    total:      despachos.length,
    preparando: despachos.filter(d => d.estado === 'preparando').length,
    transito:   despachos.filter(d => d.estado === 'en_ruta').length,
    entregados: despachos.filter(d => d.estado === 'entregado').length,
  }), [despachos]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  if (authLoading) return <LoadingSpinner />;
  if (!canView)    return <AccessDenied />;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        <AdminPageHeader
          title="Gestión de Despachos"
          description="Monitoreo de logística y última milla en tiempo real"
          actionLabel="Nuevo Despacho"
          onAction={undefined}
        />

        <DespachosStats
          stats={stats}
          filtroEstado={filtroEstado}
          onFiltroChange={(f) => { setFiltroEstado(f); setCurrentPage(0); }}
        />

        <DespachosToolbar
          searchTerm={searchTerm}
          onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(0); }}
          loading={loading}
          onRefresh={cargarDatos}
        />

        <DespachoTable
          despachos={paginated}
          loading={loading}
          role={role}
          iniciandoId={iniciandoId}
          verificandoId={verificandoId}
          onIniciarRuta={handleIniciarRuta}
          onVerificarAlmacen={handleVerificarAlmacen}
          onVerSeguimiento={handleVerSeguimiento}
        />
      </div>

      {detalleDespacho && (
        <DespachoDetalleDialog
          open={detalleOpen}
          onOpenChange={setDetalleOpen}
          despacho={detalleDespacho}
          perfilAyudante={perfilAyudante}
          onSuccess={cargarDatos}
        />
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50/50">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm font-black uppercase tracking-widest animate-pulse">Sincronizando Logística...</p>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50/50 text-center p-6">
      <div className="p-4 bg-red-50 rounded-full mb-4">
        <XCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Acceso Restringido</h2>
      <p className="text-slate-500 max-w-sm mt-2">No cuentas con los permisos necesarios para visualizar el módulo de logística.</p>
    </div>
  );
}