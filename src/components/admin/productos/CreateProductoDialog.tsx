"use client";

import { useState, useEffect, useCallback } from "react";
import { generateSKU } from "@/lib/utils/producto-utils";
import { useProducts } from "@/lib/hooks/useProducts";
import { uploadProductImage } from "@/lib/utils/supabase-image-utils";
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
import { toast } from "sonner";
import { ImageIcon, Loader2, X, Plus, UploadCloud, Tag, Package, Lock } from "lucide-react";

export default function CreateProductoDialog({ isOpen, onClose, onSuccess, categorias }: any) {
  const { productos, refetch } = useProducts();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sku: "",
    precio: "",
    categoria_id: "",
  });

  // Generación automática de SKU
  useEffect(() => {
    if (formData.nombre && formData.categoria_id) {
      const cat = categorias.find((c: any) => c.id.toString() === formData.categoria_id);
      const nextId = (productos?.length || 0) + 1; 
      const newSKU = generateSKU(formData.nombre, cat?.nombre || "CAT", nextId);
      setFormData(prev => ({ ...prev, sku: newSKU }));
    }
  }, [formData.nombre, formData.categoria_id, productos, categorias]);

  // Manejo de archivos (Drag & Drop y Click)
  const processFile = (selectedFile: File) => {
    if (selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      toast.error("Por favor, sube solo archivos de imagen");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria_id) return toast.error("Selecciona una categoría");
    
    setLoading(true);
    try {
      let finalPath = null;
      if (file) finalPath = await uploadProductImage(file);

      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        sku: formData.sku,
        precio: parseFloat(formData.precio),
        stock: 0,
        categoria_id: parseInt(formData.categoria_id),
        imagen: finalPath,
        estado: 'activo',
        updated_at: new Date().toISOString()
      };

      const response = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoData),
      });

      if (!response.ok) throw new Error("Error al guardar el producto");

      toast.success(`Producto ${formData.sku} creado correctamente`);
      refetch();
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
        
        {/* Header Estilo GUOR */}
        <div className="bg-pink-600 p-6 text-white relative">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Nueva Prenda
              </DialogTitle>
            </div>
            <DialogDescription className="text-pink-100 font-medium">
              Registra un nuevo ingreso al inventario de GUOR.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* ZONA DE DRAG & DROP */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all duration-300 ${
              isDragging 
                ? "border-pink-500 bg-pink-50 scale-[1.02]" 
                : imagePreview 
                  ? "border-slate-200 bg-white" 
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {imagePreview ? (
              <div className="relative w-full aspect-video">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setFile(null); }}
                  className="absolute -top-2 -right-2 bg-slate-900 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center group">
                <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? "bg-pink-100" : "bg-white shadow-sm"}`}>
                  <UploadCloud className={`w-8 h-8 ${isDragging ? "text-pink-600" : "text-slate-400 group-hover:text-pink-500"}`} />
                </div>
                <span className="text-xs font-black uppercase text-slate-500 tracking-widest text-center">
                  Arrastra una foto aquí <br />
                  <span className="text-[10px] font-bold text-slate-400">o haz clic para buscar</span>
                </span>
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
            )}
          </div>

          {/* CAMPOS DEL FORMULARIO */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Package className="w-3 h-3 text-pink-500" /> Nombre del Producto
              </Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all font-bold text-slate-700"
                required
                placeholder="Ej. Blusa Girasol"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SKU Sugerido
                </Label>
                <div className="h-12 flex items-center px-3 rounded-xl bg-slate-100 text-pink-600 font-mono text-xs font-black border border-dashed border-slate-200 uppercase">
                  {formData.sku || "PENDIENTE..."}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Precio Venta (S/)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white font-black text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Tag className="w-3 h-3 text-pink-500" /> Línea / Categoría
              </Label>
              <Select onValueChange={(val) => setFormData({ ...formData, categoria_id: val })}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-700">
                  <SelectValue placeholder="Seleccionar categoría..." />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
                  {categorias.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()} className="font-medium">
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
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
                  <Plus className="w-4 h-4" /> Guardar Producto
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}