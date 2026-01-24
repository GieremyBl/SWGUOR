"use client";

import { useState } from "react";
import type { Producto } from "@/types/supabase.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, Loader2, Package } from "lucide-react";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface StockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: Producto;
}

export default function StockDialog({ isOpen, onClose, onSuccess, producto }: StockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [tipo, setTipo] = useState<"sumar" | "restar">("sumar");
  const { can, usuario } = usePermissions();
  const userRole = usuario?.rol?.toLowerCase();

  // Verificación de seguridad
  if (!can('edit', 'productos') && userRole != 'representante_taller') {
    return null;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cantidadNum = parseInt(cantidad);
    if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error("Ingresa una cantidad válida mayor a cero");
      return;
    }

    try {
      setLoading(true);

      // Calculamos el nuevo stock para enviarlo a la API
      const nuevoStock =
        tipo === "sumar"
          ? producto.stock + cantidadNum
          : Math.max(0, producto.stock - cantidadNum);

      const response = await fetch(`/api/admin/productos?id=${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stock: nuevoStock,
          updated_at: new Date().toISOString()
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al actualizar stock");

      toast.success(
        tipo === "sumar" 
          ? `+${cantidadNum} unidades agregadas a ${producto.nombre}`
          : `-${cantidadNum} unidades removidas de ${producto.nombre}`
      );
      
      setCantidad("");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const nuevoStockCalculado = tipo === "sumar" 
    ? producto.stock + (parseInt(cantidad) || 0)
    : Math.max(0, producto.stock - (parseInt(cantidad) || 0));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl">
        {/* Cabecera con estilo visual */}
        <div className="bg-gray-900 p-6 text-white text-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-pink-400" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Movimiento de Stock
          </DialogTitle>
          <DialogDescription className="text-gray-400 font-medium">
            {producto.nombre}
          </DialogDescription>
        </div>

        <div className="p-6 bg-white space-y-6">
          {/* Visualizador de Stock Actual */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-3xl p-4 text-center border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400">Actual</p>
              <p className="text-2xl font-black text-gray-900">{producto.stock}</p>
            </div>
            <div className={`rounded-3xl p-4 text-center border transition-colors ${
              tipo === "sumar" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
            }`}>
              <p className="text-[10px] font-black uppercase text-gray-400">Nuevo</p>
              <p className={`text-2xl font-black ${tipo === "sumar" ? "text-green-600" : "text-red-600"}`}>
                {nuevoStockCalculado}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de tipo de movimiento */}
            <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setTipo("sumar")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${
                  tipo === "sumar" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Plus className="w-4 h-4" /> INGRESO
              </button>
              <button
                type="button"
                onClick={() => setTipo("restar")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${
                  tipo === "restar" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Minus className="w-4 h-4" /> SALIDA
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Cantidad a mover
              </Label>
              <Input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
                className="h-14 rounded-2xl text-center text-xl font-black border-gray-200 focus:ring-pink-500"
                required
              />
            </div>

            <DialogFooter className="sm:flex-col gap-2">
              <Button 
                type="submit" 
                disabled={loading || !cantidad}
                className={`w-full h-14 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg ${
                  tipo === "sumar" 
                    ? "bg-green-600 hover:bg-green-700 shadow-green-100" 
                    : "bg-red-600 hover:bg-red-700 shadow-red-100"
                }`}
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Movimiento"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="w-full h-10 rounded-xl font-bold text-gray-400"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}