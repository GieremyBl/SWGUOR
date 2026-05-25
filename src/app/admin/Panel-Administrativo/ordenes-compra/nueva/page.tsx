'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrdenCompraForm } from '@/components/admin/ordenes-compra/OrdenCompraForm';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Loader2 } from 'lucide-react';

export default function NuevaOrdenCompraPage() {
  const searchParams = useSearchParams();
  const cotizacionId = searchParams.get('cotizacion_id');
  const { can, isLoading: authLoading } = usePermissions();
  const [cotizacion, setCotizacion] = useState<{
    proveedor_id: number;
    estado: string;
  } | null>(null);
  const [loadingCot, setLoadingCot] = useState(!!cotizacionId);

  useEffect(() => {
    if (!cotizacionId) {
      setLoadingCot(false);
      return;
    }
    fetch(`/api/admin/cotizaciones-proveedor`)
      .then((r) => r.json())
      .then((json) => {
        const list = json.data ?? [];
        const found = list.find(
          (c: { id: number | string }) => String(c.id) === cotizacionId,
        );
        if (found) {
          setCotizacion({
            proveedor_id: Number(found.proveedor_id ?? found.proveedores?.id),
            estado: found.estado,
          });
        }
      })
      .finally(() => setLoadingCot(false));
  }, [cotizacionId]);

  if (authLoading || loadingCot) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!can('create', 'ordenes_compra')) {
    return (
      <p className="p-8 text-center text-slate-500">
        No tiene permisos para crear órdenes de compra.
      </p>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900 mb-8">
          {cotizacionId ? 'Generar orden de compra' : 'Nueva orden de compra'}
        </h1>
        <OrdenCompraForm
          cotizacionId={cotizacionId}
          proveedorIdPreselect={cotizacion ? String(cotizacion.proveedor_id) : null}
          modoCotizacion={!!cotizacionId}
        />
      </div>
    </div>
  );
}
