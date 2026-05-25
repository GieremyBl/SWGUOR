'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Users, Menu, X,
  Boxes, Scissors, Building,
  Bell, BarChart3, LucideIcon, ChevronDown,
  Settings, Truck, Package, Grid3x3, DollarSign, FileText,
  Building2, ShieldCheck, UserSquare, Briefcase, MessageSquare, History,
  ChevronRight,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { usuarios } from '@prisma/client';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { RecursoKey } from '@/lib/constants/roles';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SubItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  resource: RecursoKey;
};

type NavItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
  roles: string[];
  resource?: RecursoKey;
  subItems?: SubItem[];
};

type NavGroup = {
  groupLabel: string;
  items: NavItem[];
};

// ─── Bloques de Navegación por Gestiones ──────────────────────────────────────

const GESTION_OPERATIVA: NavGroup = {
  groupLabel: 'Gestión Operativa',
  items: [
    {
      title: 'Dashboard',
      href: '/admin/Panel-Administrativo/dashboard',
      icon: LayoutDashboard,
      resource: 'dashboard' as RecursoKey,
      roles: ['gerente', 'administrador', 'recepcionista', 'disenador', 'cortador', 'ayudante', 'representante_taller'],
    },
    {
      title: 'Reportes',
      href: '/admin/Panel-Administrativo/reportes',
      icon: BarChart3,
      resource: 'reportes' as RecursoKey,
      roles: ['gerente', 'administrador'],
    },
    {
      title: 'Catálogo',
      icon: Package,
      roles: ['gerente', 'administrador', 'disenador', 'cortador'],
      subItems: [
        { title: 'Productos', href: '/admin/Panel-Administrativo/productos', icon: Package, resource: 'productos' as RecursoKey },
        { title: 'Categorías', href: '/admin/Panel-Administrativo/categorias', icon: Grid3x3, resource: 'categorias' as RecursoKey },
        { title: 'Fichas Técnicas', href: '/admin/Panel-Administrativo/fichas-tecnicas', icon: FileText, resource: 'fichas_tecnicas' as RecursoKey },
        { title: 'Promociones y Ofertas', href: '/admin/Panel-Administrativo/promociones', icon: Tag, resource: 'promociones' as RecursoKey },
      ],
    },
    {
      title: 'Ventas y Pedidos',
      icon: ShoppingCart,
      roles: ['gerente', 'administrador', 'recepcionista', 'disenador'],
      subItems: [
        { title: 'Pedidos',       href: '/admin/Panel-Administrativo/pedidos',               icon: ShoppingCart, resource: 'pedidos'              as RecursoKey },
        { title: 'Cotizaciones',  href: '/admin/Panel-Administrativo/cotizaciones',            icon: FileText,     resource: 'cotizaciones'          as RecursoKey },
        { title: 'Devoluciones',  href: '/admin/Panel-Administrativo/devoluciones-cliente',   icon: Truck,        resource: 'devoluciones_clientes' as RecursoKey },
        { title: 'Pagos',         href: '/admin/Panel-Administrativo/pagos',                   icon: DollarSign,   resource: 'pagos'                 as RecursoKey },
      ],
    },
    {
      title: 'Manufactura',
      icon: Scissors,
      roles: ['gerente', 'administrador', 'cortador', 'representante_taller', 'disenador'],
      subItems: [
        { title: 'Órdenes de Producción',  href: '/admin/Panel-Administrativo/ordenes-produccion',  icon: Package,  resource: 'produccion'   as RecursoKey },
        { title: 'Confecciones',           href: '/admin/Panel-Administrativo/confecciones',         icon: Scissors, resource: 'confecciones' as RecursoKey },
        { title: 'Talleres',               href: '/admin/Panel-Administrativo/talleres',             icon: Building, resource: 'talleres'     as RecursoKey },
        { title: 'Incidencias de Taller',  href: '/admin/Panel-Administrativo/incidencias-taller',   icon: Bell,     resource: 'incidencias'  as RecursoKey },
        { title: 'Incidencias de Cliente', href: '/admin/Panel-Administrativo/incidencias-cliente',  icon: Bell,     resource: 'incidencias'  as RecursoKey },
      ],
    },
  ]
};

