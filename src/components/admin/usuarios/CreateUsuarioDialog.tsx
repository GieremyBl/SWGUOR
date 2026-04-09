"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Mail, ShieldCheck, User } from "lucide-react";

export default function CreateUsuarioDialog({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Usuario creado correctamente");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al crear usuario");
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
                <UserPlus className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                  Nuevo Usuario
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Crea una nueva cuenta para un miembro del equipo.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo: Nombre */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Nombre Completo
              </Label>
              <Input 
                name="nombre_completo" 
                placeholder="Ej. Juan Pérez"
                required 
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
              />
            </div>

            {/* Campo: Email */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico
              </Label>
              <Input 
                name="email" 
                type="email"
                placeholder="correo@modasguor.com"
                required 
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
              />
            </div>

            {/* Campo: Rol */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Nivel de Acceso (Rol)
              </Label>
              <Select name="rol" defaultValue="recepcionista">
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Seleccione un cargo" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="gerente_general">Gerente General</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="recepcionista">Recepcionista</SelectItem>
                  <SelectItem value="disenador">Diseñador</SelectItem>
                  <SelectItem value="cortador">Cortador</SelectItem>
                  <SelectItem value="ayudante">Ayudante</SelectItem>
                  <SelectItem value="representante_taller">Representante de Taller</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400 italic">
                * El rol determina los módulos a los que el usuario puede entrar.
              </p>
            </div>

            {/* Footer con acciones */}
            <DialogFooter className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
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
                    Creando
                  </span>
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}