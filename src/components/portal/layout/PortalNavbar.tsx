'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, User, Menu, X, LogOut, UserCircle, ShoppingCart } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropDown';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCartStore, type CartState } from '@/lib/store/useCartStore';
import { usePortalCart } from '../cart/PortalCartLayout';

export function Navbar({ empresa = 'Cargando...' }: { empresa?: string }) {
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s: CartState) => s.items.length);
  const { openCart } = usePortalCart();

  useEffect(() => setMounted(true), []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <header
      className="h-16 border-b border-guor-line bg-white sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm"
      role="banner"
    >
      {/* Sección Izquierda: Buscador */}
      <div className="flex items-center flex-1 min-w-0">
        <div className="relative w-full max-w-sm group hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-guor-soft/50 group-focus-within:text-guor-600 transition-colors"
            size={16}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar cotizaciones o productos..."
            aria-label="Buscar cotizaciones o productos"
            className="w-full bg-guor-bg border border-guor-line rounded-full py-1.5 pl-9 pr-4 text-xs text-guor-ink placeholder:text-guor-soft/40 focus:outline-none focus:ring-2 focus:ring-guor-200 focus:border-guor-400 transition-all"
          />
        </div>
      </div>

      {/* Sección Derecha — Escritorio */}
      <div className="hidden sm:flex items-center gap-3">

        {/* Botón Carrito */}
        <button
          onClick={openCart}
          aria-label={`Carrito de pedidos${mounted && itemCount > 0 ? `, ${itemCount} productos` : ''}`}
          className="relative p-2 rounded-xl hover:bg-guor-50 text-guor-soft/60 hover:text-guor-600 transition-colors"
        >
          <ShoppingCart size={20} />
          {mounted && itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>

        {/* Notificaciones */}
        <NotificationDropdown />

        {/* Perfil con Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 pl-3 border-l border-guor-line text-left focus:outline-none group"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-guor-ink leading-none truncate max-w-[180px] group-hover:text-guor-600 transition-colors">
                {empresa}
              </p>
              <p className="text-[9px] text-guor-600 font-bold mt-0.5 tracking-wider uppercase">
                Socio Corporativo
              </p>
            </div>
            <div
              className="w-9 h-9 bg-guor-50 border border-guor-200 rounded-full flex items-center justify-center text-guor-600 shrink-0 group-hover:bg-guor-100 transition-all"
              role="img"
              aria-label="Perfil de usuario"
            >
              <User size={18} aria-hidden="true" />
            </div>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-guor-line rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => { setIsProfileMenuOpen(false); router.push('/portal/perfil'); }}
                className="w-full px-4 py-2 text-left text-xs text-guor-ink hover:bg-guor-50 flex items-center gap-2 transition-colors"
              >
                <UserCircle size={16} className="text-guor-600" />
                Mi Perfil
              </button>
              <hr className="border-guor-line my-1" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Móvil */}
      <div className="flex sm:hidden items-center gap-2">

        {/* Carrito móvil */}
        <button
          onClick={openCart}
          aria-label="Abrir carrito"
          className="relative p-1.5 text-guor-soft/60 hover:text-guor-600 hover:bg-guor-50 rounded-md transition-colors"
        >
          <ShoppingCart size={20} />
          {mounted && itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>

        <NotificationDropdown />

        <button
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="p-1.5 text-guor-soft/60 hover:text-guor-600 hover:bg-guor-50 rounded-md transition-colors"
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menú Desplegable — Móvil */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 right-0 left-0 bg-white border-b border-guor-line shadow-md sm:hidden animate-in fade-in duration-150 z-40">
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-guor-soft/50" size={16} />
              <input
                type="search"
                placeholder="Buscar..."
                className="w-full bg-guor-bg border border-guor-line rounded-full py-1.5 pl-9 pr-4 text-xs text-guor-ink"
              />
            </div>
            <div className="border-t border-guor-line pt-2 space-y-1">
              <button
                onClick={() => router.push('/portal/mi-perfil')}
                className="w-full flex items-center gap-3 p-2 hover:bg-guor-50 rounded-lg text-xs text-guor-ink"
              >
                <UserCircle size={16} className="text-guor-600" />
                Mi Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-2 hover:bg-red-50 rounded-lg text-xs text-red-600"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}