"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Edit3 } from "lucide-react";
export default function DeleteClienteDialog({ isOpen, onClose, cliente, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
    const handleDelete = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("usuarios").delete().eq("id", cliente.id);
        if (error) throw error;
        toast.success("Cliente eliminado correctamente");
        onSuccess();
        onClose();
    } catch (err) {
      toast.error("Error al eliminar cliente");
    } finally {
        setLoading(false);
    }
    };
    return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Edit3 className="text-pink-600" /> Eliminar Cliente Administrativo
            </DialogTitle>
        </DialogHeader>
        <div className="py-4">
            <p>¿Estás seguro de que deseas eliminar al cliente <strong>{cliente?.nombre}</strong>? Esta acción no se puede deshacer.</p>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? 'Eliminando...' : 'Eliminar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}