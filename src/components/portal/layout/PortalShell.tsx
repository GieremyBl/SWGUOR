'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { usePortal } from '@/app/portal/_contexts/PortalContext';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { AsistenteIA } from '@/components/portal/AsistenteIA';
import { PortalSidebar } from './PortalSidebar';
import { Navbar } from './PortalNavbar';

interface PortalShellProps {
  children: React.ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { loading, cliente } = usePortal();
  const router = useRouter();

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-guor-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-guor-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-guor-soft text-sm font-medium animate-pulse">Sincronizando portal...</p>
        </div>
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className="min-h-screen bg-guor-bg flex overflow-hidden">
      <PortalSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-screen relative',
          collapsed ? 'pl-[68px]' : 'pl-[264px]',
        )}
      >
        <Navbar empresa={cliente.nombre_comercial ?? cliente.razon_social ?? undefined} />

        <main className="flex-1 relative overflow-y-auto px-6 py-8">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
          <AsistenteIA />
        </main>
      </div>
    </div>
  );
}
