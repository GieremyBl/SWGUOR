'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PedidoDetalleHeader } from './PedidoDetalleHeader';
import { PedidoDetalleSecciones } from './PedidoDetalleSecciones';
import { PedidoDetalleTabs, type TabId } from './PedidoDetalleTabs';
import OrdenesTable from '@/components/admin/ordenes-produccion/OrdenesTable';
import { SectionCard } from './PedidoDetalleUI';
import { ChatAsistenciaAdmin } from './ChatAsistenciaAdmin';
import { TabGuiaRemision } from './TabGuiaRemision';
import {
  requiereAtencionChat,
  type MensajeChatPedidoUI,
} from '@/lib/helpers/pedido-chat-ui.helper';
import type { DetallePedidoData, TallerOption } from './types';

export type { DetallePedidoData, TallerOption };

interface PedidoDetalleProps {
  pedido: DetallePedidoData;
  puedeAnular: boolean;
}

export default function PedidoDetalle({ pedido, puedeAnular }: PedidoDetalleProps) {
  const router = useRouter();

  // El estado acepta 'guia' gracias a la extensión de TabId en el siguiente paso
  const [activeTab, setActiveTab] = useState<TabId>('items');
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [totalOrdenes, setTotalOrdenes] = useState<number>(0);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [chatPendiente, setChatPendiente] = useState(false);
  const [guiaPendiente, setGuiaPendiente] = useState(false);

  const ordenesCargadas = useRef(false);

  // ── Guía de Remisión pendiente ───────────────────────────────────────────────
  useEffect(() => {
    let activo = true;

    async function fetchGuiaPendiente() {
      try {
        const res = await fetch(`/api/despachos/pedido/${pedido.id}/guia-remision`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (activo && res.ok && Array.isArray(json.data)) {
          // Si no hay guías o todas están en borrador, marca como pendiente
          setGuiaPendiente(json.data.length === 0 || json.data.every((g: any) => g.estado === 'borrador'));
        }
      } catch (e) {
        console.error('[PedidoDetalle] Error fetching guía pendiente:', e);
      }
    }

    fetchGuiaPendiente();
    return () => { activo = false; };
  }, [pedido.id]);

  // ── Chat pendiente ───────────────────────────────────────────────────────────
  useEffect(() => {
    let activo = true;

    async function fetchChatPendiente() {
      try {
        const res = await fetch(`/api/admin/pedidos/${pedido.id}/chat`, {
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

  // ── Conteo de órdenes ────────────────────────────────────────────────────────
  useEffect(() => {
    let activo = true;

    async function fetchOrdenesCount() {
      try {
        const res = await fetch(
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

  // ── Órdenes completas ────────────────────────────────────────────────────────
  const fetchOrdenes = useCallback(async () => {
    if (ordenesCargadas.current) return;
    setLoadingOrdenes(true);
    try {
      const res = await fetch(
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
          guiaPendiente={guiaPendiente}
          onTabChange={(t) => setActiveTab(t)}
        />
      </div>

      {/* RENDER CONDICIONAL DE LAS PESTAÑAS */}
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
      ) : activeTab === 'guia' ? (
        <SectionCard title="Guía de Remisión Electrónica (GRE)">
          <TabGuiaRemision pedido={pedido} />
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