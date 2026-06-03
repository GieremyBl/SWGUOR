"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { ImagePlus, X, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

const MAX_SIZE_MB = 2;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_LABEL = "JPG, PNG o WEBP";

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  message?: string;
}

export function ImageUploadSection() {
  const { setValue, watch } = useFormContext();
  const currentImage: string | null = watch("imagen");

  const [dragOver, setDragOver] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ status: "idle", progress: 0 });
  
  // Guardamos la referencia del intervalo para limpiarlo con seguridad
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limpieza del intervalo si el componente se desmonta inesperadamente
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUpload({ status: "error", progress: 0, message: `Formato no permitido. Usa ${ACCEPTED_LABEL}.` });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUpload({ status: "error", progress: 0, message: `El archivo supera el límite de ${MAX_SIZE_MB} MB.` });
      return;
    }

    setUpload({ status: "uploading", progress: 10 });

    try {
      const formData = new FormData();
      formData.append("file", file);

      intervalRef.current = setInterval(() => {
        setUpload((prev) =>
          prev.progress < 85
            ? { ...prev, progress: prev.progress + 15 }
            : prev
        );
      }, 200);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errData.message || "Error al subir la imagen");
      }

      const { url } = (await res.json()) as { url: string };
      setValue("imagen", url, { shouldDirty: true });
      setUpload({ status: "success", progress: 100 });
    } catch (err: unknown) {
      // Reemplazo del explicit 'any' por tipado seguro 'unknown'
      const errorMessage = err instanceof Error ? err.message : "Error inesperado al subir la imagen.";
      setUpload({ status: "error", progress: 0, message: errorMessage });
    } finally {
      // Garantiza que el intervalo se detenga tanto si la subida es exitosa como si falla
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [setValue]);

  const handleFile = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    uploadFile(files[0]);
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    const input = document.getElementById("imagen-file-input") as HTMLInputElement | null;
    if (input) {
      input.value = "";
      input.click();
    }
  }, []);

  const removeImage = useCallback(() => {
    setValue("imagen", null, { shouldDirty: true });
    setUpload({ status: "idle", progress: 0 });
  }, [setValue]);

  return (
    <div className="space-y-4">
      {/* Input oculto — siempre montado para la interacción del usuario */}
      <input
        id="imagen-file-input"
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />

      {currentImage ? (
        /* ── Vista previa de imagen ── */
        <div className="relative group w-full aspect-[4/3] max-h-64 rounded-xl overflow-hidden border border-guor-peach bg-guor-cream/60 shadow-sm">
          <Image
            src={currentImage}
            alt="Imagen del producto"
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
            <button
              type="button"
              onClick={removeImage}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 bg-guor-cream text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-red-100"
            >
              <X size={13} /> Eliminar imagen
            </button>
          </div>
          {upload.status === "success" && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
              <CheckCircle2 size={11} /> Subida
            </div>
          )}
        </div>
      ) : (
        /* ── Zona de arrastrar y soltar (Drag and Drop) ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            relative w-full aspect-[4/3] max-h-64 rounded-xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-3 transition-all duration-200 select-none
            ${dragOver
              ? "border-pink-400 bg-guor-peach/50 scale-[1.01]"
              : upload.status === "error"
                ? "border-red-300 bg-red-50"
                : "border-guor-peach bg-guor-cream/60 hover:border-guor-gold hover:bg-guor-peach/30"
            }
          `}
        >
          {upload.status === "uploading" ? (
            <div className="flex flex-col items-center gap-3 w-full px-10">
              <div className="w-10 h-10 rounded-full border-2 border-guor-gold/50 border-t-guor-brown animate-spin" />
              <div className="w-full bg-guor-peach rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <p className="text-xs text-guor-gold font-medium">
                Subiendo imagen… {upload.progress}%
              </p>
            </div>
          ) : upload.status === "error" ? (
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-red-600">{upload.message}</p>
              <p className="text-xs text-guor-gold/70">Haz clic para intentar de nuevo</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center px-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
                dragOver ? "bg-pink-100" : "bg-guor-peach/40"
              }`}>
                {dragOver ? (
                  <Upload size={22} className="text-guor-brown/70 animate-bounce" />
                ) : (
                  <ImagePlus size={22} className="text-guor-gold/70" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-guor-brown/70">
                  {dragOver ? "¡Suelta la imagen aquí!" : "Arrastra una imagen o haz clic"}
                </p>
                <p className="text-xs text-guor-gold/70 mt-0.5">
                  {ACCEPTED_LABEL} · Máx. {MAX_SIZE_MB} MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entrada alternativa por URL manual */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-guor-peach/40" />
        <span className="text-[10px] font-bold text-guor-gold/40 uppercase tracking-widest">
          o pega una URL
        </span>
        <div className="flex-1 h-px bg-guor-peach/40" />
      </div>

      <input
        type="url"
        placeholder="https://ejemplo.com/imagen.jpg"
        value={currentImage ?? ""}
        onChange={(e) => {
          setValue("imagen", e.target.value || null, { shouldDirty: true });
          if (upload.status !== "idle") setUpload({ status: "idle", progress: 0 });
        }}
        className="w-full h-9 rounded-lg border border-guor-peach bg-guor-cream/60 px-3 text-xs text-guor-dark/80 placeholder:text-guor-gold/40 focus:outline-none focus:ring-2 focus:ring-guor-gold/40 focus:border-guor-gold transition"
      />
    </div>
  );
}