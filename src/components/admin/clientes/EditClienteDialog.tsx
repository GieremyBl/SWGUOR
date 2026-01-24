"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit3 } from "lucide-react";

export default function EditClienteDialog({ isOpen, onClose, cliente, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Construimos el objeto con los campos reales de tu tabla 'clientes'
    const updatedData = {
      id: cliente.id, // El ID es vital para el WHERE en la API
      razon_social: formData.get("razon_social"),
      ruc: formData.get("ruc"),
      telefono: formData.get("telefono"),
      email: formData.get("email"),
      direccion: formData.get("direccion"),
    };

    try {
      // LLAMADA A LA API CON MÉTODO PATCH
      const response = await fetch('/api/admin/clientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al actualizar");

      toast.success("Datos actualizados correctamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Edit3 className="text-pink-600 w-5 h-5" /> Editar Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="razon_social" className="text-xs font-bold uppercase text-gray-500">
              Razón Social / Nombre
            </Label>
            <Input 
              id="razon_social" 
              name="razon_social" 
              required 
              defaultValue={cliente?.razon_social}
              className="rounded-xl border-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ruc" className="text-xs font-bold uppercase text-gray-500">DNI / RUC</Label>
              <Input
                id="ruc"
                name="ruc"
                defaultValue={cliente?.ruc}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-xs font-bold uppercase text-gray-500">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                defaultValue={cliente?.telefono}
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase text-gray-500">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={cliente?.email}
              className="rounded-xl border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-xs font-bold uppercase text-gray-500">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={cliente?.direccion}
              className="rounded-xl border-gray-200"
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-8 font-bold"
            >
              {loading ? "Guardando..." : "Actualizar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}