'use client';

import { LifeBuoy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SoporteDevolucionesTab } from '@/components/portal/soporte/SoporteDevolucionesTab';
import { SoporteIncidenciasTab } from '@/components/portal/soporte/SoporteIncidenciasTab';

export default function SoportePortalPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-12">
      <div className="flex items-center gap-4">
        <div className="p-3 text-white rounded-2xl shadow-lg bg-[#231e1d] shadow-[#231e1d]/20">
          <LifeBuoy size={24} className="text-[#e4c28a]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Soporte Post-Venta</h1>
          <p className="text-sm text-slate-500">
            Gestione incidencias y solicitudes de devolución de forma autónoma
          </p>
        </div>
      </div>

      <Tabs defaultValue="incidencias" className="w-full">
        <TabsList className="w-full sm:w-auto h-auto p-1 rounded-xl bg-slate-100">
          <TabsTrigger value="incidencias" className="rounded-lg px-5 py-2.5 data-[state=active]:bg-white">
            Mis Incidencias
          </TabsTrigger>
          <TabsTrigger value="devoluciones" className="rounded-lg px-5 py-2.5 data-[state=active]:bg-white">
            Mis Devoluciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidencias" className="mt-6">
          <SoporteIncidenciasTab />
        </TabsContent>

        <TabsContent value="devoluciones" className="mt-6">
          <SoporteDevolucionesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
