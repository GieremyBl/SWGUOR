'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PedidoDetalleDocumentosTab } from '@/components/portal/pedidos/PedidoDetalleDocumentosTab';
import { cn } from '@/lib/utils';

interface PedidoDetalleTabsProps {
  pedidoId: number | string;
  resumen: React.ReactNode;
  defaultTab?: 'resumen' | 'documentos' | 'asistencia';
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
    </Tabs>
  );
}
