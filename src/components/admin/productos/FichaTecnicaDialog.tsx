"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription, 
  DialogHeader
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Loader2, 
  Paperclip, 
  ExternalLink,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Producto } from "@/types/supabase.types";

interface FichaTecnicaProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto;
  onSuccess: () => void;
  canUpload?: boolean; 
}

export default function FichaTecnicaDialog({ 
  isOpen, 
  onClose, 
  producto, 
  onSuccess,
  canUpload = false 
}: FichaTecnicaProps) {
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const BUCKET_NAME = 'fichas-tecnicas';

  const getSignedLink = useCallback(async (path: string) => {
    if (!path) return;
    setLoadingUrl(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, 3600); 

      if (error) throw error;
      setSignedUrl(data.signedUrl);
    } catch (error) {
      console.error("Error generando link:", error);
      setSignedUrl(null);
    } finally {
      setLoadingUrl(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && producto.ficha_url) {
      getSignedLink(producto.ficha_url);
    } else {
      setSignedUrl(null);
    }
  }, [isOpen, producto.ficha_url, getSignedLink]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) return toast.error("No tienes permisos de edición");
    
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) return toast.error("Máximo 10MB permitido");

      setUploading(true);
      const supabase = getSupabaseBrowserClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `guor-${producto.sku}-${Date.now()}.${fileExt}`.toLowerCase();

      // 1. Subir a Storage (Raíz del bucket)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // 2. Actualizar DB
      const response = await fetch(`/api/admin/productos?id=${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ficha_url: fileName }),
      });

      if (!response.ok) throw new Error("Error al vincular el archivo en la base de datos");

      toast.success("Expediente resguardado");
      onSuccess();
      getSignedLink(fileName);
    } catch (error: any) {
      console.error("Error crítico:", error);
      toast.error(error.message || "Error en el servidor de archivos");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!producto.ficha_url) return;
    if (!confirm("¿Eliminar este diseño técnico de forma permanente?")) return;
    
    try {
      setLoadingUrl(true);
      const supabase = getSupabaseBrowserClient();
      
      // Borrar del storage
      await supabase.storage.from(BUCKET_NAME).remove([producto.ficha_url]);

      // Borrar de la DB
      const response = await fetch(`/api/admin/productos?id=${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ficha_url: null }),
      });

      if (!response.ok) throw new Error("Error al limpiar el registro");

      toast.success("Archivo eliminado");
      setSignedUrl(null);
      onSuccess();
    } catch (error: any) {
      toast.error("Error al eliminar");
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <div className="pt-10 pb-2 px-8 text-center">
          <DialogHeader className="space-y-2 items-center justify-center">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              Expediente Técnico
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Modas y Estilos GUOR | Propiedad Intelectual
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 pt-4 space-y-6">
          {producto.ficha_url ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-[1.8rem] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-600 rounded-2xl text-white shadow-lg shadow-pink-100">
                    <FileText size={20} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[11px] font-black uppercase text-slate-700 truncate w-32">
                      {producto.sku}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      Archivo Registrado
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {loadingUrl ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  ) : (
                    <>
                      {signedUrl && (
                        <a 
                          href={signedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-3 bg-white border border-slate-200 hover:border-pink-200 rounded-xl text-slate-600 hover:text-pink-600 transition-all shadow-sm active:scale-90"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                      {canUpload && (
                        <button 
                          onClick={handleDelete}
                          className="p-3 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 transition-all active:scale-90"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group">
              {canUpload ? (
                <>
                  <input 
                    type="file" 
                    onChange={handleUpload} 
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div className="border-2 border-dashed border-slate-200 rounded-[2.2rem] p-10 text-center group-hover:border-pink-300 transition-all bg-slate-50/50 group-hover:bg-pink-50/30">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Resguardando...</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white w-14 h-14 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            <Paperclip className="w-7 h-7 text-slate-400 group-hover:text-pink-500" />
                        </div>
                        <p className="text-[11px] font-black uppercase text-slate-600 tracking-widest">Subir Patrón</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase text-center">PDF, JPG, PNG</p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="border-2 border-slate-100 rounded-[2.2rem] p-10 text-center bg-slate-50/50 border-dashed">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2 opacity-50" />
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.15em] italic leading-relaxed text-center">
                    Esperando que el diseñador<br/>cargue el expediente
                  </p>
                </div>
              )}
            </div>
          )}

          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full font-black text-slate-400 hover:text-rose-500 hover:bg-rose-50 uppercase text-[10px] tracking-[0.25em] h-12 rounded-2xl transition-all"
          >
            Cerrar Expediente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}