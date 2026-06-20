'use client';

import React, { useEffect, useState } from 'react';
import { PedidoDetalleHeader } from './PedidoDetalleHeader';
import { PedidoDetalleSecciones } from './PedidoDetalleSecciones';
import { PedidoDetalleTabs, type TabId } from './PedidoDetalleTabs';
import OrdenesTable from '@/components/admin/ordenes-produccion/OrdenesTable';
import { SectionCard } from './PedidoDetalleUI';
import { ChatAsistenciaAdmin } from './ChatAsistenciaAdmin';
import { requiereAtencionChat, type MensajeChatPedidoUI } from '@/lib/helpers/pedido-chat-ui.helper';
import type { DetallePedidoData, TallerOption } from './types';

export type { DetallePedidoData, TallerOption };

interface PedidoDetalleProps {
  pedido: DetallePedidoData;
  puedeCambiarEstado: boolean;
}

export default function PedidoDetalle({
  pedido,
  puedeCambiarEstado,
}: PedidoDetalleProps) {
  const [activeTab, setActiveTab] = useState<TabId>('items');
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [totalOrdenes, setTotalOrdenes] = useState<number>(0);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [chatPendiente, setChatPendiente] = useState(false);

  useEffect(() => {
    let activo = true;

    async function fetchChatPendiente() {
      try {
        const res = await fetch(`/api/pedidos/${pedido.id}/chat`, { cache: 'no-store' });
        const json = await res.json();
        if (activo && res.ok && Array.isArray(json.data)) {
          setChatPendiente(requiereAtencionChat(json.data as MensajeChatPedidoUI[]));
        }
      } catch (e) {
        console.error('Error fetching chat pendiente', e);
      }
    }

    fetchChatPendiente();
    return () => {
      activo = false;
    };
  }, [pedido.id]);

  useEffect(() => {
    async function fetchOrdenesCount() {
      try {
        const res = await fetch(`/api/admin/ordenes-produccion?pedido_id=${pedido.id}&page=1&limit=1`);
        const json = await res.json();
        if (json?.meta?.total != null) {
          setTotalOrdenes(Number(json.meta.total));
        }
      } catch (e) {
        console.error('Error fetching ordenes count', e);
      }
    }

    fetchOrdenesCount();
  }, [pedido.id]);

  useEffect(() => {
    if (activeTab !== 'produccion') return;
    let mounted = true;
    async function fetchOrdenes() {
      setLoadingOrdenes(true);
      try {
        const res = await fetch(`/api/admin/ordenes-produccion?pedido_id=${pedido.id}&page=1&limit=50`);
        const json = await res.json();
        if (mounted && json?.ordenes) {
          setOrdenes(json.ordenes);
        }
      } catch (e) {
        console.error('Error fetching ordenes', e);
      } finally {
        if (mounted) setLoadingOrdenes(false);
      }
    }

    fetchOrdenes();
    return () => { mounted = false; };
  }, [activeTab, pedido.id]);

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
            <div className="text-sm text-stone-500 py-6 text-center">Cargando órdenes...</div>
          ) : (
            <OrdenesTable
              data={ordenes}
              onView={(id) => window.location.assign(`/admin/Panel-Administrativo/ordenes-produccion/${id}`)}
              onEtapas={(id) => window.location.assign(`/admin/Panel-Administrativo/ordenes-produccion/${id}`)}
              onEdit={(orden) => window.location.assign(`/admin/Panel-Administrativo/ordenes-produccion/${orden.id}`)}
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
          puedeCambiarEstado={puedeCambiarEstado}
        />
      )}
    </div>
  );
}
