'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PedidoDetalleHeader } from './PedidoDetalleHeader';
import { PedidoDetalleSecciones } from './PedidoDetalleSecciones';
import { PedidoDetalleTabs, type TabId } from './PedidoDetalleTabs';
import OrdenesTable from '@/components/admin/ordenes-produccion/OrdenesTable';
import { SectionCard } from './PedidoDetalleUI';
import { ChatAsistenciaAdmin } from './ChatAsistenciaAdmin';
import {
  requiereAtencionChat,
  type MensajeChatPedidoUI,
} from '@/lib/helpers/pedido-chat-ui.helper';
import type { DetallePedidoData, TallerOption } from './types';

export type { DetallePedidoData, TallerOption };

interface PedidoDetalleProps {
  pedido:      DetallePedidoData;
  puedeAnular: boolean;          // ← renombrado de puedeCambiarEstado
}

export default function PedidoDetalle({ pedido, puedeAnular }: PedidoDetalleProps) {
  const router = useRouter();

  const [activeTab,     setActiveTab]     = useState<TabId>('items');
  const [ordenes,       setOrdenes]       = useState<any[]>([]);
  const [totalOrdenes,  setTotalOrdenes]  = useState<number>(0);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [chatPendiente, setChatPendiente] = useState(false);

  // Evita re-fetch en cada visita al tab de producción
  const ordenesCargadas = useRef(false);

  // ── Chat pendiente ───────────────────────────────────────────────────────────
  useEffect(() => {
    let activo = true;

    async function fetchChatPendiente() {
      try {
        // Prefijo /admin/ alineado con el resto del ERP
        const res  = await fetch(`/api/admin/pedidos/${pedido.id}/chat`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (activo && res.ok && Array.isArray(json.data)) {
          setChatPendiente(requiereAtencionChat(json.data as MensajeChatPedidoUI[]));
        }
      } catch (e) {
        console.error('[PedidoDetalle] Error fetching chat pendiente:', e);
      }
    }

    fetchChatPendiente();
    return () => { activo = false; };
  }, [pedido.id]);

  // ── Conteo de órdenes (solo para el badge del tab) ───────────────────────────
  useEffect(() => {
    let activo = true;

    async function fetchOrdenesCount() {
      try {
        const res  = await fetch(
          `/api/admin/ordenes-produccion?pedido_id=${pedido.id}&page=1&limit=1`,
        );
        const json = await res.json();
        if (activo && json?.meta?.total != null) {
          setTotalOrdenes(Number(json.meta.total));
        }
      } catch (e) {
        console.error('[PedidoDetalle] Error fetching ordenes count:', e);
      }
    }

    fetchOrdenesCount();
    return () => { activo = false; };
  }, [pedido.id]);

  // ── Órdenes completas (solo cuando abre el tab, solo una vez) ────────────────
  const fetchOrdenes = useCallback(async () => {
    if (ordenesCargadas.current) return;
    setLoadingOrdenes(true);
    try {
      const res  = await fetch(
        `/api/admin/ordenes-produccion?pedido_id=${pedido.id}&page=1&limit=50`,
      );
      const json = await res.json();
      if (json?.ordenes) {
        setOrdenes(json.ordenes);
        ordenesCargadas.current = true;
      }
    } catch (e) {
      console.error('[PedidoDetalle] Error fetching ordenes:', e);
    } finally {
      setLoadingOrdenes(false);
    }
  }, [pedido.id]);

  useEffect(() => {
    if (activeTab === 'produccion') fetchOrdenes();
  }, [activeTab, fetchOrdenes]);

  // ── Navegación a orden — router.push en vez de window.location ───────────────
  const irAOrden = (id: number | string) =>
    router.push(`/admin/Panel-Administrativo/ordenes-produccion/${id}`);

  return (
    <div className="max-w-[96rem] mx-auto px-4 py-6 space-y-5">
      <PedidoDetalleHeader pedido={pedido} />

      <div className="flex items-center justify-between">
        <PedidoDetalleTabs
          activeTab={activeTab}
          totalOrdenes={totalOrdenes}
          chatPendiente={chatPendiente}
          onTabChange={(t) => setActiveTab(t)}
        />
      </div>

      {activeTab === 'produccion' ? (
        <SectionCard title={`Órdenes de Producción (${totalOrdenes})`}>
          {loadingOrdenes ? (
            <div className="text-sm text-stone-500 py-6 text-center">
              Cargando órdenes...
            </div>
          ) : (
            <OrdenesTable
              data={ordenes}
              onView={irAOrden}
              onEtapas={irAOrden}
              onEdit={(orden) => irAOrden(orden.id)}
            />
          )}
        </SectionCard>
      ) : activeTab === 'asistencia' ? (
        <SectionCard title="Asistencia al cliente">
          <ChatAsistenciaAdmin
            pedidoId={pedido.id}
            onPendienteChange={setChatPendiente}
          />
        </SectionCard>
      ) : (
        <PedidoDetalleSecciones
          pedido={pedido}
          puedeAnular={puedeAnular} 
        />
      )}
    </div>
  );
}