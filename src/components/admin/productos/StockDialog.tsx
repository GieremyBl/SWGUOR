"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
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
import { Plus, Minus } from "lucide-react";

interface StockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: Producto;
}

export default function StockDialog({
  isOpen,
  onClose,
  onSuccess,
  producto,
}: StockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [tipo, setTipo] = useState<"sumar" | "restar">("sumar");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cantidad || isNaN(Number(cantidad))) {
      toast.error("Ingresa una cantidad válida");
      return;
    }

    try {
      setLoading(true);

      const cantidadNum = parseInt(cantidad);
      const nuevoStock =
        tipo === "sumar"
          ? producto.stock + cantidadNum
          : Math.max(0, producto.stock - cantidadNum);

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("productos")
        .update({
          stock: nuevoStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", producto.id);

      if (error) throw error;

      const mensaje =
        tipo === "sumar"
          ? `${cantidadNum} unidades agregadas`
          : `${cantidadNum} unidades removidas`;

      toast.success(`Stock actualizado: ${mensaje}`);
      setCantidad("");
      onSuccess();
    } catch (error) {
      console.error("Error actualizando stock:", error);
      toast.error("Error al actualizar el stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
          <DialogDescription>
            {producto.nombre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Stock Actual</p>
              <p className="text-3xl font-bold">{producto.stock}</p>
              <p className="text-gray-600 text-xs mt-1">
                Mínimo: {producto.stock_minimo}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipo("sumar")}
                  className={`flex-1 p-2 rounded border-2 transition ${
                    tipo === "sumar"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <Plus className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm font-medium">Agregar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("restar")}
                  className={`flex-1 p-2 rounded border-2 transition ${
                    tipo === "restar"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <Minus className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm font-medium">Remover</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ingresa la cantidad"
                min="0"
                required
              />
            </div>

            {cantidad && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Nuevo stock:</span>{" "}
                  {tipo === "sumar"
                    ? producto.stock + parseInt(cantidad)
                    : Math.max(0, producto.stock - parseInt(cantidad))}
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !cantidad}>
                {loading ? "Actualizando..." : "Actualizar Stock"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
