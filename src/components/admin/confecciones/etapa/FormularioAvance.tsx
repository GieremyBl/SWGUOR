// src/components/admin/confecciones/etapa/FormularioAvance.tsx
"use client";

import React, { useState, useRef } from "react";
import { AlertTriangle, MessageSquare, X, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import { subirEvidenciasConfeccion } from "@/lib/helpers/confeccion-upload.client";

interface FormularioAvanceProps {
    isOpen: boolean;
    onClose: () => void;
    etapaAnteriorLabel: string;
    etapaNuevaLabel: string;
    confeccionId: string;
    onConfirmar: (notas: string) => Promise<void>;
}

export default function FormularioAvance({
    isOpen,
    onClose,
    etapaAnteriorLabel,
    etapaNuevaLabel,
    confeccionId,
    onConfirmar,
}: FormularioAvanceProps) {
    const [notas, setNotas] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [imagenes, setImagenes] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            if (imagenes.length + filesArray.length > 5) {
                alert("Solo puedes subir un máximo de 5 imágenes de evidencia.");
                return;
            }
            setImagenes((prev) => [...prev, ...filesArray]);
        }
    };

    const removerImagen = (index: number) => {
        setImagenes((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCerrarAbsoluto = () => {
        setNotas("");
        setImagenes([]);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        try {
            let notasFinales = notas;

            // Subida de archivos adjuntos a Supabase si existen
            if (imagenes.length > 0) {
                const urls = await subirEvidenciasConfeccion(confeccionId, imagenes);
                if (urls && urls.length > 0) {
                    const evidenciasJson = JSON.stringify(urls);
                    notasFinales = `${notas}\n[EVIDENCIAS] ${evidenciasJson}`;
                }
            }

            await onConfirmar(notasFinales);
            setNotas("");
            setImagenes([]);
        } catch (error) {
            console.error("Error en flujo de avance de página:", error);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="w-full rounded-2xl border border-[var(--guor-cream)] bg-white p-6 shadow-sm mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Cabecera del Bloque */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
                        <MessageSquare size={14} />
                    </div>
                    <h3 className="text-sm font-black text-[var(--guor-dark)] tracking-tight uppercase">
                        Completar Reporte de Transición Física
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={handleCerrarAbsoluto}
                    className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                >
                    <X size={15} />
                </button>
            </div>

            {/* Banner Informativo de Cambio de Fase */}
            <div className="mb-5 flex gap-3 rounded-xl bg-amber-50/60 border border-amber-100 p-3 text-xs text-amber-800">
                <AlertTriangle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                <div>
                    <span className="font-bold">Cambio de Fase Detectado:</span> El lote pasará de la fase de <span className="font-bold underline">{etapaAnteriorLabel}</span> hacia <span className="font-bold underline">{etapaNuevaLabel}</span>. Por favor adjunte evidencias visuales para la bitácora técnica de GUOR.
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Zona de Carga de Imágenes */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                        Evidencias Fotográficas de Lote ({imagenes.length}/5)
                    </label>

                    <div
                        onClick={() => !enviando && fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-pink-300 rounded-xl p-5 bg-slate-50/50 hover:bg-white text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                    >
                        <ImageIcon size={20} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                        <span className="text-xs font-bold text-slate-600">Presiona para adjuntar fotos</span>
                        <span className="text-[10px] text-slate-400 font-medium">Formatos permitidos: PNG, JPG, WEBP (Máx. 5)</span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            accept="image/*"
                            className="hidden"
                            disabled={enviando}
                        />
                    </div>

                    {/* Previsualización en miniaturas */}
                    {imagenes.length > 0 && (
                        <div className="grid grid-cols-5 gap-3 pt-2">
                            {imagenes.map((file, idx) => {
                                const urlTemp = URL.createObjectURL(file);
                                return (
                                    <div key={idx} className="group relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
                                        <img src={urlTemp} alt="preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removerImagen(idx)}
                                            disabled={enviando}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl disabled:opacity-50"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Comentarios */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                        Notas Técnicas / Observaciones del Avance
                    </label>
                    <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Escribe detalles relevantes sobre el estado del lote, materiales o retrasos en el taller..."
                        required
                        rows={3}
                        disabled={enviando}
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/5 transition-all resize-none disabled:opacity-60"
                    />
                </div>

                {/* Acciones de Guardado */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-50">
                    <button
                        type="button"
                        onClick={handleCerrarAbsoluto}
                        disabled={enviando}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={enviando}
                        className="rounded-xl bg-[hsl(var(--admin-accent))] px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[hsl(var(--admin-accent)/0.2)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {enviando && <Loader2 size={12} className="animate-spin" />}
                        {enviando ? "Guardando..." : "Registrar Etapa"}
                    </button>
                </div>
            </form>
        </div>
    );
}