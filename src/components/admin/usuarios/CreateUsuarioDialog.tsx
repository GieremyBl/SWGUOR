"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, User, Mail, Phone, Lock, Shield, Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateUsuarioDialog({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear personal");
      }

      toast.success("personal creado exitosamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* AQUÍ ESTÁ LA CLAVE DEL TAMAÑO: 
        sm:max-w-[600px] limita el ancho en computadoras. 
        Puedes cambiar 600px por 500px si lo quieres aún más delgado.
      */}
      <DialogContent className="w-[95vw] sm:max-w-[600px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
        {/* Borde superior decorativo */}
        <div className="h-2 w-full bg-pink-600" />
        
        <div className="p-6">
          {/* Encabezado */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Nuevo personal
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                Registra un nuevo acceso y sus permisos.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre Completo - Ocupa las 2 columnas */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Nombre Completo
                </Label>
                <Input name="nombre_completo" placeholder="Ej. Juan Pérez" className="h-11 rounded-xl" required />
              </div>

              {/* Correo - Ocupa 1 columna */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Correo Electrónico
                </Label>
                <Input name="email" type="email" placeholder="correo@guor.com" className="h-11 rounded-xl" required />
              </div>

              {/* Teléfono - Ocupa 1 columna */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Teléfono
                </Label>
                <Input name="telefono" placeholder="Ej. +51 987654321" className="h-11 rounded-xl" />
              </div>

              {/* Contraseña - Ocupa las 2 columnas */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Contraseña Temporal
                </Label>
                <Input name="password" type="password" placeholder="******" className="h-11 rounded-xl" required minLength={6} />
                <p className="text-[10px] text-gray-400 italic px-1">* Mínimo 6 caracteres.</p>
              </div>

              {/* Rol - Ocupa 1 columna */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Rol
                </Label>
                <Select name="rol" defaultValue="recepcionista">
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Seleccionar Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="cortador">Cortador</SelectItem>
                    <SelectItem value="diseñador">Diseñador</SelectItem>
                    <SelectItem value="recepcionista">Recepcionista</SelectItem>
                    <SelectItem value="ayudante">Ayudante</SelectItem>
                    <SelectItem value="representante_taller">Representante Taller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estado - Ocupa 1 columna */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Estado
                </Label>
                <Select name="estado" defaultValue="activo">
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Footer Form */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl" disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-6" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : "Crear personal"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}