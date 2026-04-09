"use client";

import { useState, useEffect } from "react";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
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

type Producto = Database['public']['Tables']['productos']['Row'];
type Categoria = Database['public']['Tables']['categorias']['Row'];

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
        categoria_id: producto.categoria_id?.toString() || "",
        estado: producto.estado || "activo",
      });
    }
  }, [isOpen, producto]);

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
        sku: formData.sku,
        stock: parseInt(formData.stock),
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
      <DialogContent className="max-w-md p-0">
        {/* Banner rosa superior */}
        <div className="h-2 bg-pink-600 w-full" />

        <div className="p-6 space-y-5">
          {/* Header con icono */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-pink-50 rounded-lg flex-shrink-0">
              <Save className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Editar Producto
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Actualiza los datos del producto
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">
                Nombre Comercial
              </Label>
              <Input
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="rounded-lg border-slate-200 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* SKU (READ-ONLY) */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SKU
                </Label>
                <div className="h-10 flex items-center px-3 rounded-lg bg-slate-50 text-slate-500 font-mono text-xs border border-dashed border-slate-200 uppercase">
                  {formData.sku}
                </div>
              </div>

              {/* PRECIO (EDITABLE) */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">
                  Precio Venta (S/)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({ ...formData, precio: e.target.value })
                  }
                  className="rounded-lg border-slate-200 bg-slate-50 focus:bg-white font-bold text-pink-600"
                  required
                />
              </div>
            </div>

            {/* CATEGORÍA */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">
                Línea / Categoría
              </Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoria_id: value })
                }
              >
                <SelectTrigger className="rounded-lg border-slate-200 bg-slate-50 focus:bg-white">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* STOCK (READ-ONLY) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Stock Físico
                </Label>
                <div className="h-10 flex items-center px-3 rounded-lg bg-slate-50 text-slate-600 font-bold border border-dashed border-slate-200">
                  {formData.stock} und.
                </div>
              </div>

              <div
                className={`h-10 flex items-center justify-center px-3 rounded-lg text-[10px] font-black uppercase border ${
                  parseInt(formData.stock) === 0
                    ? "bg-red-50 text-red-600 border-red-100"
                    : parseInt(formData.stock) <= 5
                    ? "bg-orange-50 text-orange-600 border-orange-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}
              >
                {parseInt(formData.stock) === 0
                  ? "Agotado"
                  : parseInt(formData.stock) <= 5
                  ? "Bajo Stock"
                  : "Suficiente"}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">
                Notas / Descripción
              </Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="rounded-lg border-slate-200 bg-slate-50 focus:bg-white resize-none min-h-[80px]"
                placeholder="Detalles sobre el material..."
              />
            </div>

            {/* Footer */}
            <DialogFooter className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Descartar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Actualizar
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}