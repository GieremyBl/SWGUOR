"use client";

import { useMemo, useState } from "react";
import dynamic from 'next/dynamic';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Loader2, UserX, AlertTriangle, Eye } from "lucide-react";

const DashboardAdministrador = dynamic(() => import('@/components/admin/dashboards/DashboardAdministrador'));
const DashboardAyudante      = dynamic(() => import('@/components/admin/dashboards/DashboardAyudante'));
const DashboardCortador      = dynamic(() => import('@/components/admin/dashboards/DashboardCortador'));
const DashboardDisenador     = dynamic(() => import('@/components/admin/dashboards/DashboardDisenador'));
const DashboardRecepcionista = dynamic(() => import('@/components/admin/dashboards/DashboardRecepcionista'));
const DashboardRepresentante = dynamic(() => import('@/components/admin/dashboards/DashboardRepresentante'));
const DashboardGerente       = dynamic(() => import('@/components/admin/dashboards/DashboardGerente'));
const DashboardAlmacenero    = dynamic(() => import('@/components/admin/dashboards/DashboardAlmacenero'));
const RoleDashboardTabs      = dynamic(() => import('@/components/admin/dashboards/RoleDashboardTab'));

const DASHBOARDS_MAP: Record<string, React.ComponentType<any>> = {
  administrador:        DashboardAdministrador,
  ayudante:             DashboardAyudante,
  cortador:             DashboardCortador,
  disenador:            DashboardDisenador,
  recepcionista:        DashboardRecepcionista,
  representante_taller: DashboardRepresentante,
  gerente:              DashboardGerente,
  almacenero:           DashboardAlmacenero,
};

const ROL_LABELS: Record<string, string> = {
  administrador:        'Administrador',
  ayudante:             'Ayudante',
  cortador:             'Cortador',
  disenador:            'Diseñador',
  recepcionista:        'Recepcionista',
  representante_taller: 'Rep. de Taller',
  gerente:              'Gerente',
  almacenero:           'Almacenero',
};

export default function DashboardPage() {
  const { usuario, isLoading } = usePermissions();
  const isGerente = usuario?.rol === 'gerente';

  const [activeRole, setActiveRole] = useState<string>('gerente');

  const resolvedRole = isGerente
    ? (activeRole ?? 'gerente')
    : (usuario?.rol ?? 'gerente');

  const ActiveDashboard = useMemo(() => {
    return DASHBOARDS_MAP[resolvedRole] ?? null;
  }, [resolvedRole]);

  // ── 1. Estado de Carga (Sincronizado con Muted Foreground y Primary Accent) ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3 bg-background">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Cargando panel...</p>
      </div>
    );
  }

  // ── 2. Estado Sin Sesión (Usando Muted variables y Guor Bordes) ──
  if (!usuario) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6 bg-background">
        <div className="p-4 rounded-full bg-muted border border-border mb-4">
          <UserX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Sesión finalizada</h1>
        <p className="text-muted-foreground text-sm mt-1">Por favor, inicia sesión nuevamente.</p>
      </div>
    );
  }

  // ── 3. Estado Rol No Configurado (Mapeado a Destructive / Warning controlado) ──
  if (!ActiveDashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-6 bg-background">
        {/* Cambiado de amber-50 a destructivo ligero/semántico según el estándar del ERP */}
        <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Acceso restringido</h2>
        <p className="text-muted-foreground text-sm mt-1">
          El rol{' '}
          <code className="font-mono bg-muted text-foreground border border-border px-1.5 py-0.5 rounded text-xs">
            {usuario.rol}
          </code>{' '}
          no tiene un tablero configurado.
        </p>
      </div>
    );
  }

  // ── 4. Render Principal con Paleta Unificada y Bordes Heredados ──
  return (
    <div className="bg-background text-foreground space-y-5">
      {/* Tabs de roles — solo para gerente */}
      {isGerente && (
        <RoleDashboardTabs
          activeRole={resolvedRole}
          onChange={setActiveRole}
        />
      )}

      {/* Alerta flotante: "Estás viendo el panel de X" */}
      {isGerente && resolvedRole !== 'gerente' && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 px-4 py-2.5 rounded-xl w-fit shadow-sm">
          <Eye size={14} className="text-destructive" />
          <span>
            Viendo el panel de{' '}
            <strong className="font-bold text-foreground">
              {ROL_LABELS[resolvedRole] ?? resolvedRole}
            </strong>
            {' — '}
            <button
              onClick={() => setActiveRole('gerente')}
              className="underline hover:no-underline font-semibold text-primary transition-colors"
            >
              volver al tuyo
            </button>
          </span>
        </div>
      )}

      {/* Inyección del Tablero con Tipado e Identidad Limpia */}
      <div className="w-full">
        <ActiveDashboard usuario={usuario} />
      </div>
    </div>
  );
}