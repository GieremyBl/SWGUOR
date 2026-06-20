'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { GuiaRemisionDetalleView } from '@/components/admin/guias-remision/GuiaRemisionDetalleView';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useGuiasRemision, type GuiaRemisionDetalle } from '@/lib/hooks/useGuiasRemision';
import { FileText } from 'lucide-react';

export default function GuiaRemisionDetallePage() {
  const params = useParams<{ id: string }>();
  const { can, isLoading: authLoading } = usePermissions();
  const { obtenerGuiaPorId, loading, error } = useGuiasRemision();
  const [guia, setGuia] = useState<GuiaRemisionDetalle | null>(null);

  const canView = can('view', 'despachos');

  const cargar = useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await obtenerGuiaPorId(params.id);
      setGuia(data);
    } catch {
      toast.error('No se pudo cargar el detalle de la guía');
    }
  }, [obtenerGuiaPorId, params.id]);

  useEffect(() => {
    if (canView) void cargar();
  }, [canView, cargar]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-slate-500">
        Verificando permisos...
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-black text-slate-900">Acceso restringido</h2>
        <p className="text-slate-500 mt-2">No tienes permisos para ver esta guía.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminPageHeader
          title="Detalle de guía"
          description="Vista de solo lectura del documento de traslado"
          icon={FileText}
          showAction={false}
        />

        {loading && !guia && (
          <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
            Cargando guía...
          </div>
        )}

        {!loading && error && !guia && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        )}

        {guia && <GuiaRemisionDetalleView guia={guia} />}
      </div>
    </div>
  );
}
