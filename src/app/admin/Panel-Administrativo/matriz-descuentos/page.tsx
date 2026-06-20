'use client';

import { Table2 } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { MatrizDescuentosView } from '@/components/admin/matriz-descuentos/MatrizDescuentosView';

export default function MatrizDescuentosPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const canView = can('view', 'promociones');

  if (authLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-8 text-center text-slate-600">
        No tienes permisos para ver la matriz de precios.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[96rem] mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Table2 className="w-7 h-7 text-amber-700" />
          Matriz de Precios
        </h1>
        <p className="text-sm text-slate-500">
          Auditoría de descuentos activos por producto, colisiones y precio final estimado
        </p>
      </header>

      <MatrizDescuentosView />
    </div>
  );
}
