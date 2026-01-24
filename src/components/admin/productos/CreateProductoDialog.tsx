"use client";

import { useState } from "react";
import type { Categoria } from "@/types/supabase.types";
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
import { toast } from "sonner";
import { ImageIcon, Loader2 } from "lucide-react";

export default function CreateProductoDialog({
  isOpen,
  onClose,
  onSuccess,
  categorias,
}: any) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sku: "",
    precio: "",
    stock: "0",
    stock_minimo: "400",
    categoria_id: "",
    estado: "activo",
    imagen_url: "",
  });

  // Lógica para subir imagen a Supabase Storage (vía API o directa)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `productos/${fileName}`;
      
      toast.info("Subida de imagen preparada (Configura Storage para activar)");
      // setFormData({ ...formData, imagen_url: publicUrl });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const categoriaNombre = categorias.find((c: any) => c.id.toString() === formData.categoria_id)?. nombre || "CAT";
    const skuGenerado = `${formData.nombre.substring(0,3)}-${categoriaNombre.substring(0,3)}`.toUpperCase();

    try {
      const response = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({formData, sku: skuGenerado}),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al crear");

      toast.success("Producto creado exitosamente");
      setFormData({ nombre: "", descripcion: "", sku: "", precio: "", stock: "0", stock_minimo: "10", categoria_id: "", estado: "activo", imagen_url: "" });
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Nueva Prenda</DialogTitle>
          <DialogDescription>Completa los detalles del producto.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Selector de Imagen */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-6 hover:bg-gray-50 transition-colors relative cursor-pointer">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-xs font-bold text-gray-500">{uploading ? "Subiendo..." : "Click para subir foto"}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre</Label>
            <Input className="rounded-xl border-gray-200" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Vestido Gala Noche" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU (Auto)</Label>
              <Input className="rounded-xl bg-gray-50 cursor-not-allowed" placeholder="Generado por sistema" disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Precio (S/)</Label>
              <Input type="number" step="0.01" className="rounded-xl border-gray-200" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Categoría</Label>
            <Select onValueChange={(val) => setFormData({...formData, categoria_id: val})}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Inicial</Label>
              <Input type="number" className="rounded-xl bg-gray-100" value={formData.stock} disabled />
              <p className="text-[9px] text-pink-500 font-bold">Carga exclusiva de Taller</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Mínimo</Label>
              <Input type="number" className="rounded-xl" value={formData.stock_minimo} onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})} />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancelar</Button>
            <Button type="submit" disabled={loading} className="rounded-xl bg-pink-600 hover:bg-pink-700 font-black px-8">
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Guardar Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}