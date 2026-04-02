"use client";

import { useState, useEffect } from "react";
import type { Producto, Categoria } from "@/types";
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
import { Loader2, Save, Lock, Info } from "lucide-react";

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
        precio: producto.precio?.toString() || "0", // Antes precio_base
        stock: producto.stock?.toString() || "0",   // Antes stock_actual
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
      <DialogContent 
        style={{ background: '#ffffff',
          opacity: 1,
          visibility: 'visible',
        }} 
        className="max-w-md rounded-3xl border-none shadow-2xl overflow-hidden p-0 !bg-white !opacity-100 z-[9999]"
      >
        
        {/* Cabecera con fondo blanco forzado */}
        <div className="flex flex-col bg-white w-full h-full">
          <DialogHeader className="!bg-white">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-slate-800">
              <div className="bg-pink-100 text-pink-600 p-2 rounded-xl">
                <Save className="w-5 h-5" />
              </div>
              EDITAR PRENDA
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-pink-400" />
              Los campos con candado son solo de lectura.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 !bg-white">
          
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Comercial</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500 font-bold h-11 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* SKU (LECTURA) */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> SKU
              </Label>
              <div className="h-11 flex items-center px-4 rounded-xl bg-slate-50 text-slate-500 font-mono text-xs border border-dashed border-slate-200 uppercase">
                {formData.sku}
              </div>
            </div>

            {/* PRECIO (EDITABLE) */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Precio Venta (S/)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="rounded-xl border-gray-200 font-black text-pink-600 focus:border-pink-500 h-11 bg-white"
                required
              />
            </div>
          </div>

          {/* CATEGORÍA */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Línea / Categoría</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
            >
              <SelectTrigger className="rounded-xl border-gray-200 bg-white h-11 font-semibold text-slate-700">
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

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notas / Descripción</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="rounded-xl border-gray-200 resize-none focus:border-pink-500 min-h-[80px] bg-white"
              placeholder="Detalles sobre el material..."
            />
          </div>

          <DialogFooter className="pt-6 border-t border-gray-100 mt-4 flex gap-3 !bg-white">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-400 hover:bg-slate-100 flex-1">
              Descartar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-8 font-black transition-all active:scale-95 shadow-lg shadow-pink-100 flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ACTUALIZAR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}