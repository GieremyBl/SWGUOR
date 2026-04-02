"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";

export default function StockMovimientosDialog({ isOpen, producto, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "salida">("entrada");
  const [motivo, setMotivo] = useState("Producción");

  const handleSubmit = async () => {
    if (!cantidad || Number(cantidad) <= 0) return toast.error("Ingresa una cantidad válida");
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/productos/${producto.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantidad: Number(cantidad),
          tipo_movimiento: tipo,
          motivo: motivo,
        })
      });

      if (!response.ok) throw new Error("Error al registrar movimiento");

      toast.success(`Stock actualizado: ${tipo === 'entrada' ? '+' : '-'}${cantidad} unidades`);
      onSuccess(); // Refetch de la página principal
      onClose();
    } catch (error) {
      toast.error("No se pudo actualizar el inventario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="text-pink-600" /> Registrar Movimiento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="bg-gray-50 p-3 rounded-lg border">
            <p className="text-xs text-gray-500 font-bold uppercase">Producto seleccionado</p>
            <p className="font-bold text-gray-800">{producto.nombre} ({producto.sku})</p>
            <p className="text-sm text-pink-600">Stock actual: {producto.stock} uds</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              type="button" 
              variant={tipo === 'entrada' ? 'default' : 'outline'}
              className={tipo === 'entrada' ? 'bg-emerald-600' : ''}
              onClick={() => setTipo('entrada')}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" /> Entrada
            </Button>
            <Button 
              type="button" 
              variant={tipo === 'salida' ? 'default' : 'outline'}
              className={tipo === 'salida' ? 'bg-red-600' : ''}
              onClick={() => setTipo('salida')}
            >
              <ArrowDownCircle className="mr-2 h-4 w-4" /> Salida
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Cantidad de unidades</Label>
            <Input 
              type="number" 
              value={cantidad} 
              onChange={(e) => setCantidad(e.target.value)} 
              placeholder="Ej: 50"
            />
          </div>

          <div className="space-y-2">
            <Label>Motivo / Referencia</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Producción">Ingreso por Producción</SelectItem>
                <SelectItem value="Devolución">Devolución de Cliente</SelectItem>
                <SelectItem value="Ajuste">Ajuste de Inventario</SelectItem>
                <SelectItem value="Muestra">Salida para Muestrario</SelectItem>
                <SelectItem value="Dañado">Producto Dañado/Merma</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {loading ? "Registrando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}