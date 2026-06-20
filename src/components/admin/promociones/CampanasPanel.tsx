'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Ban, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePromociones, useOfertas } from '@/lib/hooks/usePromocionesOfertas';
import type { CampanaConEscalasForm, CampanaRow } from '@/lib/schemas/promociones-ofertas';
import { CampanaFormModal } from './CampanaFormModal';
import { ActivoBadge } from './ActivoBadge';
import { formatFecha } from './utils';

const PAGE_SIZE = 12;

type TipoCampana = 'promocion' | 'oferta';

interface Props {
  tipo: TipoCampana;
  canCreate: boolean;
  canEdit: boolean;
  canArchive: boolean;
}

export function CampanasPanel({ tipo, canCreate, canEdit, canArchive }: Props) {
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activoFilter, setActivoFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CampanaRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const hookOpts = {
    page,
    limit: PAGE_SIZE,
    busqueda: debounced,
    activoFilter,
    editingId: editing?.id,
    enabled: true,
  };

  const promoHook = usePromociones({
    ...hookOpts,
    enabled: tipo === 'promocion',
  });
  const ofertaHook = useOfertas({
    ...hookOpts,
    enabled: tipo === 'oferta',
  });
  const { items, pagination, isLoading, refetch, save, deactivate, isSaving, isDeactivating } =
    tipo === 'promocion' ? promoHook : ofertaHook;

  const label = tipo === 'promocion' ? 'promoción' : 'oferta';

  const handleSave = (data: CampanaConEscalasForm) => {
    save(data);
    setShowForm(false);
    setEditing(null);
  };

  const countReglas = (row: CampanaRow) => {
    const extended = row as CampanaRow & {
      promocion_reglas?: unknown[];
      oferta_reglas?: unknown[];
    };
    const v =
      tipo === 'promocion' ? extended.promocion_reglas : extended.oferta_reglas;
    return Array.isArray(v) ? v.length : 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder={`Buscar ${label}...`}
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
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
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
            <Plus className="w-4 h-4 mr-1" /> Nueva {label}
          </Button>
        )}
      </div>

      <div className="rounded-2xl border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3 font-semibold">Nombre</th>
              <th className="text-left p-3 font-semibold">Escalas</th>
              <th className="text-left p-3 font-semibold">Vigencia</th>
              <th className="text-left p-3 font-semibold">Estado</th>
              <th className="text-right p-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No hay registros
                </td>
              </tr>
            )}
            {items.map((row: CampanaRow) => (
              <tr key={String(row.id)} className="border-t hover:bg-slate-50/80">
                <td className="p-3">
                  <p className="font-medium">{row.nombre}</p>
                  {row.descripcion && (
                    <p className="text-xs text-slate-500 line-clamp-1">{row.descripcion}</p>
                  )}
                </td>
                <td className="p-3">{countReglas(row)} escala(s)</td>
                <td className="p-3 text-slate-600 text-xs">
                  {formatFecha(row.fecha_inicio)}
                  {row.fecha_fin ? ` — ${formatFecha(row.fecha_fin)}` : ' — Sin fin'}
                </td>
                <td className="p-3">
                  <ActivoBadge activo={row.activo} />
                </td>
                <td className="p-3 text-right space-x-1">
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(row);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {canArchive && row.activo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isDeactivating}
                      onClick={() => deactivate(row.id)}
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

      <CampanaFormModal
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditing(null);
          }
        }}
        tipo={tipo}
        campana={editing}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  );
}
