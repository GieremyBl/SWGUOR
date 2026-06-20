'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrdenProduccionDetalle } from '@/lib/hooks/useOrdenProduccion';
import OrdenDetalleForm from '@/components/admin/ordenes-produccion/OrdenDetalleForm';
import { Loader2, Factory, ArrowLeft } from 'lucide-react';
import { OrdenProduccion } from '@/components/admin/ordenes-produccion/types';

export default function OrdenDetallePage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params?.id ? String(params.id) : '';

  const { data: orden, isLoading, isError } = useOrdenProduccionDetalle(targetId);

  const handleVolver = () => {
    router.push('/admin/Panel-Administrativo/ordenes-produccion');
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
            <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Cargando orden de producción...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !orden) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-slate-50/50 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="p-3 bg-rose-50 rounded-2xl">
            <Factory className="w-6 h-6 text-rose-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900">Orden no encontrada</p>
            <p className="text-xs text-gray-500">
              La orden{' '}
              <span className="font-mono font-semibold">#{targetId || '---'}</span>{' '}
              no existe o no está disponible.
            </p>
          </div>
          <button
            onClick={handleVolver}
            className="flex items-center gap-2 text-xs font-bold bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Regresar al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <OrdenDetalleForm
        open={true}
        initialData={orden as OrdenProduccion}
        onClose={handleVolver}
      />
    </div>
  );
}
