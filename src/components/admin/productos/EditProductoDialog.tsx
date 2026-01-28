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
import { Loader2, Save, Lock } from "lucide-react";

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

  useEffect(() => {
    if (producto && isOpen) {
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

    const handleClose = () => {
    onClose(); // Primero cerramos el modal (visual)
    setTimeout(() => {
      onSuccess(); // Luego refrescamos los datos (pesado)
    }, 100); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        id: producto.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: parseFloat(formData.precio),
        categoria_id: parseInt(formData.categoria_id),
        // Mantenemos SKU y Stock intactos ya que son protegidos
        sku: formData.sku,
        stock: parseInt(formData.stock),
        stock_minimo: parseInt(formData.stock_minimo),
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

      toast.success("Información actualizada exitosamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl overflow-hidden p-0 bg-gray-50">
        <div className="bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <span className="bg-pink-100 text-pink-600 p-2 rounded-xl">
                <Save className="w-5 h-5" />
              </span>
              EDITAR PRENDA
            </DialogTitle>
            <DialogDescription className="font-medium text-gray-500">
              Solo los campos de información comercial son editables.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre editable */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Comercial</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="rounded-xl border-gray-200 focus:ring-pink-500 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* SKU Bloqueado */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> SKU
              </Label>
              <Input value={formData.sku} disabled className="rounded-xl bg-gray-100 font-mono text-gray-500 cursor-not-allowed border-dashed" />
            </div>
            {/* Precio editable */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Precio Venta (S/)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="rounded-xl border-gray-200 font-black text-pink-600 focus:ring-pink-500"
                required
              />
            </div>
          </div>

          {/* Categoría editable */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Línea / Categoría</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
            >
              <SelectTrigger className="rounded-xl border-gray-200 bg-white">
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
            {/* Stock Bloqueado */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Stock Físico
              </Label>
              <div className="h-10 flex items-center px-4 rounded-xl bg-gray-100 text-gray-600 font-bold border border-dashed">
                {formData.stock} unidades
              </div>
            </div>
            {/* Estado Informativo */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estado Stock</Label>
              <div className={`h-10 flex items-center px-4 rounded-xl text-[10px] font-black uppercase border ${
                parseInt(formData.stock) === 0 ? "bg-red-50 text-red-600 border-red-100" : 
                parseInt(formData.stock) <= parseInt(formData.stock_minimo) ? "bg-orange-50 text-orange-600 border-orange-100" : 
                "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {parseInt(formData.stock) === 0 ? "Agotado" : 
                 parseInt(formData.stock) <= parseInt(formData.stock_minimo) ? "Reponer Stock" : "Suficiente"}
              </div>
            </div>
          </div>

          {/* Descripción editable */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Descripción de la Prenda</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="rounded-xl border-gray-200 resize-none focus:ring-pink-500"
              rows={3}
              placeholder="Detalles sobre el material, tallas o cuidados..."
            />
          </div>

          <DialogFooter className="pt-4 bg-gray-50 -mx-6 -mb-6 p-6">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-gray-500">
              Descartar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-10 font-black transition-all active:scale-95 shadow-lg shadow-pink-100"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "GUARDAR CAMBIOS"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}