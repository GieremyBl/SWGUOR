'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText, Plus, FileSpreadsheet,
  Search, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import FichaTecnicasTable      from '@/components/admin/fichas-tecnicas/FichaTecnicasTable';
import FichasTecnicasFilters   from '@/components/admin/fichas-tecnicas/FichasTecnicasFilters';
import { FichasTecnicasStats } from '@/components/admin/fichas-tecnicas/FichasTecnicasStats';
import { toast } from 'sonner';

interface FichaTecnica {
  id:                    string;
  version:               string;
  estado:                string;
  descripcion_detallada: string | null;
  sam_total:             number | null;
  costo_estimado:        number | null;
  ficha_url:             string | null;
  created_at:            string;
  productos:             { id: string; nombre: string; sku: string; imagen_url: string | null } | null;
  ficha_medidas:         { id: string }[];
}

const PAGE_SIZE = 10;

export default function FichasTecnicasPage() {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  const [fichas, setFichas]         = useState<FichaTecnica[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [isLoading, setIsLoading]   = useState(true);

  const [searchTerm,         setSearchTerm]         = useState('');
  const [estadoFilter,       setEstadoFilter]       = useState('');
  const [sortOrder,          setSortOrder]          = useState<'asc' | 'desc' | 'none'>('none');
  const [selectedCategoria,  setSelectedCategoria]  = useState('all');
  const [statusFilter,       setStatusFilter]       = useState<string | null>(null);
  const [currentPage,        setCurrentPage]        = useState(0);

  // ✓ useCallback evita el warning de exhaustive-deps
  const fetchFichas = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (estadoFilter)              query.append('estado',    estadoFilter);
      if (searchTerm)                query.append('busqueda',  searchTerm);
      if (selectedCategoria !== 'all') query.append('categoria', selectedCategoria);

      const res  = await fetch(`/api/admin/fichas-tecnicas?${query.toString()}`);
      const json = await res.json();

      if (res.ok) {
        setFichas(json.data ?? []);
        if (json.categorias) setCategorias(json.categorias);
      } else {
        toast.error(json.error || 'Error al cargar fichas técnicas');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [estadoFilter, searchTerm, selectedCategoria]);

  // ✓ Un solo efecto — fetchFichas ya incluye las deps del debounce
  useEffect(() => {
    const t = setTimeout(() => fetchFichas(), 300);
    return () => clearTimeout(t);
  }, [fetchFichas]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, estadoFilter, selectedCategoria, sortOrder, statusFilter]);

  const fichasProcesadas = useMemo(() => {
    let result = [...fichas];
    if (statusFilter === 'activo')   result = result.filter(f => f.estado === 'activo');
    if (statusFilter === 'borrador') result = result.filter(f => f.estado === 'borrador');
    if (statusFilter === 'revision') result = result.filter(f => f.estado === 'revisión');
    if (sortOrder === 'asc')  result.sort((a, b) => (a.costo_estimado ?? 0) - (b.costo_estimado ?? 0));
    if (sortOrder === 'desc') result.sort((a, b) => (b.costo_estimado ?? 0) - (a.costo_estimado ?? 0));
    return result;
  }, [fichas, statusFilter, sortOrder]);

  const stats = useMemo(() => ({
    total:      fichas.length,
    activas:    fichas.filter(f => f.estado === 'activo').length,
    borradores: fichas.filter(f => f.estado === 'borrador').length,
    revision:   fichas.filter(f => f.estado === 'revisión').length,
  }), [fichas]);

  const totalPages    = Math.ceil(fichasProcesadas.length / PAGE_SIZE);
  const paginatedData = fichasProcesadas.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  if (authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Verificando permisos...</p>
    </div>
  );

  if (!can('view', 'fichas_tecnicas')) return (
    <div className="p-6 text-red-600">No tienes permisos para ver fichas técnicas</div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fichas Técnicas</h1>
            <p className="text-gray-500 text-sm">Control de fichas técnicas y especificaciones de Modas GUOR</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => toast.info('Exportar PDF próximamente')}
              className="bg-white border-red-200 text-red-700 hover:bg-red-50 font-bold gap-2 h-11 transition-all active:scale-95">
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">Reporte PDF</span>
            </Button>
            <Button variant="outline" onClick={() => toast.info('Exportar Excel próximamente')}
              className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-11 transition-all active:scale-95">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </Button>
            {can('create', 'ficha_tecnica') && (
              <Button onClick={() => router.push('/admin/Panel-Administrativo/fichas-tecnicas/nueva')}
                className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 px-6 text-white transition-all active:scale-95">
                <Plus className="w-5 h-5" /> Nueva Ficha
              </Button>
            )}
          </div>
        </div>

        <FichasTecnicasStats
          stats={stats}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, SKU o versión..."
              className="pl-10 h-11 border-gray-200 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 border-gray-200" onClick={fetchFichas}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <FichasTecnicasFilters
          searchTerm=""
          setSearchTerm={() => {}}
          estadoFilter={estadoFilter}
          setEstadoFilter={setEstadoFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          selectedCategoria={selectedCategoria}
          setSelectedCategoria={setSelectedCategoria}
          categorias={categorias}
          onRefresh={fetchFichas}
        />

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border animate-pulse">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sincronizando fichas...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <FichaTecnicasTable
              data={paginatedData}
              loading={isLoading}
              onEdit={can('edit', 'ficha_tecnica') ? (f) => router.push(`/admin/Panel-Administrativo/fichas-tecnicas/${f.id}`) : undefined}
            />
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-bold text-gray-900">{paginatedData.length}</span> de{' '}
                <span className="font-bold text-gray-900">{fichasProcesadas.length}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border rounded-lg flex items-center">
                  Página {currentPage + 1} de {totalPages || 1}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages}>
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