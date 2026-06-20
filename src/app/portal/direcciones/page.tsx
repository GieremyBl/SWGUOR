'use client';

import { useCallback, useState } from 'react';
import { Loader2, MapPin, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DireccionClienteCard } from '@/components/portal/direcciones/DireccionClienteCard';
import { DireccionClienteFormModal } from '@/components/portal/direcciones/DireccionClienteFormModal';
import { useDireccionesClientePortal } from '@/lib/hooks/useDireccionesClientePortal';
import type {
  DireccionClienteCreateInput,
  DireccionClienteRecord,
  DireccionClienteUpdateInput,
} from '@/lib/schemas/direcciones-cliente';

export default function MisDireccionesPage() {
  const {
    direcciones,
    isLoading,
    refetch,
    crear,
    actualizar,
    eliminar,
    isCreating,
    isUpdating,
    isDeleting,
    accionId,
  } = useDireccionesClientePortal();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DireccionClienteRecord | null>(null);

  const abrirCrear = useCallback(() => {
    setEditTarget(null);
    setModalOpen(true);
  }, []);

  const abrirEditar = useCallback((direccion: DireccionClienteRecord) => {
    setEditTarget(direccion);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: DireccionClienteCreateInput | DireccionClienteUpdateInput) => {
      if (editTarget) {
        await actualizar({ id: editTarget.id, data: payload });
      } else {
        await crear(payload as DireccionClienteCreateInput);
      }
    },
    [actualizar, crear, editTarget],
  );

  const handleMarcarPrincipal = useCallback(
    async (id: string) => {
      await actualizar({ id, data: { es_principal: true } });
    },
    [actualizar],
  );

  const handleEliminar = useCallback(
    async (id: string) => {
      await eliminar(id);
    },
    [eliminar],
  );

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 text-white rounded-2xl shadow-lg bg-[#231e1d] shadow-[#231e1d]/20">
              <MapPin size={24} className="text-[#e4c28a]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Mis Direcciones</h1>
              <p className="text-sm text-slate-500">
                Administre sus sedes y puntos de entrega corporativos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <span className="inline-flex items-center">
                <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </span>
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl bg-rose-500 hover:bg-rose-600"
              onClick={abrirCrear}
            >
              <span className="inline-flex items-center">
                <Plus className="size-4 mr-2" />
                Agregar Nueva Dirección
              </span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-3" />
            <p className="text-sm font-medium">Cargando sus direcciones...</p>
          </div>
        ) : direcciones.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm">
              <MapPin className="w-6 h-6 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Sin direcciones registradas</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Agregue su primera sede para agilizar despachos y pedidos en el portal corporativo.
            </p>
            <Button
              type="button"
              className="rounded-xl bg-rose-500 hover:bg-rose-600"
              onClick={abrirCrear}
            >
              <span className="inline-flex items-center">
                <Plus className="size-4 mr-2" />
                Agregar Nueva Dirección
              </span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {direcciones.map((direccion) => (
              <DireccionClienteCard
                key={direccion.id}
                direccion={direccion}
                onEditar={abrirEditar}
                onMarcarPrincipal={handleMarcarPrincipal}
                onEliminar={handleEliminar}
                isUpdating={isUpdating && accionId === direccion.id}
                isDeleting={isDeleting && accionId === direccion.id}
              />
            ))}
          </div>
        )}
      </div>

      <DireccionClienteFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        direccion={editTarget}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />
    </>
  );
}
