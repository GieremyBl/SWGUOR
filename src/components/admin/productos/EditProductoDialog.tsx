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
  DialogHeader,
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
import { Loader2, Save, Lock, Edit3, Package, Tag } from "lucide-react";

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

      toast.success("Información del producto actualizada");
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
      <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
        
        {/* Header Estilo GUOR (Pink) */}
        <div className="bg-pink-600 p-6 text-white relative">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Editar Producto
              </DialogTitle>
            </div>
            <DialogDescription className="text-pink-100 font-medium">
              Modifica los valores comerciales de la prenda.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* NOMBRE COMERCIAL */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Package className="w-3 h-3 text-pink-500" /> Nombre del Producto
            </Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 transition-all font-bold text-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* SKU (READ-ONLY) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-300" /> Identificador SKU
              </Label>
              <div className="h-12 flex items-center px-3 rounded-xl bg-slate-100 text-slate-500 font-mono text-xs border border-dashed border-slate-200 uppercase">
                {formData.sku}
              </div>
            </div>

            {/* PRECIO (EDITABLE) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Precio Venta (S/)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 font-black text-pink-600 text-lg"
                required
              />
            </div>
          </div>

          {/* CATEGORÍA */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Tag className="w-3 h-3 text-pink-500" /> Línea / Categoría
            </Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-700">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()} className="font-medium">
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* STOCK Y ESTADO (VISUALIZACIÓN) */}
          <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-inner">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Stock Disponible</p>
              <p className="text-xl font-black italic">{formData.stock} <small className="text-[10px] not-italic text-slate-400 uppercase tracking-tighter">unidades</small></p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
              parseInt(formData.stock) === 0 ? "bg-red-500/10 text-red-400 border-red-500/20" : 
              parseInt(formData.stock) <= 5 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : 
              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {parseInt(formData.stock) === 0 ? "Agotado" : parseInt(formData.stock) <= 5 ? "Crítico" : "Suficiente"}
            </div>
          </div>

          {/* NOTAS */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Notas Adicionales
            </Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white resize-none min-h-[80px] text-sm"
              placeholder="Detalles sobre el material o temporada..."
            />
          </div>

          {/* ACCIONES */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Descartar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-pink-100 active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> Actualizar
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}