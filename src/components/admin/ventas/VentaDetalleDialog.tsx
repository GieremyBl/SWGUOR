"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient as getSupabaseBrowserClient } from "@/lib/supabase/client"; // Ajusta a tu import real
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database";
type Venta = Database['public']['Tables']['ventas']['Row'];

interface DetalleVenta {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario_snapshot: number;
  productos?: {
    nombre: string;
  };
}

interface VentaDetalleDialogProps {
  venta: Venta | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function VentaDetalleDialog({ venta, isOpen, onClose, onUpdate }: VentaDetalleDialogProps) {
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializamos el cliente fuera de las funciones para mayor limpieza
  const supabase = getSupabaseBrowserClient();

  const loadDetalle = useCallback(async () => {
    if (!venta?.orden_id) return;

    setLoading(true);
    setError(null);
    try {
      // Primero obtenemos la orden para sacar el cotizacion_id
      const { data: ordenData, error: ordenError } = await supabase
        .from("ordenes")
        .select("cotizacion_id")
        .eq("id", venta.orden_id)
        .single();

      if (ordenError) throw ordenError;

      if (!ordenData.cotizacion_id) {
        setDetalles([]);
        return;
      }

      // Luego obtenemos los items de la cotización
      const { data, error: queryError } = await supabase
        .from("cotizacion_items")
        .select("id, cantidad, precio_unitario_snapshot, producto_id, productos(nombre)")
        .eq("cotizacion_id", ordenData.cotizacion_id);

      if (queryError) throw queryError;

      setDetalles((data || []) as any[]);
    } catch (err: any) {
      console.error('[VentaDetalleDialog] Error:', err);
      setError("No se pudieron cargar los artículos del pedido");
    } finally {
      setLoading(false);
    }
  }, [venta?.orden_id, supabase]);

  useEffect(() => {
    if (isOpen && venta?.orden_id) {
      loadDetalle();
    }
  }, [isOpen, venta?.orden_id, loadDetalle]);

  const handleCancelarVenta = async () => {
    if (!venta) return;
    
    const confirmar = window.confirm(
      `¿Estás seguro de cancelar la venta ${venta.numero_comprobante || venta.id}? Esta acción devolverá los productos al stock.`
    );
    if (!confirmar) return;

    setCancelling(true);

    try {
      // 1. Devolver stock (Ejecución en paralelo para mayor velocidad)
      const stockUpdates = detalles.map(item => 
        supabase.rpc('increment_stock', {
          row_id: String(item.producto_id),
          quantity: item.cantidad
        })
      );
      
      const results = await Promise.all(stockUpdates);
      const hasError = results.some(r => r.error);
      
      if (hasError) throw new Error("Error parcial al actualizar el inventario");

      // 2. Eliminar la venta
      const { error: errorVenta } = await supabase
        .from("ventas")
        .delete()
        .eq("id", String(venta.id));

      if (errorVenta) throw errorVenta;

      toast.success("Venta anulada e inventario restaurado");
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('[VentaDetalleDialog] Error:', err);
      toast.error(err.message || "Error al procesar la anulación");
    } finally {
      setCancelling(false);
    }
  };

  if (!venta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold">
            Venta: <span className="text-pink-600">{venta.numero_comprobante || `ID: ${venta.id}`}</span>
          </DialogTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
            {venta.tipo_comprobante?.toUpperCase() || "VENTA"}
          </Badge>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Listado de Productos */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Artículos del Pedido</h4>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Loader2 className="animate-spin text-pink-600 mb-2" />
                <p className="text-xs">Cargando detalles...</p>
              </div>
            ) : detalles.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 border text-center text-gray-500 text-sm italic">
                No hay detalles disponibles para esta orden
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2">
                {detalles.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                    <span className="text-gray-600">
                      <span className="font-bold text-gray-900">{item.cantidad}x</span> {item.productos?.nombre || 'Producto sin nombre'}
                    </span>
                    <span className="font-medium text-gray-900">
                      S/ {(item.cantidad * item.precio_unitario_snapshot).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span className="text-pink-600">S/ {Number(venta.total).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sección de Peligro */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="text-red-600 w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Zona de Peligro</p>
                <p className="text-xs text-red-700">La anulación es irreversible y restaurará el stock.</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelarVenta}
              disabled={cancelling || loading}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Anular Venta
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}