'use client';

import { use } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrdenCompraDetalle } from '@/lib/hooks/useOrdenesCompra';
import { OrdenCompraDetalle } from '@/components/admin/ordenes-compra/detalle/OrdenCompraDetalle';
import type { OrdenCompraRow } from '@/components/admin/ordenes-compra/types';

export default function OrdenCompraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = useOrdenCompraDetalle(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50/30">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Orden de compra no encontrada</p>
        <Link href="/admin/Panel-Administrativo/ordenes-compra">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  return (
    <OrdenCompraDetalle
      key={`${id}-${(data as OrdenCompraRow).updated_at}`}
      orden={data as OrdenCompraRow}
    />
  );
}
