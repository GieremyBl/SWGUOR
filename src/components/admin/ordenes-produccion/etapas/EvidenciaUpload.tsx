"use client";

import { useState, useRef } from "react";
import { X, Check, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";

interface EvidenciaUploadProps {
    onUpload: (url: string, fileName: string) => void;
    required?: boolean;
    label?: string;
    disabled?: boolean;
    ordenId?: string | number;
    confeccionId?: string | number;
    etapa?: string;
    bucketTarget?: "evidencias-ordenes-produccion" | "evidencias-confeccion";
}

export function EvidenciaUpload({
    onUpload,
    required = true,
    label = "Cargar Evidencia (Foto/Documento)",
    disabled = false,
    ordenId,
    confeccionId,
    etapa = "general",
    bucketTarget = "evidencias-ordenes-produccion",
}: EvidenciaUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    const handleFileSelect = async (file: File) => {
        setError(null);

        // Validaciones
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Solo JPG, PNG, WebP y PDF están permitidos");
            return;
        }
        if (file.size > MAX_SIZE) {
            setError("El archivo excede 10 MB");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("bucketTarget", bucketTarget);

            // Inyectamos las variables dinámicas de ruta según el tipo de bucket seleccionado
            if (bucketTarget === "evidencias-confeccion" && confeccionId) {
                formData.append("confeccionId", String(confeccionId));
            } else if (ordenId) {
                formData.append("ordenId", String(ordenId));
                formData.append("etapa", etapa.toLowerCase());
            }

            const res = await fetch("/api/upload/evidencia", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al subir archivo");
            }

            const data = await res.json();
            setUploadedFile({ name: file.name, url: data.url });
            onUpload(data.url, file.name);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {uploadedFile ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-emerald-900 truncate">{uploadedFile.name}</p>
                            <p className="text-[10px] text-emerald-600">Cargado correctamente</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setUploadedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-emerald-600 hover:text-emerald-800 shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleChange}
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        className="hidden"
                        disabled={disabled || loading}
                    />

                    {loading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            <p className="text-xs text-gray-600 font-medium">Subiendo...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                            <div>
                                <p className="text-xs font-bold text-gray-700">Arrastra o haz clic</p>
                                <p className="text-[10px] text-gray-500">JPG, PNG, WebP o PDF (máx. 10 MB)</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}