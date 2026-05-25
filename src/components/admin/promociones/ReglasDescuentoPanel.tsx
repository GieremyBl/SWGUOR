'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Ban, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReglasDescuento } from '@/lib/hooks/usePromocionesOfertas';
import type { ReglaDescuentoForm, ReglaDescuentoRow } from '@/lib/schemas/promociones-ofertas';
import { ReglaDescuentoFormModal } from './ReglaDescuentoFormModal';
import { ActivoBadge } from './ActivoBadge';
import { formatFecha } from './utils';

const PAGE_SIZE = 12;

interface Props {
  canCreate: boolean;
  canEdit: boolean;
  canArchive: boolean;
}

export function ReglasDescuentoPanel({ canCreate, canEdit, canArchive }: Props) {
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activoFilter, setActivoFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReglaDescuentoRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const {
    items,
    pagination,
    isLoading,
    refetch,
    save,
    deactivate,
    isSaving,
    isDeactivating,
  } = useReglasDescuento({
    page,
    limit: PAGE_SIZE,
    busqueda: debounced,
    activoFilter,
    editingId: editing?.id,
  });

  const handleSave = (data: ReglaDescuentoForm) => {
    save(data);
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Buscar regla..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="h-9 rounded-md border px-3 text-sm"
            value={activoFilter}
            onChange={(e) => {
              setActivoFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {canCreate && (
          <Button
            className="bg-amber-700 hover:bg-amber-800"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Nueva regla
          </Button>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3 font-semibold">Nombre</th>
              <th className="text-left p-3 font-semibold">Beneficio</th>
              <th className="text-left p-3 font-semibold">Condiciones</th>
              <th className="text-left p-3 font-semibold">Vigencia</th>
              <th className="text-left p-3 font-semibold">Estado</th>
              <th className="text-right p-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No hay reglas registradas
                </td>
              </tr>
            )}
            {items.map((r: ReglaDescuentoRow) => (
              <tr key={String(r.id)} className="border-t hover:bg-slate-50/80">
                <td className="p-3 font-medium">{r.nombre}</td>
                <td className="p-3">{Number(r.valor_descuento)}% subtotal</td>
                <td className="p-3 text-slate-600">
                  Mín. {r.cantidad_min} u.
                  {r.categorias?.nombre ? ` · ${r.categorias.nombre}` : ''}
                </td>
                <td className="p-3 text-slate-600 text-xs">
                  {formatFecha(r.fecha_inicio)} — {formatFecha(r.fecha_fin)}
                </td>
                <td className="p-3">
                  <ActivoBadge activo={r.activo} />
                </td>
                <td className="p-3 text-right space-x-1">
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(r);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {canArchive && r.activo !== false && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isDeactivating}
                      onClick={() => deactivate(r.id)}
                    >
                      <Ban className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-600 self-center">
            Pág. {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {showForm && (
        <ReglaDescuentoFormModal
          regla={editing}
          isSaving={isSaving}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