const GESTION_LOGISTICA: NavGroup = {
  groupLabel: 'Gestión de Inventario y Logística',
  items: [
    {
      title: 'Inventario',
      icon: Boxes,
      roles: ['gerente', 'administrador', 'cortador', 'ayudante'],
      subItems: [
        { title: 'Almacenes',               href: '/admin/Panel-Administrativo/almacenes',               icon: Boxes,     resource: 'almacenes'             as RecursoKey },
        { title: 'Inventario',              href: '/admin/Panel-Administrativo/inventario',              icon: Boxes,     resource: 'inventario'            as RecursoKey },
        { title: 'Movimientos',             href: '/admin/Panel-Administrativo/movimientos',             icon: Grid3x3,   resource: 'movimiento_inventario' as RecursoKey },
        { title: 'Proveedores',             href: '/admin/Panel-Administrativo/proveedores',             icon: Building2, resource: 'proveedores'           as RecursoKey },
        { title: 'Devoluciones Proveedor',  href: '/admin/Panel-Administrativo/devoluciones-proveedor',  icon: Truck,     resource: 'devoluciones_proveedor' as RecursoKey },
      ],
    },
    {
      title: 'Compras',
      icon: ShoppingBag,
      roles: ['gerente', 'administrador', 'almacenero'],
      subItems: [
        {
          title: 'Proveedores',
          href: '/admin/Panel-Administrativo/proveedores',
          icon: Building2,
          resource: 'proveedores' as RecursoKey,
        },
        {
          title: 'Órdenes de Compra',
          href: '/admin/Panel-Administrativo/ordenes-compra',
          icon: ShoppingBag,
          resource: 'ordenes_compra' as RecursoKey,
        },
        {
          title: 'Proveedores Cotizaciones',
          href: '/admin/Panel-Administrativo/cotizaciones-proveedor',
          icon: FileText,
          resource: 'proveedores' as RecursoKey,
        },
      ],
    },
    {
      title: 'Logística',
      icon: Truck,
      roles: ['gerente', 'administrador', 'ayudante', 'recepcionista'],
      subItems: [
        { title: 'Despachos', href: '/admin/Panel-Administrativo/despachos', icon: Truck, resource: 'despachos' as RecursoKey },
      ],
    },
  ]
};

const GESTION_SISTEMA: NavGroup = {
  groupLabel: 'Control y Configuración',
  items: [
    {
      title: 'Directorio',
      icon: Users,
      roles: ['gerente', 'administrador', 'recepcionista'],
      subItems: [
        { title: 'Usuarios',          href: '/admin/Panel-Administrativo/usuarios',         icon: ShieldCheck,   resource: 'usuarios'         as RecursoKey },
        { title: 'Personal Interno',  href: '/admin/Panel-Administrativo/personal',          icon: UserSquare,    resource: 'personal'         as RecursoKey },
        { title: 'Clientes',          href: '/admin/Panel-Administrativo/clientes',          icon: Briefcase,     resource: 'clientes'         as RecursoKey },
        { title: 'Auditoría',         href: '/admin/Panel-Administrativo/auditoria',         icon: History,       resource: 'usuarios'         as RecursoKey },
        { title: 'Feedback Cliente',  href: '/admin/Panel-Administrativo/feedback-cliente',  icon: MessageSquare, resource: 'feedback_cliente' as RecursoKey },
      ],
    },
    {
      title: 'Configuración',
      href: '/admin/Panel-Administrativo/configuracion',
      icon: Settings,
      resource: 'configuracion' as RecursoKey,
      roles: ['gerente', 'administrador'],
    },
    {
      title: 'Notificaciones',
      href: '/admin/Panel-Administrativo/notificaciones',
      icon: Bell,
      resource: 'notificaciones' as RecursoKey,
      roles: ['administrador', 'gerente', 'recepcionista', 'disenador', 'cortador', 'representante_taller', 'ayudante'],
    },
  ]
};

const navigationMenuGroups: NavGroup[] = [
  GESTION_OPERATIVA,
  GESTION_LOGISTICA,
  GESTION_SISTEMA
];

// ─── Tooltip para modo colapsado ──────────────────────────────────────────────

function CollapseTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip text-left">
      {children}
      <div className="
        pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[99]
        bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg
        whitespace-nowrap shadow-xl
        opacity-0 scale-95 translate-x-1
        group-hover/tip:opacity-100 group-hover/tip:scale-100 group-hover/tip:translate-x-0
        transition-all duration-150 ease-out
      ">
        {label}
        {/* Arrow */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
      </div>
    </div>
  );
}

// ─── Sidebar principal ────────────────────────────────────────────────────────

