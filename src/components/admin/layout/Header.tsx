'use client';

import { ChevronRight, Home, User, LogOut, Menu as MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { usuarios, personal_interno, clientes } from "@prisma/client";
import { NotificationDropdown } from "./NotificationDropdown";
import { getSupabaseBrowserClient } from "@/lib/supabase";

// El nombre_completo ya no está en usuarios — viene de personal_interno o clientes
interface AdminHeaderProps {
  usuario: usuarios & {
    personal_interno?: Pick<personal_interno, 'nombre_completo'>[];
    clientes?:         Pick<clientes, 'razon_social'>[];
  };
}

export default function AdminHeader({ usuario }: AdminHeaderProps) {
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Resolver el nombre a mostrar: personal_interno > clientes.razon_social > email
  const nombreDisplay =
    usuario.personal_interno?.[0]?.nombre_completo ??
    usuario.clientes?.[0]?.razon_social             ??
    usuario.email;

  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(path => path && path !== 'admin' && path !== 'Panel-Administrativo');
    return paths.map((path, index) => {
      const label  = path.replace(/-/g, ' ').replace(/_/g, ' ');
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error al salir de GUOR Corp:', error);
    }
  };

  return (
    <header className="admin-topbar sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-4 lg:px-8 shadow-sm">
      <div className="flex flex-1 items-center justify-between">

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <div className="w-10 lg:hidden" />
          <nav className="hidden md:flex items-center text-gray-500">
            <Link href="/admin/Panel-Administrativo/dashboard" className="hover:text-rose-500 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            {generateBreadcrumbs()}
          </nav>
        </div>

        {/* Usuario */}
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationDropdown />
          <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="admin-user-link group flex items-center gap-3 p-1 pr-2 rounded-xl transition-all duration-200 hover:bg-amber-50 cursor-pointer"
            >
              <div className="hidden sm:flex flex-col items-end transition-transform group-hover:-translate-x-1">
                <span className="admin-user-name text-sm font-bold text-gray-800 leading-none group-hover:text-black transition-colors">
                  {nombreDisplay}
                </span>
                <span className="admin-user-role text-[10px] font-medium text-gray-400 uppercase tracking-tighter group-hover:text-black/70 transition-colors">
                  {usuario.rol?.replace('_', ' ')}
                </span>
              </div>

              <div className="admin-user-avatar relative w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 overflow-hidden shadow-md flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <Link
                  href="/admin/Panel-Administrativo/perfil"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 transition-colors border-b border-gray-100"
                >
                  <User size={16} />
                  Mi Perfil
                </Link>
                
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para cerrar dropdown */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setIsUserMenuOpen(false)}
          aria-hidden
        />
      )}
    </header>
  );
}