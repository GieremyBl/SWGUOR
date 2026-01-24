"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
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
}

export default function FichaTecnicaDialog({ 
  isOpen, 
  onClose, 
  producto, 
  onSuccess 
}: FichaTecnicaProps) {
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Efecto para obtener la URL firmada si el producto ya tiene un archivo
  useEffect(() => {
    if (isOpen && producto.ficha_url) {
      getSignedLink(producto.ficha_url);
    }
  }, [isOpen, producto.ficha_url]);

  const getSignedLink = async (path: string) => {
    setLoadingUrl(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.storage
        .from('fichas-tecnicas')
        .createSignedUrl(path, 3600); // 1 hora de validez

      if (error) throw error;
      setSignedUrl(data.signedUrl);
    } catch (error) {
      console.error("Error generando link:", error);
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const supabase = getSupabaseBrowserClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${producto.sku}-${Date.now()}.${fileExt}`;
      const filePath = `disenos/${fileName}`;

      // 1. Subir al Bucket PRIVADO
      const { error: uploadError } = await supabase.storage
        .from('fichas-tecnicas')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Actualizar la base de datos con la RUTA (no la URL)
      const response = await fetch(`/api/admin/productos?id=${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ficha_url: filePath }),
      });

      if (!response.ok) throw new Error("Error al vincular el archivo");

      toast.success("Diseño resguardado en el servidor privado");
      onSuccess();
      getSignedLink(filePath);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-4xl border-none shadow-2xl p-0 overflow-hidden bg-white">
        <div className="bg-slate-900 p-6 text-white text-center">
          <FileText className="w-8 h-8 text-pink-500 mx-auto mb-2" />
          <DialogTitle className="uppercase font-black tracking-tighter text-xl">
            Archivo de Producción
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            SKU: {producto.sku} | {producto.nombre}
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6">
          {producto.ficha_url ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg text-white">
                    <FileText size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-700">Documento Privado</span>
                    <span className="text-[9px] font-bold text-slate-400">Protegido por Modas GUOR</span>
                  </div>
                </div>
                
                {loadingUrl ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <a 
                    href={signedUrl || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2 bg-pink-50 hover:bg-pink-100 rounded-lg text-pink-600 transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
              
              <p className="text-[9px] text-center text-slate-400 font-medium px-4">
                El acceso a este archivo es temporal y expira en 60 minutos por seguridad.
              </p>
            </div>
          ) : (
            <div className="relative group">
              <input 
                type="file" 
                onChange={handleUpload} 
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center group-hover:border-pink-300 transition-all bg-slate-50">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Encriptando y subiendo...</p>
                  </div>
                ) : (
                  <>
                    <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-pink-400 transition-colors" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subir Ficha Técnica</p>
                    <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">Solo personal autorizado</p>
                  </>
                )}
              </div>
            </div>
          )}

          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full font-black text-slate-400 hover:text-pink-600 uppercase text-[10px] tracking-[0.2em]"
          >
            Cerrar Panel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}