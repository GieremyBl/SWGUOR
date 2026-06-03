'use client';

import { useState } from 'react';
import { Plus, Edit, Loader2, Package, Power, PowerOff, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface Zona {
    id: number;
    almacen_id: number;
    nombre: string;
    descripcion?: string | null;
    activo: boolean;
    created_at: string;
    _count?: { stock: number };
}

interface AlmacenZonasTabProps {
    almacenId: number;
    zonas: Zona[];
    onRefresh: () => void;
}

interface ZonaFormData {
    nombre: string;
    descripcion: string;
    activo: boolean;
}

const EMPTY_FORM: ZonaFormData = { nombre: '', descripcion: '', activo: true };

function ZonaFormInline({
    initial,
    onSave,
    onCancel,
    isSaving,
}: {
    initial: ZonaFormData;
    onSave: (data: ZonaFormData) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [form, setForm] = useState(initial);

    const sugerenciasTextiles = [
        { nom: 'Producto Terminado', desc: 'Prendas listas para entrega y despacho' },
        { nom: 'Materia Prima', desc: 'Rollos de tela, hilos, cierres y avíos' },
        { nom: 'Control de Calidad', desc: 'Prendas recibidas del taller externo en auditoría' },
        { nom: 'Segundas / Defectuosos', desc: 'Merma o prendas mal confeccionadas' }
    ];

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Input
                    autoFocus
                    placeholder="Nombre de la zona (ej: Producto Terminado, Telas...)"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="h-10 rounded-xl border-slate-200 focus-visible:ring-pink-500 flex-1"
                    disabled={isSaving}
                />

                <div className="flex items-center gap-2 bg-white px-3 h-10 border border-slate-200 rounded-xl self-end sm:self-auto">
                    <Switch
                        id="zona-activo"
                        checked={form.activo}
                        onCheckedChange={checked => setForm(f => ({ ...f, activo: checked }))}
                        disabled={isSaving}
                    />
                    <Label htmlFor="zona-activo" className={cn(
                        "text-xs font-bold transition-colors select-none",
                        form.activo ? "text-emerald-600" : "text-slate-400"
                    )}>
                        {form.activo ? 'Operativa' : 'Inactiva'}
                    </Label>
                </div>
            </div>

            {!form.nombre && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                    {sugerenciasTextiles.map((sug) => (
                        <button
                            key={sug.nom}
                            type="button"
                            onClick={() => setForm({ nombre: sug.nom, descripcion: sug.desc, activo: form.activo })}
                            className="text-xs bg-white text-slate-600 hover:text-pink-600 border border-slate-200 hover:border-pink-300 px-2.5 py-1 rounded-lg transition-all"
                        >
                            + {sug.nom}
                        </button>
                    ))}
                </div>
            )}

            <Textarea
                placeholder="Descripción opcional de la zona o ubicación física..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2}
                className="resize-none rounded-xl border-slate-200 focus-visible:ring-pink-500"
                disabled={isSaving}
            />

            <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving} className="rounded-xl">
                    Cancelar
                </Button>
                <Button
                    size="sm"
                    onClick={() => form.nombre.trim() && onSave(form)}
                    disabled={isSaving || !form.nombre.trim()}
                    className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white"
                >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                    Guardar
                </Button>
            </div>
        </div>
    );
}

