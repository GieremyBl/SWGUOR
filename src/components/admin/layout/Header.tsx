  'use client';

  import { Bell, ChevronRight, Home, User } from "lucide-react";
  import { usePathname } from "next/navigation";
  import Link from "next/link";
  import type { Database } from '@/types/database';
  
  type Usuario = Database['public']['Tables']['usuarios']['Row'];
  import { NotificationDropdown } from "./NotificationDropdown";

  interface AdminHeaderProps {
    usuario: Usuario;
  }

  export default function AdminHeader({ usuario }: AdminHeaderProps) {
    const pathname = usePathname();

    // Generador de Breadcrumbs
    const generateBreadcrumbs = () => {
      const paths = pathname.split('/').filter(path => path && path !== 'admin' && path !== 'Panel-Administrativo');
      return paths.map((path, index) => {
        const label = path.replace(/-/g, ' ').replace(/_/g, ' ');
        const isLast = index === paths.length - 1;
        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1 shrink-0" />
            <span className={`text-sm font-medium capitalize ${isLast ? "text-rose-600 font-semibold" : "text-gray-500"}`}>
              {label}
            </span>
          </div>
        );
      });
    };

    return (
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-4 lg:px-8 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          
          {/* Lado Izquierdo: Breadcrumbs */}
          <div className="flex items-center gap-2">
            <div className="w-10 lg:hidden" /> 
            <nav className="hidden md:flex items-center text-gray-500">
              <Link href="/admin/Panel-Administrativo/dashboard" className="hover:text-rose-500 transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              {generateBreadcrumbs()}
            </nav>
          </div>

          {/* Lado Derecho: Usuario e Interacción */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Botón de Notificaciones*/}
              <NotificationDropdown />

            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block" />

            {/* SECCIÓN DE PERFIL: Enlace con cambio de puntero y efectos */}
            <Link 
              href="/admin/Panel-Administrativo/perfil"
              className="group flex items-center gap-3 p-1 pr-2 rounded-xl transition-all duration-200 hover:bg-rose-50 cursor-pointer"
            >
              {/* Texto de Usuario */}
              <div className="hidden sm:flex flex-col items-end transition-transform group-hover:-translate-x-1">
                <span className="text-sm font-bold text-gray-800 leading-none group-hover:text-rose-600 transition-colors">
                  {usuario.nombre_completo || 'Usuario'}
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter group-hover:text-rose-400 transition-colors">
                  {usuario.rol?.replace('_', ' ')}
                </span>
              </div>

              {/* Avatar con efecto de escala */}
              <div className="relative w-9 h-9 rounded-xl bg-rose-500 overflow-hidden shadow-md">
                <span className="flex items-center justify-center h-full text-white font-bold">
                  {usuario?.nombre_completo?.charAt(0)}
                </span>
                
                {/* Indicador de "Clickable" o presencia */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
            </Link>

          </div>
        </div>
      </header>
    );
  }