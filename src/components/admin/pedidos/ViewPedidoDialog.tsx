"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, User, Calendar, Hash, 
  Package, Printer, CreditCard, Receipt
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ViewPedidoDialog({ isOpen, pedido, onClose }: any) {
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && pedido?.id) {
      const loadDetalles = async () => {
        setLoading(true);
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("pedido_detalles")
          .select("*, productos(nombre, sku)")
          .eq("pedido_id", pedido.id);
        
        setDetalles(data || []);
        setLoading(false);
      };
      loadDetalles();
    }
  }, [isOpen, pedido]);

  if (!pedido) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl border-none shadow-2xl p-0 overflow-hidden bg-gray-50">
        {/* Header con gradiente suave */}
        <div className="bg-white p-6 border-b">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Receipt className="text-pink-600 w-6 h-6" /> 
                Pedido #{pedido.id.toString().padStart(4, '0')}
              </DialogTitle>
              <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(pedido.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> ID: {pedido.id}</span>
              </div>
            </div>
            <Button variant="outline" className="gap-2 font-bold border-gray-200" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Imprimir
            </Button>
          </DialogHeader>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info del Cliente */}
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <User className="w-3 h-3 text-pink-500" /> Información del Cliente
              </h4>
              <p className="font-bold text-gray-900">{pedido.clientes?.nombre} {pedido.clientes?.apellido}</p>
              <p className="text-sm text-gray-500">Cliente ID: {pedido.cliente_id}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-blue-500" /> Estado del Pago
              </h4>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                pedido.estado === 'completado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'
              }`}>
                {pedido.estado}
              </span>
            </div>
          </div>

          {/* Lista de Productos */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-3 h-3 text-pink-500" /> Resumen de Artículos
                </h4>
              </div>
              
              <div className="divide-y divide-gray-50 max-h-75 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center animate-pulse text-gray-400 font-bold text-xs uppercase">Cargando detalles...</div>
                ) : detalles.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600 font-black text-xs">
                        {item.cantidad}x
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{item.productos?.nombre}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">SKU: {item.productos?.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-sm">S/ {(item.precio_unitario * item.cantidad).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">Unit: S/ {item.precio_unitario.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-pink-600 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total del Pedido</span>
                  <span className="text-2xl font-black">S/ {pedido.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t flex justify-end">
          <Button onClick={onClose} className="bg-gray-900 hover:bg-black text-white font-bold px-8 h-11 rounded-xl">
            Cerrar Detalle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}