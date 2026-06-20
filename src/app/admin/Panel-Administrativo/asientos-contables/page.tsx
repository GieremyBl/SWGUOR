'use client';

import { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import {
  AsientosContablesToolbar,
  type AsientosContablesFiltros,
} from '@/components/admin/asientos-contables/AsientosContablesToolbar';
import { AsientosContablesTable } from '@/components/admin/asientos-contables/AsientosContablesTable';
import {
  calcularTotalesAsientos,
  filtrarAsientosContables,
  normalizarAsientoFila,
} from '@/lib/helpers/asientos-contables-filtro.helper';
import { useAsientosContables } from '@/lib/hooks/useAsientosContables';
import { usePermissions } from '@/lib/hooks/usePermissions';

const FILTROS_INICIALES: AsientosContablesFiltros = {
  fecha_desde: '',
  fecha_hasta: '',
  cuenta: 'todas',
  busqueda: '',
};

export default function AsientosContablesPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const { asientos, isLoading } = useAsientosContables();
  const [filtros, setFiltros] = useState<AsientosContablesFiltros>(FILTROS_INICIALES);

  const canView = can('view', 'asientos_contables');

  const filas = useMemo(
    () => (asientos as Record<string, unknown>[]).map(normalizarAsientoFila),
    [asientos],
  );

  const filtrados = useMemo(
    () => filtrarAsientosContables(filas, filtros),
    [filas, filtros],
  );

  const totales = useMemo(() => calcularTotalesAsientos(filtrados), [filtrados]);

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
        <p className="text-slate-500 mt-2">No tienes permisos para ver el libro diario.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="Libro Diario"
          description="Asientos contables registrados en el sistema"
          icon={BookOpen}
          showAction={false}
        />

        <AsientosContablesToolbar filtros={filtros} onChange={setFiltros} />

        <p className="text-xs text-slate-500 px-1">
          {filtrados.length} asiento(s) en el período filtrado · {filas.length} total en base
        </p>

        <AsientosContablesTable
          asientos={filtrados}
          isLoading={isLoading}
          totales={totales}
        />
      </div>
    </div>
  );
}
