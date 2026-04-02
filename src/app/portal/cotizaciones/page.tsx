'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Download, RefreshCw, Eye, PenLine, FileText } from 'lucide-react';
import { usePortal } from '../_contexts/PortalContext';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { supabase } from '@/lib/supabase/client';
// Importación actualizada según los nuevos helpers
import { formatCurrency, formatDateLong, formatDocumentNumber } from '@/lib/helpers/format-helpers';
import { toast } from 'sonner';

// Estados actualizados al flujo B2B
type EstadoFiltro = 'todas' | 'borrador' | 'pendiente' | 'aceptada' | 'rechazada' | 'expirada' | 'convertida';

interface Cot {
  id: number; 
  numero: string; 
  total: number; 
  estado: string;
  created_at: string; 
  valida_hasta: string;
}

const FILTROS: { value: EstadoFiltro; label: string }[] = [
  { value: 'todas',      label: 'Todas' },
  { value: 'borrador',   label: 'Borradores' },
  { value: 'pendiente',  label: 'En Revisión' },
  { value: 'aceptada',   label: 'Aceptadas' },
  { value: 'convertida', label: 'En Orden' },
];

export default function HistorialCotizacionesPage() {
  const router = useRouter();
  const { cliente } = usePortal();
  const [cots, setCots] = useState<Cot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<EstadoFiltro>('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!cliente) return;
    const fetchCotizaciones = async () => {
      setLoading(true);
      let query = supabase
        .from('cotizaciones')
        .select('id, numero, total, estado, created_at, valida_hasta')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (filtro !== 'todas') query = query.eq('estado', filtro);

      const { data } = await query;
      setCots((data as unknown as Cot[]) ?? []);
      setLoading(false);
    };
    fetchCotizaciones();
  }, [cliente, filtro]);

  const handleRecotizar = async (cotId: number) => {
    const loadingToast = toast.loading('Duplicando cotización...');
    try {
      const res = await fetch(`/api/portal/cotizaciones/${cotId}/duplicar`, { method: 'POST' });
      if (!res.ok) throw new Error();
      
      const data = await res.json();
      toast.success('Cotización duplicada como borrador', { id: loadingToast });
      router.push(`/portal/cotizaciones/${data.id}`);
    } catch (error) {
      toast.error('Error al duplicar la cotización.', { id: loadingToast });
    }
  };

  const filtered = cots.filter(c =>
    !busqueda || c.numero.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial Comercial</h1>
          <p className="text-sm text-slate-500 mt-1">Gestione sus cotizaciones y solicitudes B2B.</p>
        </div>
        <Link
          href="/portal/cotizaciones/nueva"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
        >
          <Plus size={18} /> Generar Cotización
        </Link>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                filtro === f.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por N°..."
            className="h-10 w-full md:w-64 border border-slate-200 rounded-lg px-4 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabla Pro */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Sincronizando con el servidor...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emisión</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total (IGV Inc.)</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{c.numero}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDateLong(c.created_at)}</td>
                  <td className="px-6 py-4">
                    <EstadoBadge estado={c.estado} tipo="cotizacion" />
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {formatCurrency(c.total)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link 
                        href={`/portal/cotizaciones/${c.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </Link>

                      {c.estado === 'borrador' && (
                        <Link 
                          href={`/portal/cotizaciones/${c.id}/editar`}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                        >
                          <PenLine size={18} />
                        </Link>
                      )}

                      {(c.estado === 'aceptada' || c.estado === 'convertida') && (
                        <a 
                          href={`/api/portal/cotizaciones/${c.id}/pdf`} 
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                        >
                          <Download size={18} />
                        </a>
                      )}

                      {(c.estado === 'expirada' || c.estado === 'rechazada') && (
                        <button
                          onClick={() => handleRecotizar(c.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="Re-cotizar"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && !filtered.length && (
          <div className="py-20 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-slate-400" size={30} />
            </div>
            <p className="text-slate-500 font-medium">No se encontraron registros comercial.</p>
          </div>
        )}
      </div>
    </div>
  );
}