export default function Sidebar({ }: { usuario: usuarios }) {
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const { can } = usePermissions();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredGroups = useMemo(() => {
    return navigationMenuGroups
      .map(group => {
        const allowedItems = group.items
          .map(item => {
            if (item.subItems) {
              const allowedSubItems = item.subItems.filter(sub => can('view', sub.resource));
              if (allowedSubItems.length === 0 && !item.href) return null;
              return { ...item, subItems: allowedSubItems };
            }
            if (item.resource === 'dashboard' as RecursoKey) return item;
            if (item.resource && can('view', item.resource)) return item;
            return null;
          })
          .filter((item): item is NavItem => item !== null);

        return { ...group, items: allowedItems };
      })
      .filter(group => group.items.length > 0);
  }, [can]);

  const toggleMenu = (title: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenMenus([title]);
      return;
    }
    setOpenMenus(prev =>
      prev.includes(title) ? prev.filter(i => i !== title) : [...prev, title]
    );
  };

  return (
    <>
      {/* ── Botón móvil ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={cn(
          'lg:hidden fixed top-4 left-4 z-50 p-3 rounded-2xl shadow-2xl transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 active:scale-90',
          isMobileOpen ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white hover:scale-105',
        )}
        aria-label={isMobileOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── Overlay móvil ───────────────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-md"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col h-screen border-r border-slate-200/80',
          'fixed lg:sticky top-0 z-40',
          'bg-white',
          'transition-[width] duration-300 ease-in-out overflow-hidden',
          'shadow-[1px_0_20px_rgba(0,0,0,0.04)] lg:shadow-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'w-[68px]' : 'w-[264px]',
        )}
      >

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className={cn(
          'flex items-center border-b border-slate-100 shrink-0 overflow-hidden',
          'transition-all duration-300',
          isCollapsed ? 'h-20 px-3 justify-center' : 'h-20 px-5 gap-3.5 justify-start',
        )}>
          <div className="w-11 h-11 rounded-full border border-rose-500/30 bg-white flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow-sm">
            <img src="/logo.png" alt="GUOR" className="w-full h-full object-cover rounded-full" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden text-left">
              <p className="font-black text-slate-900 text-sm leading-none tracking-tight">GUOR</p>
              <p className="text-[10px] text-rose-500 font-bold tracking-widest uppercase mt-1">
                Control Panel
              </p>
            </div>
          )}
        </div>

        {/* ── Nav Agrupada por Gestiones ─────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 text-left space-y-7 px-3">
          {filteredGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-3">

              {/* Etiqueta del Grupo */}
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none pt-2 pb-1">
                  {group.groupLabel}
                </div>
              )}

              {/* Contenedor de ítems */}
              <div className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isOpen = openMenus.includes(item.title);
                  const isActive = item.href === pathname || item.subItems?.some(s => s.href === pathname);

                  // ✅ FIX: colores aplicados directamente a cada hijo, sin depender de herencia CSS
                  const itemContent = (
                    <div className={cn(
                      'flex items-center rounded-xl transition-all duration-200 cursor-pointer select-none w-full',
                      isCollapsed ? 'justify-center p-3' : 'justify-start gap-x-4 px-4 py-2.5',
                      isActive ? 'bg-rose-50' : 'hover:bg-slate-50/80',
                    )}>
                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.3 : 1.6}
                        className={cn(
                          'shrink-0',
                          isActive ? 'text-rose-600' : 'text-slate-600'
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className={cn(
                            'flex-1 text-[13.5px] font-medium truncate text-left tracking-wide',
                            isActive ? 'font-semibold text-rose-700' : 'text-slate-600',
                          )}>
                            {item.title}
                          </span>
                          {item.subItems && (
                            <ChevronDown
                              size={14}
                              className={cn(
                                'shrink-0 text-slate-400 transition-transform duration-200',
                                isOpen && 'rotate-180 text-rose-400',
                              )}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );

                  return (
                    <div key={item.title} className="w-full text-left">
                      {item.subItems ? (
                        isCollapsed ? (
                          <CollapseTooltip label={item.title}>
                            <button onClick={() => toggleMenu(item.title)} className="w-full block">
                              {itemContent}
                            </button>
                          </CollapseTooltip>
                        ) : (
                          <button onClick={() => toggleMenu(item.title)} className="w-full block">
                            {itemContent}
                          </button>
                        )
                      ) : (
                        isCollapsed ? (
                          <CollapseTooltip label={item.title}>
                            <Link href={item.href!} onClick={() => setIsMobileOpen(false)} className="block w-full">
                              {itemContent}
                            </Link>
                          </CollapseTooltip>
                        ) : (
                          <Link href={item.href!} onClick={() => setIsMobileOpen(false)} className="block w-full">
                            {itemContent}
                          </Link>
                        )
                      )}

                      {/* Submenú */}
                      {!isCollapsed && isOpen && item.subItems && (
                        <div className="mt-1 mb-1 ml-[22px] pl-3 border-l border-slate-100 space-y-1 text-left">
                          {item.subItems.map(sub => {
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                  'flex items-center justify-start gap-2.5 py-2 px-3 text-xs rounded-lg transition-all duration-200 w-full',
                                  isSubActive
                                    ? 'bg-rose-50'
                                    : 'hover:bg-slate-100',
                                )}
                              >
                                <span className={cn(
                                  'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                                  isSubActive ? 'bg-rose-500' : 'bg-slate-300',
                                )} />
                                {/* ✅ FIX: color directo en el texto del subítem */}
                                <span className={cn(
                                  'truncate text-left font-medium',
                                  isSubActive ? 'text-rose-600 font-semibold' : 'text-slate-700',
                                )}>
                                  {sub.title}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Collapse toggle ───────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 p-2 text-left">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'hidden lg:flex items-center w-full rounded-xl px-4 py-3',
              'text-slate-400 hover:text-slate-700 hover:bg-slate-50',
              'transition-all duration-200 group',
              isCollapsed ? 'justify-center p-3' : 'justify-start gap-3.5',
            )}
            title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
          >
            <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
              <ChevronRight
                size={16}
                className={cn(
                  'absolute transition-all duration-300',
                  isCollapsed ? 'opacity-100 rotate-0' : 'opacity-100 rotate-180',
                )}
              />
            </div>
            {!isCollapsed && (
              <span className="text-xs font-medium text-left text-slate-500">Contraer</span>
            )}
          </button>
        </div>

      </aside>
    </>
  );
}