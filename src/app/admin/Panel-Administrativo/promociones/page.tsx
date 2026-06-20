'use client';

import { useState } from 'react';
import { Tag, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { CampanasPanel } from '@/components/admin/promociones/CampanasPanel';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';

const TABS = [
  { id: 'promociones', label: 'Promociones', icon: Tag },
  { id: 'ofertas', label: 'Ofertas', icon: Gift },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function PromocionesPage() {
  const { can, isLoading: authLoading } = usePermissions();
  const [tab, setTab] = useState<TabId>('promociones');

  const canView = can('view', 'promociones');
  const canCreate = can('create', 'promociones');
  const canEdit = can('edit', 'promociones');
  const canArchive = can('archive', 'promociones');

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
        No tienes permisos para gestionar promociones y ofertas.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Tag className="w-7 h-7 text-amber-700" />
          Promociones y Ofertas
        </h1>
        <p className="text-sm text-slate-500">
          Campañas promocionales y ofertas comerciales con escalas de descuento integradas
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
              tab === id
                ? 'bg-amber-50 text-amber-900 border border-b-0 border-amber-200'
                : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'promociones' && (
        <CampanasPanel
          tipo="promocion"
          canCreate={canCreate}
          canEdit={canEdit}
          canArchive={canArchive}
        />
      )}
      {tab === 'ofertas' && (
        <CampanasPanel
          tipo="oferta"
          canCreate={canCreate}
          canEdit={canEdit}
          canArchive={canArchive}
        />
      )}
    </div>
  );
}
