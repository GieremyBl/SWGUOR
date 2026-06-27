'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PedidoDetalleDocumentosTab } from '@/components/portal/pedidos/PedidoDetalleDocumentosTab';
import { PedidoTracker } from '@/components/portal/pedidos/PedidoTracker';
import { cn } from '@/lib/utils';

interface PedidoDetalleTabsProps {
  pedidoId: number | string;
  resumen: React.ReactNode;
  defaultTab?: 'resumen' | 'seguimiento' | 'documentos' | 'asistencia';
  className?: string;
}

export function PedidoDetalleTabs({
  pedidoId,
  resumen,
  defaultTab = 'resumen',
  className,
}: PedidoDetalleTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className={cn('w-full', className)}>
      <TabsList className="w-full sm:w-auto h-auto p-1 rounded-xl bg-[#f5f0e8] border border-[#e4c28a]/20">
        <TabsTrigger
          value="resumen"
          className="rounded-lg px-5 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#231e1d]"
        >
          Resumen
        </TabsTrigger>
        <TabsTrigger
          value="documentos"
          className="rounded-lg px-5 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#231e1d]"
        >
          Documentos
        </TabsTrigger>
        <TabsTrigger
          value="seguimiento"
          className="rounded-lg px-5 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#231e1d]"
        >
          Seguimiento
        </TabsTrigger>
        <TabsTrigger
          value="asistencia"
          className="rounded-lg px-5 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#231e1d]"
        >
          Asistencia
        </TabsTrigger>
      </TabsList>

      <TabsContent value="resumen" className="mt-5 focus-visible:outline-none">
        {resumen}
      </TabsContent>

      <TabsContent value="documentos" className="mt-5 focus-visible:outline-none">
        <PedidoDetalleDocumentosTab pedidoId={pedidoId} />
      </TabsContent>

      <TabsContent value="seguimiento" className="mt-5 focus-visible:outline-none">
        <PedidoTracker pedidoId={pedidoId} variant="portal" />
      </TabsContent>

      <TabsContent value="asistencia" className="mt-5 focus-visible:outline-none">
        <div className="rounded-xl border border-dashed border-[#e4c28a]/30 bg-[#fdfaf4] p-5 text-sm text-slate-600">
          La asistencia del pedido se gestiona desde el equipo comercial. Si necesita ayuda, use
          el canal de soporte del portal.
        </div>
      </TabsContent>
    </Tabs>
  );
}
