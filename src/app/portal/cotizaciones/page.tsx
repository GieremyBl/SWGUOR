'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';
import { usePortal } from '@/lib/hooks/usePortal';
import { toast } from 'sonner';
import { CotizacionTabla } from '@/components/portal/cotizaciones/CotizacionTabla';
import { CotizacionBarraFiltros, type EstadoFiltro } from '@/components/portal/cotizaciones/CotizacionBarraFiltros';
import type { CotizacionFila } from '@/components/portal/cotizaciones/CotizacionAccionesFila';

// ── Página principal ────────────────────────────────────────────────────────
export default function HistorialCotizacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cliente } = usePortal();

  const [cots, setCots] = useState<CotizacionFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<EstadoFiltro>('todas');
  const [busqueda, setBusqueda] = useState('');

  // ── Fetch via API route (tiene auth correcta) ───────────────────────────
  const fetchCotizaciones = useCallback(async () => {
    if (!cliente?.id) return;
    setLoading(true);
    try {
      const params = filtro !== 'todas' ? `?estado=${filtro}` : '';
      const res = await fetch(`/api/portal/cotizaciones${params}`, { cache: 'no-store' });

      if (!res.ok) throw new Error('Error al cargar cotizaciones');

      const { data } = await res.json();

      const dataFormateada: CotizacionFila[] = (data ?? []).map((c: any) => ({
        id: Number(c.id),
        numero: c.numero ?? `COT-${c.id}`,
        total: Number(c.total) || 0,
        estado: c.estado ?? 'borrador',
        created_at: c.created_at ?? new Date().toISOString(),
        valida_hasta: c.valida_hasta ?? '',
      }));

      setCots(dataFormateada);
    } catch (e) {
      toast.error('No se pudieron cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  }, [cliente?.id, filtro]);

  useEffect(() => {
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  // Refresco automático al redirigir desde nueva cotización
  useEffect(() => {
    if (searchParams.get('nueva') !== 'true') return;
    const timer = setTimeout(() => {
      fetchCotizaciones();
      router.replace('/portal/cotizaciones');
    }, 800);
    return () => clearTimeout(timer);
  }, [searchParams, fetchCotizaciones, router]);

  // ── Duplicar cotización ─────────────────────────────────────────────────
  const handleRecotizar = async (cotId: number) => {
    const tid = toast.loading('Duplicando cotización...');
    try {
      const res = await fetch(`/api/portal/cotizaciones/${cotId}/duplicar`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      toast.success('Cotización duplicada como borrador', { id: tid });
      router.push(`/portal/cotizaciones/${data.id}`);
    } catch {
      toast.error('Error al duplicar la cotización', { id: tid });
    }
  };

  const filtered = cots.filter(
    c => !busqueda || c.numero.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 text-white rounded-2xl shadow-lg bg-guor-gold shadow-guor-gold/30">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Historial Comercial</h1>
            <p className="text-sm text-slate-500">Gestione sus cotizaciones y solicitudes B2B.</p>
          </div>
        </div>
        <Link
          href="/portal/cotizaciones/nueva"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg bg-guor-gold hover:bg-guor-700 active:scale-95 shadow-guor-gold/30"
        >
          <Plus size={18} /> Nueva Cotización
        </Link>
      </div>

      {/* Filtros + búsqueda */}
      <CotizacionBarraFiltros
        filtro={filtro}
        setFiltro={setFiltro}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
      />

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <CotizacionTabla
          cots={filtered}
          loading={loading}
          onRecotizar={handleRecotizar}
        />
      </div>
    </div>
  );
}