"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Usamos Textarea para descripción
import { toast } from "sonner";
import { Edit3 } from "lucide-react";

export default function EditCategoriaDialog({ isOpen, categoria, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [activo, setActivo] = useState(true);

  // Sincronizar el estado del Switch cuando se abre el modal con una categoría
  useEffect(() => {
    if (categoria) setActivo(categoria.activo);
  }, [categoria]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Objeto de datos alineado con lo que espera tu API PATCH
    const updatedData = {
      id: categoria.id,
      nombre: formData.get("nombre"),
      descripcion: formData.get("descripcion"),
      activo: activo
    };

    try {
      // LLAMADA A TU API EN LUGAR DE SUPABASE DIRECTO
      const response = await fetch('/api/admin/categorias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al actualizar");

      toast.success("Categoría actualizada con éxito");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Edit3 className="text-pink-600 w-5 h-5" /> Editar Categoría
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-xs font-bold uppercase text-gray-500">
              Nombre de la Línea
            </Label>
            <Input 
              id="nombre"
              name="nombre" 
              defaultValue={categoria?.nombre} 
              required 
              className="rounded-xl border-gray-200 focus:ring-pink-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-xs font-bold uppercase text-gray-500">
              Descripción
            </Label>
            <Textarea 
              id="descripcion"
              name="descripcion" 
              defaultValue={categoria?.descripcion} 
              className="rounded-xl border-gray-200 min-h-20 resize-none focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Estado de la Categoría</Label>
              <p className="text-xs text-gray-500">
                {activo ? "Visible en la tienda y catálogo" : "Oculta temporalmente"}
              </p>
            </div>
            <Switch 
              checked={activo} 
              onCheckedChange={setActivo}
              className="data-[state=checked]:bg-pink-600"
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
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-pink-100 transition-all flex-1"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}