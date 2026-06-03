'use client';

import { use } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CotizacionProveedorDetalle,
  type CotizacionDetalleData,
} from '@/components/admin/cotizaciones-proveedor/CotizacionProveedorDetalle';
import {
  useCotizacionProveedorDetalle,
  useCotizacionProveedorDetalleAcciones,
} from '@/lib/hooks/useCotizacionesProveedor';

export default function CotizacionProveedorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: res, isLoading, error, refetch } = useCotizacionProveedorDetalle(id);
  const { cambiarEstado, anular, isChangingEstado } =
    useCotizacionProveedorDetalleAcciones(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !res?.success || !res.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Cotización no encontrada</p>
        <Link href="/admin/Panel-Administrativo/cotizaciones-proveedor">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  const cotizacion = res.data as unknown as CotizacionDetalleData;

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <CotizacionProveedorDetalle
        cotizacion={cotizacion}
        onEstadoChange={cambiarEstado}
        onAnular={anular}
        isChangingEstado={isChangingEstado}
        onPdfUploaded={() => refetch()}
      />
    </div>
  );
}
