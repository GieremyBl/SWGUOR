"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function EditCategoriaDialog({ isOpen, categoria, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (categoria) setActivo(categoria.activo);
  }, [categoria]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("categorias")
        .update({
          nombre: formData.get("nombre"),
          descripcion: formData.get("descripcion"),
          activo: activo
        })
        .eq("id", categoria.id);

      if (error) throw error;
      toast.success("Categoría actualizada");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Categoría</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input name="nombre" defaultValue={categoria?.nombre} required />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input name="descripcion" defaultValue={categoria?.descripcion} />
          </div>
          <div className="flex items-center gap-2 p-2 border rounded-md">
            <Switch checked={activo} onCheckedChange={setActivo} />
            <Label>Categoría Activa</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full bg-pink-600">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}