'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Menu, X,
  LogOut, Boxes, Truck, FileText, Scissors, Building,
  DollarSign, Bell, Grid3x3, ChevronDown, Settings, User,
  BarChart3, Crown
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { LucideIcon } from 'lucide-react';

type Usuario = Database['public']['Tables']['usuarios']['Row'];
import { usePermissions } from '@/lib/hooks/usePermissions';

type NavItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
  roles: string[];
  subItems?: { title: string; href: string; icon?: LucideIcon }[];
};

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/Panel-Administrativo/dashboard',
    icon: LayoutDashboard,
    roles: ['administrador', 'recepcionista', 'diseñador', 'cortador', 'ayudante', 'representante_taller'],
  },
  {
    title: 'Reportes',
    href: '/admin/Panel-Administrativo/reportes',
    icon: BarChart3,
    roles: ['administrador'],
  },
  {
    title: 'Catálogo',
    icon: Package,
    roles: ['administrador', 'diseñador'],
    subItems: [
      { title: 'Productos', href: '/admin/Panel-Administrativo/productos', icon: Package },
      { title: 'Categorías', href: '/admin/Panel-Administrativo/categorias', icon: Grid3x3 },
    ],
  },
  {
    title: 'Ventas y Pedidos',
    icon: ShoppingCart,
    roles: ['administrador', 'recepcionista', 'diseñador'],
    subItems: [
      { title: 'Ventas', href: '/admin/Panel-Administrativo/ventas', icon: DollarSign },
      { title: 'Pedidos', href: '/admin/Panel-Administrativo/pedidos', icon: ShoppingCart },
      { title: 'Cotizaciones', href: '/admin/Panel-Administrativo/cotizaciones', icon: FileText },
      { title: 'Pagos', href: '/admin/Panel-Administrativo/pagos', icon: DollarSign },
    ],
  },
  {
    title: 'Producción',
    icon: Scissors,
    roles: ['administrador', 'cortador', 'representante_taller'],
    subItems: [
      { title: 'Inventario', href: '/admin/Panel-Administrativo/inventario', icon: Boxes },
      { title: 'Confecciones', href: '/admin/Panel-Administrativo/confecciones', icon: Scissors },
      { title: 'Talleres', href: '/admin/Panel-Administrativo/talleres', icon: Building },
    ],
  },
  {
    title: 'Logística',
    icon: Truck,
    roles: ['administrador', 'ayudante'],
    subItems: [
      { title: 'Despachos', href: '/admin/Panel-Administrativo/despachos', icon: Truck },
    ],
  },
  {
    title: 'Personas',
    icon: Users,
    roles: ['administrador'],
    subItems: [
      { title: 'Clientes', href: '/admin/Panel-Administrativo/clientes', icon: Users },
      { title: 'Usuarios', href: '/admin/Panel-Administrativo/usuarios', icon: Users },
    ],
  },
  {
    title: 'Notificaciones',
    href: '/admin/Panel-Administrativo/notificaciones',
    icon: Bell,
    roles: ['administrador', 'recepcionista', 'diseñador', 'cortador', 'ayudante', 'representante_taller'],
  },
  {
    title: 'Configuración',
    href: '/admin/Panel-Administrativo/configuracion',
    icon: Settings,
    roles: ['administrador'],
  }
];

export default function AdminSidebar({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const pathname = usePathname();
  const { can, isAdmin } = usePermissions();

  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNavItems = useMemo(() => {
    return navItems
      .map(item => {
        if (item.subItems) {
          const allowedSubItems = item.subItems.filter(sub => {
            const resourceName = sub.title.toLowerCase().trim();
            const resourceKey = resourceName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return can('view', resourceKey);
          });
          if (allowedSubItems.length === 0 && !item.href) return null;
          return { ...item, subItems: allowedSubItems };
        }
        const resourceName = item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (resourceName === 'dashboard' || can('view', resourceName)) {
          return item;
        }
        return null;
      })
      .filter((item): item is NavItem => item !== null);
  }, [can]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  const toggleMenu = (title: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenus(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <>
      {/* Botón móvil optimizado */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-3 left-4 z-50 p-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-all"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => {
          setIsCollapsed(true);
          setOpenMenus([]);
        }}
        className={cn(
          "flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-slate-100",
          isCollapsed ? "w-20" : "w-72",
          "fixed lg:sticky top-0 z-40 bg-[#fffdf7]",
          "overflow-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >

        {/* Header - Logo */}
        <div className="h-24 flex items-center justify-center border-b border-slate-100/50">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 w-full px-6 animate-in fade-in duration-300">
              {/* Contenedor del logo actualizado */}
              <div className="relative w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-extrabold text-slate-950 text-xl leading-tight truncate tracking-tighter">GUOR</h1>
                <p className="text-[10px] uppercase tracking-widest text-rose-600 font-bold truncate">
                  Admin Panel
                </p>
              </div>
            </div>
          ) : (
            /* Contenedor del logo colapsado actualizado */
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
          )}
        </div>

        {/* PERFIL - Usuario */}
        {!isCollapsed && usuario.nombre_completo && (
          <div className="px-4 mt-6 mb-4 animate-in fade-in duration-500">
            <Link
              href="/admin/Panel-Administrativo/perfil"
              onClick={() => setIsMobileOpen(false)}
              className="group block"
            >
              <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-4 transition-all hover:border-rose-100 hover:shadow-sm">

                {/* Avatar */}
                <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <span className="flex items-center justify-center h-full text-slate-500 font-bold text-lg">
                    {usuario?.nombre_completo?.charAt(0)}
                  </span>
                  {isAdmin && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-amber-400 p-1 rounded-full border-2 border-white">
                      <Crown size={10} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Texto */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 truncate leading-snug">
                    {usuario.nombre_completo}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5 truncate">
                    {usuario.rol?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Navegación - Contenedor Principal */}
        <nav className="flex-1 px-3 mt-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isOpen = openMenus.includes(item.title);
            const isActive = item.href === pathname ||
              item.subItems?.some(s => s.href === pathname);

            return (
              <div key={item.title}>
                {item.subItems ? (
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-semibold text-sm",
                      isActive
                        ? "bg-rose-50 text-rose-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        <ChevronDown size={16} className={cn("transition-transform text-slate-400", isOpen && "rotate-180")} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-semibold text-sm",
                      pathname === item.href
                        ? "bg-rose-50 text-rose-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon size={22} strokeWidth={pathname === item.href ? 2.5 : 2} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                )}

                {/* Submenu animado */}
                {!isCollapsed && isOpen && item.subItems && (
                  <div className="ml-10 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {item.subItems.map(sub => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "flex items-center gap-2.5 py-2.5 px-3 text-xs font-semibold rounded-lg transition-all",
                          pathname === sub.href
                            ? "text-rose-700 bg-rose-100/50"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-slate-100/50">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full p-3.5 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-950 transition-all",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut size={22} />
            {!isCollapsed && <span className="text-sm font-bold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}