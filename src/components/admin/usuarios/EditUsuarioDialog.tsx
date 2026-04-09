"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCog, ShieldCheck, User, Mail, Fingerprint } from "lucide-react";
import type { Database } from "@/types/database";
type RolUsuario = Database['public']['Enums']['rol'];

const ROLES_SISTEMA: { value: RolUsuario; label: string }[] = [
  { value: "gerente", label: "Gerente General" },
  { value: "administrador", label: "Administrador" },
  { value: "recepcionista", label: "Recepcionista" },
  { value: "disenador", label: "Diseñador" },
  { value: "cortador", label: "Cortador" },
  { value: "ayudante", label: "Ayudante" },
  { value: "representante_taller", label: "Representante de Taller" },
];

export default function EditUsuarioDialog({ isOpen, onClose, onSuccess, usuario }: any) {
  const [loading, setLoading] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario>(usuario?.rol);

  useEffect(() => {
    if (usuario) {
      setRolSeleccionado(usuario.rol);
    }
  }, [usuario]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = { ...Object.fromEntries(formData), id: usuario.id, rol: rolSeleccionado };

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Perfil actualizado con éxito");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("No se pudieron guardar los cambios");
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
                <UserCog className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                  Configuración de Usuario
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Modifica los accesos y datos personales del personal.
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
                defaultValue={usuario?.nombre_completo} 
                required 
                placeholder="Nombre del colaborador"
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
              />
            </div>

            {/* Campo: Email (Informativo o editable según tu lógica) */}
            <div className="space-y-2 opacity-80">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico
              </Label>
              <Input 
                name="email" 
                defaultValue={usuario?.email} 
                disabled 
                className="bg-slate-100 border-dashed cursor-not-allowed h-11"
              />
            </div>

            {/* Campo: Rol con Estilo */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Nivel de Acceso (Rol)
              </Label>
              <Select 
                value={rolSeleccionado} 
                onValueChange={(value) => setRolSeleccionado(value as RolUsuario)}
              >
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Seleccione un cargo" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ROLES_SISTEMA.map((rol) => (
                    <SelectItem key={rol.value} value={rol.value} className="py-2">
                      <span className="font-medium text-slate-700">{rol.label}</span>
                    </SelectItem>
                  ))}
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