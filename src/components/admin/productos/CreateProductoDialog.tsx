"use client";

import { useState, useEffect } from "react";
import { generateSKU } from "@/lib/utils/producto-utils";
import { useProducts } from "@/lib/hooks/useProducts";
import { uploadProductImage } from "@/lib/utils/supabase-image-utils"; // Debes crear esta función
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { ImageIcon, Loader2, X } from "lucide-react";

export default function CreateProductoDialog({ isOpen, onClose, onSuccess, categorias }: any) {
  const { productos, refetch } = useProducts();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sku: "",
    precio: "",
    categoria_id: "",
    stock_minimo: "400",
  });

  // Generación automática de SKU (ID 68)
  useEffect(() => {
    if (formData.nombre && formData.categoria_id) {
      const cat = categorias.find((c: any) => c.id.toString() === formData.categoria_id);
      const nextId = (productos?.length || 0) + 1; 
      const newSKU = generateSKU(formData.nombre, cat?.nombre || "CAT", nextId);
      setFormData(prev => ({ ...prev, sku: newSKU }));
    }
  }, [formData.nombre, formData.categoria_id, productos, categorias]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria_id) return toast.error("Selecciona una categoría");
    
    setLoading(true);

    try {
      let finalPath = null;

      // 1. Subir imagen al Storage si existe
      if (file) {
        const uploadResult = await uploadProductImage(file);
        
        // Limpiamos la cadena para extraer SOLO el nombre del archivo final
        if (uploadResult) {
          const parts = String(uploadResult).split('/');
          finalPath = parts[parts.length - 1]; // Extrae solo "mi-foto.png"
        }
      }

      // 2. Preparar objeto exacto para public.productos
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        sku: formData.sku,
        precio: parseFloat(formData.precio),
        stock: 0, // Default inicial
        categoria_id: parseInt(formData.categoria_id),
        imagen: finalPath, // Nombre del archivo en el bucket
        estado: 'activo',
        destacado: false,
        updated_at: new Date().toISOString() // Requerido por constraint NOT NULL
      };

      const response = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al guardar");

      toast.success(`Producto ${formData.sku} creado correctamente`);
      refetch();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-0 bg-white border-none shadow-2xl overflow-hidden">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800">Nueva Prenda</DialogTitle>
            <p className="text-sm text-slate-500">Configura el nuevo producto para el inventario.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* PREVISUALIZACIÓN DE IMAGEN */}
            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 min-h-[140px]">
              {imagePreview ? (
                <div className="relative w-full h-32">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => { setImagePreview(null); setFile(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 text-pink-500 mb-2" />
                  <span className="text-xs font-bold text-slate-500">Añadir foto del producto</span>
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Nombre de la Prenda</Label>
              <Input 
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="rounded-xl border-slate-200" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">SKU (Auto)</Label>
                <Input value={formData.sku} disabled className="bg-slate-50 font-mono text-pink-600 font-bold rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Precio Venta (S/)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  className="rounded-xl border-slate-200" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Categoría</Label>
              <Select onValueChange={(val) => setFormData({...formData, categoria_id: val})}>
                <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                {/* FIX DE TRANSPARENCIA PARA TAILWIND V3.4 */}
                <SelectContent 
                  position="popper" 
                  className="z-[9999] bg-white border border-slate-200 shadow-xl rounded-xl"
                >
                  {categorias.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()} className="cursor-pointer">
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Producto"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}