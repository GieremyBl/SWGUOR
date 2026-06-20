'use client';

import { ShoppingBag, Clock, Factory, MessageCircle } from 'lucide-react';

const TABS = [
  { id: 'items',       label: 'Items',       icon: ShoppingBag },
  { id: 'seguimiento', label: 'Seguimiento', icon: Clock       },
  { id: 'produccion',  label: 'Producción',  icon: Factory     },
  { id: 'asistencia',  label: 'Asistencia',  icon: MessageCircle },
] as const;

export type TabId = typeof TABS[number]['id'];

interface PedidoDetalleTabsProps {
  activeTab:    TabId;
  totalOrdenes: number;
  chatPendiente?: boolean;
  onTabChange:  (tab: TabId) => void;
}

export function PedidoDetalleTabs({
  activeTab,
  totalOrdenes,
  chatPendiente = false,
  onTabChange,
}: PedidoDetalleTabsProps) {
  return (
    <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === id
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Icon size={13} />
          {label}
          {id === 'produccion' && totalOrdenes > 0 && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              activeTab === 'produccion' ? 'bg-white/20 text-white' : 'bg-pink-50 text-pink-600'
            }`}>
              {totalOrdenes}
            </span>
          )}
          {id === 'asistencia' && chatPendiente && (
            <span
              className="w-2 h-2 rounded-full bg-red-500 shrink-0"
              aria-label="Atención pendiente"
            />
          )}
        </button>
      ))}
    </div>
  );
}
