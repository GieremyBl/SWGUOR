'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Inbox } from 'lucide-react';
import type { Notificacion } from '@/lib/schemas/notificaciones';
import { NotificationItem } from '@/components/admin/notificaciones/NotificationItem';

const TIPO_CONFIG: Record<string, { label: string; color: string }> = {
  // Cotizaciones
  cotizacion_creada: { label: 'Cotización creada', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  cotizacion_modificada: { label: 'Cotización modificada', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  cotizacion_expirada: { label: 'Cotización expirada', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  cotizacion_aprobada: { label: 'Cotización aprobada', color: 'bg-green-50 text-green-700 border-green-200' },
  cotizacion_rechazada: { label: 'Cotización rechazada', color: 'bg-red-50 text-red-700 border-red-200' },
  // Pedidos
  pedido_confirmado: { label: 'Pedido confirmado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pedido_listo: { label: 'Pedido listo', color: 'bg-green-50 text-green-700 border-green-200' },
  pedido_en_revision: { label: 'Pedido en revisión', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  pedido_modificado: { label: 'Pedido modificado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pedido_cancelado: { label: 'Pedido cancelado', color: 'bg-red-50 text-red-700 border-red-200' },
  pedido_parcial: { label: 'Pedido parcial', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  pedido_vencido: { label: 'Pedido vencido', color: 'bg-red-50 text-red-700 border-red-200' },
  // Pagos
  pago_pendiente: { label: 'Pago pendiente', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  pago_verificado: { label: 'Pago verificado', color: 'bg-green-50 text-green-700 border-green-200' },
  pago_rechazado: { label: 'Pago rechazado', color: 'bg-red-50 text-red-700 border-red-200' },
  pago_parcial: { label: 'Pago parcial', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  nota_credito_emitida: { label: 'Nota crédito', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  // Despachos
  despacho_en_camino: { label: 'En camino', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  despacho_programado: { label: 'Despacho programado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  despacho_preparando: { label: 'Preparando despacho', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  despacho_entregado: { label: 'Despacho entregado', color: 'bg-green-50 text-green-700 border-green-200' },
  despacho_fallido: { label: 'Despacho fallido', color: 'bg-red-50 text-red-700 border-red-200' },
  despacho_devuelto: { label: 'Despacho devuelto', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  // Producción
  orden_produccion: { label: 'Orden producción', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  orden_produccion_aprobada: { label: 'Producción aprobada', color: 'bg-green-50 text-green-700 border-green-200' },
  orden_produccion_iniciada: { label: 'Producción iniciada', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  orden_produccion_pausada: { label: 'Producción pausada', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  orden_produccion_cancelada: { label: 'Producción cancelada', color: 'bg-red-50 text-red-700 border-red-200' },
  // Confección
  confeccion_completada: { label: 'Confección completada', color: 'bg-green-50 text-green-700 border-green-200' },
  confeccion_iniciada: { label: 'Confección iniciada', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  confeccion_en_proceso: { label: 'Confección en proceso', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  confeccion_con_retraso: { label: 'Con retraso', color: 'bg-red-50 text-red-700 border-red-200' },
  confeccion_observacion: { label: 'Observación', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  // Stock / Inventario
  stock_bajo: { label: 'Stock bajo', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  stock_agotado: { label: 'Stock agotado', color: 'bg-red-50 text-red-700 border-red-200' },
  stock_repuesto: { label: 'Stock repuesto', color: 'bg-green-50 text-green-700 border-green-200' },
  ingreso_tela: { label: 'Ingreso tela', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  merma_registrada: { label: 'Merma registrada', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ajuste_inventario: { label: 'Ajuste inventario', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  // Devoluciones
  devolucion_solicitada: { label: 'Devolución solicitada', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  devolucion_aprobada: { label: 'Devolución aprobada', color: 'bg-green-50 text-green-700 border-green-200' },
  devolucion_rechazada: { label: 'Devolución rechazada', color: 'bg-red-50 text-red-700 border-red-200' },
  devolucion_recibida: { label: 'Devolución recibida', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  cambio_solicitado: { label: 'Cambio solicitado', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  cambio_completado: { label: 'Cambio completado', color: 'bg-green-50 text-green-700 border-green-200' },
  // Clientes / Cuentas
  cliente_nuevo: { label: 'Cliente nuevo', color: 'bg-green-50 text-green-700 border-green-200' },
  cuenta_bloqueada: { label: 'Cuenta bloqueada', color: 'bg-red-50 text-red-700 border-red-200' },
  cuenta_reactivada: { label: 'Cuenta reactivada', color: 'bg-green-50 text-green-700 border-green-200' },
  documento_requerido: { label: 'Documento requerido', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  // Sistema
  sistema: { label: 'Sistema', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export default function NotificacionesTable({ data = [] }: { data: Notificacion[] }) {
  const [search, setSearch] = useState('');

  const filtered = data.filter(({ titulo, mensaje }) => {
    const q = search.toLowerCase();
    return titulo.toLowerCase().includes(q) || mensaje.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por título o mensaje..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-indigo-400 transition-all"
        />
      </div>

      <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[120px]">Estado</TableHead>
              <TableHead className="py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notificación / Detalle</TableHead>
              <TableHead className="py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[160px]">Categoría</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8 text-gray-200" />
                    <span className="text-gray-400 italic text-sm">No hay notificaciones</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.map((n) => {
              const conf = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.sistema;
              return (
                <TableRow key={n.id} className="hover:bg-transparent">
                  <TableCell className="py-4 px-5 align-middle">
                    {n.leido ? (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded-lg border-slate-200 text-slate-400">Leída</Badge>
                    ) : (
                      <Badge className="text-[10px] uppercase font-bold tracking-wider rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-100">Nueva</Badge>
                    )}
                  </TableCell>
                  <TableCell className="p-0">
                    <NotificationItem notificacion={n} compacto={false} />
                  </TableCell>
                  <TableCell className="py-4 px-5 align-middle">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border block text-center ${conf.color}`}>
                      {conf.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}