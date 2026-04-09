"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Layers, Tag } from "lucide-react";

export default function CreateCategoriaDialog({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const categoriaData = {
      nombre: formData.get("nombre"),
      descripcion: formData.get("descripcion"),
      activo: true
    };

    try {
      const response = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al crear");

      toast.success("Categoría registrada correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear la categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] border-none shadow-2xl bg-white p-0 overflow-hidden">
        {/* Banner decorativo superior */}
        <div className="h-2 bg-pink-600 w-full" />
        
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <Layers className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                  Nueva Categoría
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Crea una nueva línea de productos.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Nombre de la Categoría
              </Label>
              <Input 
                name="nombre" 
                placeholder="Ej: Vestidos de Gala, Blusas Casuales..." 
                required 
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400">
                Descripción (Opcional)
              </Label>
              <Textarea 
                name="descripcion" 
                placeholder="Describe qué tipo de productos pertenecen a esta línea..." 
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none rounded-lg min-h-20"
              />
            </div>

            {/* Footer con acciones */}
            <DialogFooter className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                disabled={loading}
                className="text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-200 px-8 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando
                  </span>
                ) : (
                  "Guardar Categoría"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}