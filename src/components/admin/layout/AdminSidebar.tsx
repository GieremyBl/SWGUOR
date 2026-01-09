'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Menu,
  X,
  LogOut,
  Boxes,
  Truck,
  FileText,
  Scissors,
  Building,
  DollarSign,
  Bell,
  Grid3x3,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Usuario } from '@/types/supabase.types';

interface AdminSidebarProps {
  usuario: Usuario;
}

type SubMenuItem = {
  title: string;
  href: string;
  icon?: any;
};

type NavItem = {
  title: string;
  href?: string;
  icon: any;
  roles: string[];
  subItems?: SubMenuItem[];
};

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/Panel-Administrativo/dashboard',
    icon: LayoutDashboard,
    roles: ['administrador', 'recepcionista', 'diseñador', 'cortador', 'ayudante', 'representante_taller'],
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
    roles: ['administrador', 'recepcionista'],
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
    icon: Shield,
    roles: ['administrador'],
  }
];

export default function AdminSidebar({ usuario }: AdminSidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(usuario.rol)
  );

  const toggleMenu = (title: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenus(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isSubItemActive = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some(subItem => pathname === subItem.href);
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Botón móvil */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={cn(
          "flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-amber-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          isCollapsed ? "w-24" : "w-72", 
          "fixed lg:relative z-40",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ backgroundColor: '#fffbf2' }}
      >
        {/* Header */}
        <div className="h-24 flex items-center justify-between px-6 mb-2 transition-all duration-300">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 w-full animate-in fade-in duration-300">
              <div className="relative w-12 h-12 shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-gray-800 leading-tight truncate">GUOR</h1>
                <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold truncate">
                  Modas y Estilos
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center transition-all duration-300">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
          )}
        </div>

        {/* Perfil Compacto - AHORA CLICKEABLE */}
        {!isCollapsed && usuario.nombre_completo && (
          <div className="px-6 mb-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <Link 
              href="/admin/Panel-Administrativo/perfil"
              onClick={() => setIsMobileOpen(false)}
              className="block group"
            >
              <div className="bg-white/60 p-3 rounded-2xl border border-amber-100/50 shadow-sm flex items-center gap-3 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-rose-200 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-rose-400 to-rose-500 text-white flex items-center justify-center font-bold shadow-rose-200 shadow-md text-sm group-hover:scale-110 transition-transform">
                  {usuario.nombre_completo.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-rose-600 transition-colors">
                    {usuario.nombre_completo}
                  </p>
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {usuario.rol.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus.includes(item.title);
            const isActive = pathname === item.href || isSubItemActive(item.subItems);

            return (
              <div key={item.title} className="mb-1">
                {hasSubItems ? (
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 rounded-xl transition-all duration-300 group',
                      isCollapsed ? "py-4" : "py-3",
                      isActive 
                        ? 'bg-linear-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200' 
                        : 'text-gray-600 hover:bg-white hover:text-rose-600 hover:shadow-sm'
                    )}
                  >
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
                      <Icon className={cn(
                        "transition-all duration-300",
                        isCollapsed ? "w-8 h-8" : "w-5 h-5", 
                        !isActive && "text-gray-400 group-hover:text-rose-500"
                      )} />
                      {!isCollapsed && <span className="font-medium text-sm truncate">{item.title}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 rounded-xl transition-all duration-300 group',
                      isCollapsed ? "py-4" : "py-3",
                      isActive
                        ? 'bg-linear-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200'
                        : 'text-gray-600 hover:bg-white hover:text-rose-600 hover:shadow-sm',
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon className={cn(
                      "transition-all duration-300",
                      isCollapsed ? "w-8 h-8" : "w-5 h-5",
                      !isActive && "text-gray-400 group-hover:text-rose-500"
                    )} />
                    {!isCollapsed && <span className="font-medium text-sm truncate">{item.title}</span>}
                  </Link>
                )}

                {/* Submenú */}
                {hasSubItems && isOpen && !isCollapsed && (
                  <div className="mt-1 ml-4 pl-4 space-y-1 border-l border-amber-200/60 animate-in slide-in-from-top-2 duration-200">
                    {item.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      const SubIcon = subItem.icon;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                            isSubActive ? 'bg-rose-50 text-rose-600 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                          )}
                        >
                          {SubIcon && <SubIcon className={cn("w-4 h-4", isSubActive ? "text-rose-500" : "text-gray-400")} />}
                          <span className="truncate">{subItem.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-amber-100">
          {!isCollapsed ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm truncate">Cerrar Sesión</span>
            </button>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 text-gray-500 hover:text-red-600">
              <LogOut className="w-8 h-8" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}