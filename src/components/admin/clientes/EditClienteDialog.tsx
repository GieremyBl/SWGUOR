"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Edit3 } from "lucide-react";
export default function EditClienteDialog({ isOpen, onClose, cliente, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("usuarios").update({    
        nombre: formData.get("nombre"),
        email: formData.get("email"),
        telefono: formData.get("telefono"),
        documento: formData.get("documento"),
      }).eq("id", cliente.id);
      if (error) throw error;
        toast.success("Cliente actualizado correctamente");
        onSuccess();
        onClose();
    } catch (err) {
      toast.error("Error al actualizar cliente");
    } finally {
        setLoading(false);
    }
  };
    return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Edit3 className="text-pink-600" /> Editar Cliente Administrativo 
            </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo / Razón Social</Label>
                <Input 
                  id="nombre"
                  name="nombre"
                  required
                  defaultValue={cliente?.nombre}
                  placeholder="Ej: Juan Pérez"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="documento">DNI / RUC</Label>
                    <Input
                        id="documento"
                        name="documento"
                        defaultValue={cliente?.documento}
                        placeholder="Opcional"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono / Celular</Label>
                    <Input
                        id="telefono"
                        name="telefono"
                        defaultValue={cliente?.telefono}
                        placeholder="999..."
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue={cliente?.email}
                    placeholder="ejemplo@correo.com"
                />
            </div>
            <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading} className="w-full bg-pink-600 hover:bg-pink-700">
                    {loading ? "Actualizando..." : "Guardar Cambios"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}