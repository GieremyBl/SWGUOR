'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortal } from '@/lib/hooks/usePortal';
import { Loader2 } from 'lucide-react';

export default function PortalIndexPage() {
  const router = useRouter();
  const { cliente, loading } = usePortal();

  useEffect(() => {
    // Si terminó de cargar y hay un cliente, lo mandamos al Dashboard
    if (!loading && cliente) {
      router.replace('/portal/dashboard');
    }
  }, [cliente, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <div className="text-center">
        <h2 className="text-slate-900 font-semibold">Cargando su sesión corporativa</h2>
        <p className="text-slate-500 text-sm">Preparando el panel de control de GUOR...</p>
      </div>
    </div>
  );
}