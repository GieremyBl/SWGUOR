'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import {
  GuiasRemisionToolbar,
  type GuiasRemisionFiltros,
} from '@/components/admin/guias-remision/GuiasRemisionToolbar';
import { GuiasRemisionTable } from '@/components/admin/guias-remision/GuiasRemisionTable';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useGuiasRemision } from '@/lib/hooks/useGuiasRemision';
import type { GuiaRemision } from '@/lib/schemas/guias-remision';

const FILTROS_INICIALES: GuiasRemisionFiltros = {
  busqueda: '',
  tipo: 'todos',
  estado: 'todos',
};

function filtrarGuias(guias: GuiaRemision[], filtros: GuiasRemisionFiltros): GuiaRemision[] {
  const q = filtros.busqueda.trim().toLowerCase();

  return guias.filter((guia) => {
    if (filtros.tipo !== 'todos' && guia.tipo !== filtros.tipo) return false;
    if (filtros.estado !== 'todos' && guia.estado !== filtros.estado) return false;
    if (!q) return true;

    const texto = [
      guia.numero,
      guia.origen_direccion,
      guia.destino_direccion,
      guia.transportista,
      guia.pedido_id,
    ]
      .join(' ')
      .toLowerCase();

    return texto.includes(q);
  });
}

export default function GuiasRemisionPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const { guias, loading, obtenerGuias } = useGuiasRemision();
  const [filtros, setFiltros] = useState<GuiasRemisionFiltros>(FILTROS_INICIALES);

  const canView = can('view', 'despachos');

  const cargar = useCallback(async () => {
    try {
      await obtenerGuias();
    } catch {
      toast.error('No se pudieron cargar las guías de remisión');
    }
  }, [obtenerGuias]);

  useEffect(() => {
    if (canView) void cargar();
  }, [canView, cargar]);

  const guiasFiltradas = useMemo(
    () => filtrarGuias(guias, filtros),
    [guias, filtros],
  );

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
        <p className="text-slate-500 mt-2">No tienes permisos para ver guías de remisión.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="Guías de Remisión"
          description="Consulta documentos de traslado emitidos para logística y despacho"
          icon={FileText}
          showAction={false}
        />

        <GuiasRemisionToolbar filtros={filtros} onChange={setFiltros} />

        <p className="text-xs text-slate-500 px-1">
          {guiasFiltradas.length} guía(s) mostrada(s) de {guias.length} registrada(s)
        </p>

        <GuiasRemisionTable guias={guiasFiltradas} isLoading={loading} />
      </div>
    </div>
  );
}
