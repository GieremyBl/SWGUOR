'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Menu, X,
  LogOut, Boxes, Truck, FileText, Scissors, Building,
  DollarSign, Bell, Grid3x3, ChevronDown, Shield, User,
  BarChart3,
  Crown
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Usuario } from '@/types/supabase.types';
import { LucideIcon } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';

type SubMenuItem = {
  title: string;
  href: string;
  icon?: LucideIcon; 
};

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
    icon: Shield,
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
        // 1. Filtrar Sub-ítems individualmente
        if (item.subItems) {
          const allowedSubItems = item.subItems.filter(sub => {
            const resourceName = sub.title.toLowerCase().trim();
            const resourceKey = resourceName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return can('view', resourceKey);
          });

          // Si el padre no tiene sub-ítems permitidos, no lo mostramos (a menos que tenga su propio href)
          if (allowedSubItems.length === 0 && !item.href) return null;
          
          return { ...item, subItems: allowedSubItems };
        }

        // 2. Filtrar items directos (como Dashboard o Notificaciones)
        const resourceName = item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // El Dashboard suele ser visible para todos, si no, check permiso
        if (resourceName === 'dashboard' || can('view', resourceName)) {
           return item;
        }

        return null;
      })
      .filter((item): item is NavItem => item !== null);
  }, [can, isAdmin]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
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
        className="lg:hidden fixed top-3 left-4 z-50 p-3 bg-rose-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"
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
            setOpenMenus([]); // Cerramos submenús al colapsar para limpieza visual
        }}
        className={cn(
          "flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-amber-100/50",
          isCollapsed ? "w-20" : "w-72",
          "fixed lg:sticky top-0 z-40 bg-[#fffbf2]",
          "overflow-x-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
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

        {/* PERFIL: Inicial + Nombre + Icono de Corona */}
        {!isCollapsed && usuario.nombre_completo && (
          <div className="px-4 mb-3 animate-in fade-in duration-500 overflow-hidden">
            <Link 
              href="/admin/Panel-Administrativo/perfil"
              onClick={() => setIsMobileOpen(false)}
              className="group block"
            >
              <div className="bg-white/60 p-2.5 pr-3 rounded-2xl border border-amber-100/40 flex items-center gap-3 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-rose-200 cursor-pointer">
                
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm transition-transform group-hover:scale-105">
                  {usuario.nombre_completo.charAt(0)}
                </div>

                {/* Contenedor de Textos */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User size={12} className="text-rose-500 shrink-0" strokeWidth={3} /> 
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {usuario.nombre_completo.split(' ')[0]}
                      </p>
                    </div>

                    {/* Corona con margen derecho para no tocar el borde */}
                    {isAdmin && (
                      <div className="flex items-center justify-center bg-amber-100 p-1 rounded-lg shadow-xs border border-amber-200/50 mr-1 ml-2">
                        <Crown 
                          size={12} 
                          className="text-amber-600 fill-amber-500/20" 
                          strokeWidth={2.5} 
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-tight mt-0.5">
                    Mi Cuenta
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
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
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                      isActive ? "bg-rose-500 text-white shadow-md" : "text-gray-500 hover:bg-white hover:text-rose-600",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon size={isCollapsed ? 24 : 20} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-semibold">{item.title}</span>
                        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                      pathname === item.href ? "bg-rose-500 text-white shadow-md" : "text-gray-500 hover:bg-white hover:text-rose-600",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon size={isCollapsed ? 24 : 20} />
                    {!isCollapsed && <span className="text-sm font-semibold">{item.title}</span>}
                  </Link>
                )}

                {/* Submenu animado */}
                {!isCollapsed && isOpen && item.subItems && (
                  <div className="ml-9 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {item.subItems.map(sub => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "block py-2 px-3 text-xs rounded-lg transition-colors",
                          pathname === sub.href ? "text-rose-600 font-bold bg-rose-50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
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

        {/* User Footer */}
        <div className="p-4 border-t border-amber-100 bg-amber-50/30">
           <button 
             onClick={handleLogout}
             className={cn(
               "flex items-center gap-3 w-full p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all",
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