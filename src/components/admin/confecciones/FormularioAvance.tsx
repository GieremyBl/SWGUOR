"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, MessageSquare, X } from "lucide-react";

interface FormularioAvanceProps {
    isOpen: boolean;
    onClose: () => void;
    etapaAnteriorLabel: string;
    etapaNuevaLabel: string;
    onConfirmar: (notas: string) => Promise<void>;
}

export default function FormularioAvance({
    isOpen,
    onClose,
    etapaAnteriorLabel,
    etapaNuevaLabel,
    onConfirmar,
}: FormularioAvanceProps) {
    const [notas, setNotas] = useState("");
    const [enviando, setEnviando] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        try {
            await onConfirmar(notas);
            setNotas(""); // Limpiar
            onClose();
        } catch (error) {
            console.error("Error al guardar el formulario:", error);
        } finally {
            setEnviando(false);
        }
    };

    const handleCerrarAbsoluto = () => {
        setNotas("");
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                {/* Fondo desenfocado */}
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity" />

                {/* Contenedor del Formulario */}
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[hsl(var(--admin-accent)/0.15)] bg-white p-6 shadow-xl focus:outline-none">

                    {/* Botón Cerrar */}
                    <Dialog.Close className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                        <X size={16} />
                    </Dialog.Close>

                    {/* Encabezado */}
                    <div className="mb-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--admin-accent))]">
                            Confirmar Movimiento
                        </p>
                        <Dialog.Title className="mt-1 text-xl font-black text-[var(--guor-dark)] tracking-tight">
                            Reportar Avance de Taller
                        </Dialog.Title>
                    </div>

                    {/* Alerta de cambio de flujo */}
                    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[hsl(var(--admin-accent)/0.05)] border border-[hsl(var(--admin-accent)/0.1)] p-3.5">
                        <div className="text-[hsl(var(--admin-accent))] shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div className="text-xs font-bold text-[var(--guor-dark)]">
                            Moviendo de <span className="underline decoration-indigo-300">{etapaAnteriorLabel}</span> hacia <span className="text-[hsl(var(--admin-accent))] font-black">{etapaNuevaLabel}</span>.
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--guor-dark)] mb-2">
                                <MessageSquare size={12} className="text-[hsl(var(--admin-accent))]" />
                                Notas de Confección / Incidencias
                            </label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Ej: Se completó el lote. 2 prendas se quedaron para corrección de costura o faltaron hilos..."
                                required
                                rows={4}
                                className="w-full rounded-2xl border border-[hsl(var(--admin-accent)/0.15)] bg-slate-50 p-3 text-xs font-medium text-[var(--guor-dark)] placeholder-slate-400 shadow-inner focus:border-[hsl(var(--admin-accent))] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[hsl(var(--admin-accent)/0.1)] transition-all"
                            />
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleCerrarAbsoluto}
                                disabled={enviando}
                                className="rounded-xl border border-[var(--guor-cream)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={enviando}
                                className="rounded-xl bg-[hsl(var(--admin-accent))] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[hsl(var(--admin-accent)/0.2)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {enviando ? "Guardando..." : "Registrar Etapa"}
                            </button>
                        </div>
                    </form>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}