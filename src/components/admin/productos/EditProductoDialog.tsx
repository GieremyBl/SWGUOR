"use client";

import { useState, useEffect } from "react";
import type { Producto, Categoria } from "@/types/supabase.types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface EditProductoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: Producto;
  categorias: Categoria[];
}

export default function EditProductoDialog({
  isOpen,
  onClose,
  onSuccess,
  producto,
  categorias,
}: EditProductoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sku: "",
    precio: "",
    stock: "",
    stock_minimo: "",
    categoria_id: "",
    estado: "",
  });

  // Sincronizar el formulario cuando el producto cambie o el diálogo se abra
  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || "",
        descripcion: producto.descripcion || "",
        sku: producto.sku || "",
        precio: producto.precio?.toString() || "0",
        stock: producto.stock?.toString() || "0",
        stock_minimo: producto.stock_minimo?.toString() || "5",
        categoria_id: producto.categoria_id?.toString() || "",
        estado: producto.estado || "activo",
      });
    }
  }, [isOpen, producto]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Preparamos el payload incluyendo el ID para que la API lo encuentre
    const payload = {
      id: producto.id,
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      sku: formData.sku.trim().toUpperCase(),
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      stock_minimo: parseInt(formData.stock_minimo),
      categoria_id: parseInt(formData.categoria_id),
      estado: formData.estado,
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(`/api/admin/productos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Error al actualizar");

    toast.success("Producto actualizado correctamente");
    onSuccess();
    onClose();
  } catch (error: any) {
    console.error("Error:", error);
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-4xl border-none shadow-2xl overflow-hidden p-0 bg-gray-50">
        <div className="bg-white p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <span className="bg-pink-100 text-pink-600 p-2 rounded-xl">
                <Save className="w-5 h-5" />
              </span>
              Editar Producto
            </DialogTitle>
            <DialogDescription className="font-medium text-gray-500">
              Modifica los detalles de la prenda seleccionada.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre del Producto</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="rounded-xl border-gray-200 focus:ring-pink-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">SKU (Protegido)</Label>
              <Input value={formData.sku} disabled className="rounded-xl bg-gray-100 font-mono text-gray-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Precio (S/)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="rounded-xl border-gray-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Categoría</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
            >
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Stock Actual</Label>
              <Input type="number" value={formData.stock} disabled className="rounded-xl bg-gray-100 text-pink-600 font-bold cursor-not-allowed" />
              <p className="text-[9px] text-gray-400 italic text-center">Solo edición vía Taller</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estado del Sistema</Label>
              <div className={`h-10 flex items-center px-4 rounded-xl text-xs font-black uppercase border ${
                parseInt(formData.stock) === 0 ? "bg-red-50 text-red-600 border-red-100" : 
                parseInt(formData.stock) <= 400 ? "bg-orange-50 text-orange-600 border-orange-100" : 
                "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {parseInt(formData.stock) === 0 ? "Agotado" : 
                 parseInt(formData.stock) <= 400 ? "Inactivo (Stock Bajo)" : "Activo"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Descripción</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="rounded-xl border-gray-200 resize-none"
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-gray-900 hover:bg-black text-white rounded-xl px-8 font-black transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Actualizar Prenda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}