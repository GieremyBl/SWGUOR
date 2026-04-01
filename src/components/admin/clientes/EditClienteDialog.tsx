"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Hash, Phone, Mail, MapPin, Activity } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function EditClienteDialog({ isOpen, onClose, cliente, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(cliente?.activo || "activo");

  useEffect(() => {
    if (cliente?.activo) setStatus(cliente.activo);
  }, [cliente, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = getSupabaseBrowserClient();
    
    const updatedData = {
      razon_social: formData.get("razon_social"),
      ruc: formData.get("ruc"),
      telefono: formData.get("telefono"),
      email: formData.get("email"),
      direccion: formData.get("direccion"),
      activo: status,
    };

    try {
      const { error } = await (supabase.from("clientes") as any)
        .update(updatedData)
        .eq("id", cliente.id);

      if (error) throw error;
      toast.success("Cambios guardados");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* max-w-[550px] para dar espacio a la grilla de clientes */}
      <DialogContent className="sm:max-w-[550px] border-none shadow-2xl bg-white p-0 overflow-hidden outline-none">
        {/* Banner decorativo superior ROSA */}
        <div className="h-2 bg-pink-600 w-full" />
        
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-pink-50 rounded-lg shrink-0">
                <Building2 className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight text-left">
                  Configuración de Cliente
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-left mt-1">
                  Modifica los datos comerciales y de contacto del cliente.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo: Nombre Comercial */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Nombre Comercial
              </Label>
              <Input 
                name="razon_social" 
                defaultValue={cliente?.razon_social}
                required
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11 text-slate-700 font-medium"
                placeholder="Ej. Almacenes Primavera Perú"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Campo: DNI / RUC */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> DNI / RUC
                </Label>
                <Input
                  name="ruc"
                  defaultValue={cliente?.ruc}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11 text-slate-700 font-medium"
                  placeholder="Ej. 20113355779"
                />
              </div>

              {/* Campo: Teléfono */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Teléfono
                </Label>
                <Input
                  name="telefono"
                  defaultValue={cliente?.telefono}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11 text-slate-700 font-medium"
                  placeholder="Ej. 955112233"
                />
              </div>
            </div>

            {/* Campo: Correo Electrónico */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico
              </Label>
              <Input
                name="email"
                type="email"
                defaultValue={cliente?.email}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11 text-slate-700 font-medium"
                placeholder="correo@empresa.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Campo: Dirección */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Dirección
                </Label>
                <Input
                  name="direccion"
                  defaultValue={cliente?.direccion}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11 text-slate-700 font-medium"
                  placeholder="Ej. Av. Primavera 1230"
                />
              </div>

              {/* Campo: Estado de Cuenta */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Estado de Cuenta
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 text-slate-700 font-medium">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="activo" className="font-medium py-2">Activo</SelectItem>
                    <SelectItem value="inactivo" className="font-medium py-2">Inactivo</SelectItem>
                    <SelectItem value="suspendido" className="font-medium py-2">Suspendido</SelectItem>
                    <SelectItem value="potencial" className="font-medium py-2">Potencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Footer con acciones */}
            <DialogFooter className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-3 sm:justify-end">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                disabled={loading}
                className="text-slate-500 hover:bg-slate-100 rounded-xl px-6 h-11 font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-200 rounded-xl px-8 h-11 transition-all font-bold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>

      </DialogContent>
    </Dialog>
  );
}