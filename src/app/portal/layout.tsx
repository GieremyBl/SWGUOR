'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingBag, Truck,
  PanelLeftClose, Package, PanelLeft, LogOut, 
  Settings, UserCircle
} from 'lucide-react';

import { PortalProvider, usePortal } from './_contexts/PortalContext';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { AsistenteIA } from '@/components/portal/AsistenteIA';

const MENU_GROUPS = [
  { 
    group: "General", 
    items: [{ href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
  },
  { 
    group: "Comercial", 
    items: [
      { href: '/portal/productos', label: 'Catálogo', icon: ShoppingBag },
      { href: '/portal/cotizaciones', label: 'Cotizaciones', icon: FileText },
      { href: '/portal/ordenes', label: 'Mis órdenes', icon: Package },
    ]
  },
  { 
    group: "Logística", 
    items: [{ href: '/portal/despachos', label: 'Seguimiento', icon: Truck }]
  },
  { 
    group: "Soporte", 
    items: [
      { href: '/portal/perfil', label: 'Mi Perfil', icon: UserCircle },
      { href: '/portal/configuracion', label: 'Configuración', icon: Settings },
    ]
  }
];

function PortalSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace('/auth/login');
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-slate-900 flex flex-col z-40 shadow-xl transition-all duration-300 border-r border-slate-800',
      collapsed ? 'w-16' : 'w-64',
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800/50 bg-slate-950/20">
        {!collapsed && (
          <div className="flex items-center gap-3 flex-1 animate-in fade-in duration-300">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-white font-bold tracking-tight">GUOR PRO</span>
          </div>
        )}
        <button onClick={onToggle} className={cn("text-slate-500 hover:text-white p-1.5 transition-colors", collapsed && "mx-auto")}>
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-8">
        {MENU_GROUPS.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-3 px-3 animate-in fade-in">
                {group.group}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group',
                    active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
                  )}>
                    <item.icon size={18} className={cn(active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400')} />
                    {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800/50">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-xs font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { loading, cliente } = usePortal();
  const router = useRouter();

  useEffect(() => {
    // Solo redireccionamos si loading terminó Y estamos seguros de que no hay cliente
    const checkAuth = async () => {
      if (!loading && !cliente) {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.replace('/auth/login?redirect=/portal/dashboard');
        }
      }
    };
    checkAuth();
  }, [loading, cliente, router]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!cliente) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <PortalSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      <main className={cn(
        'flex-1 transition-all duration-300 min-h-screen relative',
        collapsed ? 'ml-16' : 'ml-64', // ml-64 coincide con el ancho w-64 del sidebar
      )}>
        {children}
        
        {/* ASISTENTE IA PERSISTENTE */}
        <AsistenteIA />
      </main>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalShell>{children}</PortalShell>
      <AsistenteIA />
    </PortalProvider>
  );
}