export function AlmacenZonasTab({ almacenId, zonas = [], onRefresh }: AlmacenZonasTabProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [archivingId, setArchivingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = async (data: ZonaFormData) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/almacenes/${almacenId}/zonas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error();
            toast.success('Zona creada correctamente');
            setShowCreate(false);
            onRefresh();
        } catch {
            toast.error('Error al crear la zona');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (zonaId: number, data: ZonaFormData) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/almacenes/${almacenId}/zonas/${zonaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error();
            toast.success('Zona actualizada');
            setEditingId(null);
            onRefresh();
        } catch {
            toast.error('Error al actualizar la zona');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Cambio manual de estado (Activar / Desactivar) ──
    const handleToggleEstado = async (zona: Zona) => {
        try {
            const res = await fetch(`/api/admin/almacenes/${almacenId}/zonas/${zona.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: zona.nombre,
                    descripcion: zona.descripcion ?? '',
                    activo: !zona.activo
                }),
            });
            if (!res.ok) throw new Error();
            toast.success(`Zona marcada como ${!zona.activo ? 'Operativa' : 'Inactiva'}`);
            onRefresh();
        } catch {
            toast.error('Error al cambiar el estado de la zona');
        }
    };

    // ── 💡 BORRADO LÓGICO SEGURO (Sustituye al handleDelete físico) ──
    const handleBorradoLogico = async (zona: Zona) => {
        if (!zona.activo) {
            toast.info(`La zona "${zona.nombre}" ya se encuentra desactivada e inactiva.`);
            return;
        }

        setArchivingId(zona.id);
        try {
            const res = await fetch(`/api/admin/almacenes/${almacenId}/zonas/${zona.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: zona.nombre,
                    descripcion: zona.descripcion ?? '',
                    activo: false // Desactivación lógica forzada
                }),
            });
            if (!res.ok) throw new Error();
            toast.success(`Zona "${zona.nombre}" desactivada y archivada con éxito`);
            onRefresh();
        } catch {
            toast.error('Error al archivar la zona');
        } finally {
            setArchivingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {zonas.length} {zonas.length === 1 ? 'zona registrada' : 'zonas registradas'}
                </p>
                {!showCreate && (
                    <Button
                        size="sm"
                        onClick={() => setShowCreate(true)}
                        className="rounded-xl h-9 bg-pink-600 hover:bg-pink-700 text-white gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Nueva zona
                    </Button>
                )}
            </div>

            {/* Create form */}
            {showCreate && (
                <ZonaFormInline
                    initial={EMPTY_FORM}
                    onSave={handleCreate}
                    onCancel={() => setShowCreate(false)}
                    isSaving={isSaving}
                />
            )}

            {/* Zona list */}
            {zonas.length === 0 && !showCreate ? (
                <div className="text-center py-16 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No hay zonas registradas</p>
                    <p className="text-xs mt-1">Crea una zona para organizar el stock</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {zonas.map(zona => (
                        <div key={zona.id} className={cn(
                            "bg-white border rounded-2xl shadow-sm overflow-hidden transition-all",
                            zona.activo ? "border-gray-100" : "border-slate-200 bg-slate-50/50 opacity-75"
                        )}>
                            {editingId === zona.id ? (
                                <div className="p-4">
                                    <ZonaFormInline
                                        initial={{
                                            nombre: zona.nombre,
                                            descripcion: zona.descripcion ?? '',
                                            activo: zona.activo
                                        }}
                                        onSave={data => handleUpdate(zona.id, data)}
                                        onCancel={() => setEditingId(null)}
                                        isSaving={isSaving}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 px-5 py-4">
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs",
                                        zona.activo ? "bg-slate-100 text-slate-500" : "bg-slate-200 text-slate-400"
                                    )}>
                                        {zona.nombre.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={cn(
                                                "font-bold text-sm truncate",
                                                zona.activo ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"
                                            )}>
                                                {zona.nombre}
                                            </p>
                                            <span className={cn(
                                                "text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-full border",
                                                zona.activo
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            )}>
                                                {zona.activo ? 'Operativa' : 'Inactiva'}
                                            </span>
                                        </div>
                                        {zona.descripcion && (
                                            <p className="text-xs text-slate-400 truncate max-w-[350px]">{zona.descripcion}</p>
                                        )}
                                    </div>

                                    {/* Conteo de stock */}
                                    {typeof zona._count?.stock === 'number' && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                                            <Package className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">{zona._count.stock}</span>
                                        </div>
                                    )}

                                    {/* Barra de acciones modificada para evitar el borrado físico */}
                                    <div className="flex gap-1 flex-shrink-0">
                                        {/* Alternar Estado Manual */}
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => handleToggleEstado(zona)}
                                            className={cn(
                                                "rounded-xl h-8 w-8 p-0 transition-all active:scale-95",
                                                zona.activo
                                                    ? "hover:bg-amber-50 hover:text-amber-600"
                                                    : "hover:bg-emerald-50 hover:text-emerald-600"
                                            )}
                                            title={zona.activo ? "Desactivar de forma lógica" : "Volver a activar"}
                                        >
                                            {zona.activo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                                        </Button>

                                        {/* Editar Datos */}
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => setEditingId(zona.id)}
                                            className="rounded-xl h-8 w-8 p-0 hover:bg-pink-50 hover:text-pink-600 transition-all active:scale-95"
                                            title="Editar zona"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>

                                        {/* ── 💡 BOTÓN DE BORRADO LÓGICO (ARCHIVAR) EN LUGAR DE TRASH ── */}
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => handleBorradoLogico(zona)}
                                            disabled={archivingId === zona.id || !zona.activo}
                                            className={cn(
                                                "rounded-xl h-8 w-8 p-0 transition-all active:scale-95",
                                                zona.activo
                                                    ? "hover:bg-rose-50 hover:text-rose-600 text-slate-400"
                                                    : "text-slate-300 cursor-not-allowed bg-slate-100/50"
                                            )}
                                            title={zona.activo ? "Desactivar/Archivar zona" : "Zona ya inactivada"}
                                        >
                                            {archivingId === zona.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Archive className="w-3.5 h-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}