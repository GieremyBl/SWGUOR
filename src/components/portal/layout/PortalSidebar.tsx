'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingBag, Truck,
  ChevronRight, Settings, Package, PackageOpen,
  ShoppingCart, UserCircle
} from 'lucide-react';

import { cn } from '@/lib/utils';

const MENU_GROUPS = [
  {
    group: 'Menú Principal',
    items: [{ href: '/portal/dashboard', label: 'Inicio', icon: LayoutDashboard }],
  },
  {
    group: 'Comercial',
    items: [
      { href: '/portal/catalogo', label: 'Catálogo', icon: ShoppingBag },
      { href: '/portal/cotizaciones', label: 'Cotizaciones', icon: FileText },
      { href: '/portal/pedidos', label: 'Mis pedidos', icon: Package },
      { href: '/portal/compras', label: 'Confirmar compra', icon: ShoppingCart },

    ],
  },
  {
    group: 'Logística & Despachos',
    items: [
      { href: '/portal/seguimiento-pedido', label: 'Trazabilidad', icon: Truck },
      { href: '/portal/despachos', label: 'Envíos', icon: PackageOpen },

    ],
  },
  {
    group: 'Cuenta',
    items: [
      { href: '/portal/perfil', label: 'Mi Perfil', icon: UserCircle },
      { href: '/portal/configuracion', label: 'Ajustes', icon: Settings },
    ],
  },
];

interface PortalSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function PortalSidebar({ collapsed, onToggle }: PortalSidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-slate-200/80',
        'fixed left-0 top-0 z-40 bg-white',
        'transition-[width] duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[264px]',
      )}
    >
      {/* ── Logo Section (Mismo tamaño y bordes que el ERP) ── */}
      <div className={cn(
        'flex items-center border-b border-slate-100 shrink-0 overflow-hidden transition-all duration-300',
        collapsed ? 'h-20 px-3 justify-center' : 'h-20 px-5 gap-3.5 justify-start',
      )}>
        <div className="w-11 h-11 rounded-full border border-rose-500/30 bg-white flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-sm">
          <img src="/logo.png" alt="GUOR" className="w-full h-full object-cover rounded-full" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 overflow-hidden text-left animate-in fade-in duration-200">
            <p className="font-black text-slate-900 text-sm leading-none tracking-tight">Portal <span className="text-rose-500">Corporativo</span></p>
          </div>
        )}
      </div>

      {/* ── Navigation (Fluida, sin subtítulos molestos) ── */}
      <nav className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden py-4 text-left',
        collapsed ? 'px-2 space-y-2' : 'px-4 space-y-1.5',
      )}>
        {MENU_GROUPS.flatMap((g) => g.items).map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-xl transition-all duration-200 cursor-pointer select-none w-full text-left',
                collapsed ? 'justify-center p-3' : 'justify-start gap-x-4 px-4 py-2.5',
                isActive
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900',
              )}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.3 : 1.6}
                className="shrink-0"
              />
              {!collapsed && (
                <span className={cn(
                  'flex-1 text-[13.5px] font-medium truncate tracking-wide',
                  isActive && 'font-semibold text-rose-700',
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer / Toggle y Cerrar Sesión (Idéntico al ERP) ── */}
      <div className="shrink-0 border-t border-slate-100 p-2 space-y-1 text-left">

        {/* Botón de Contraer/Expandir del ERP */}
        <button
          onClick={onToggle}
          className={cn(
            'hidden lg:flex items-center w-full rounded-xl px-4 py-3 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200',
            collapsed ? 'justify-center p-3' : 'justify-start gap-3.5',
          )}
          title={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
            <ChevronRight
              size={16}
              className={cn(
                'absolute transition-all duration-300',
                collapsed ? 'opacity-100 rotate-0' : 'opacity-100 rotate-180',
              )}
            />
          </div>
          {!collapsed && (
            <span className="text-xs font-medium">Contraer</span>
          )}
        </button>
      </div>
    </aside>
  );
}