"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function CreateCategoriaDialog({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("categorias").insert({
        nombre: formData.get("nombre"),
        descripcion: formData.get("descripcion"),
        activo: true
      });

      if (error) throw error;
      toast.success("Categoría creada con éxito");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al crear la categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva Categoría</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la categoría</Label>
            <Input name="nombre" placeholder="Ej: Faldas, Blusas..." required />
          </div>
          <div className="space-y-2">
            <Label>Descripción (Opcional)</Label>
            <Textarea name="descripcion" placeholder="Breve descripción..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-pink-600">
              {loading ? "Guardando..." : "Crear Categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}