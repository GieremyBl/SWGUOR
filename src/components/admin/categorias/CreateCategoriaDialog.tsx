"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Layers } from "lucide-react";

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
      // LLAMADA A TU API EN LUGAR DE SUPABASE DIRECTO
      const response = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al crear");

      toast.success("Categoría registrada correctamente");
      onSuccess(); // Recarga la tabla de categorías
      onClose();   // Cierra el modal
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear la categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Layers className="text-pink-600 w-5 h-5" /> Nueva Línea de Producto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-xs font-bold uppercase text-gray-500">
              Nombre de la Categoría
            </Label>
            <Input 
              id="nombre"
              name="nombre" 
              placeholder="Ej: Vestidos de Gala, Blusas Casuales..." 
              required 
              className="rounded-xl border-gray-200 focus:ring-pink-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-xs font-bold uppercase text-gray-500">
              Descripción (Opcional)
            </Label>
            <Textarea 
              id="descripcion"
              name="descripcion" 
              placeholder="Describe qué tipo de productos pertenecen a esta línea..." 
              className="rounded-xl border-gray-200 min-h-25 resize-none focus:ring-pink-500"
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-pink-100 transition-all"
            >
              {loading ? "Sincronizando..." : "Guardar Categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}