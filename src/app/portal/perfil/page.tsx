'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Building2, FileText, MapPin, ShieldCheck, Download, PencilLine, Save, Loader2 } from 'lucide-react';
import { usePortal } from '@/lib/hooks/usePortal';

type ReverseGeocodeData = {
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
  display_name?: string;
};

function construirDireccionDesdeUbicacion(data: ReverseGeocodeData | undefined, lat: number, lon: number) {
  const address = data?.address ?? {};
  const partes = [
    [address.road, address.house_number].filter(Boolean).join(' '),
    address.suburb || address.neighbourhood || address.quarter,
    address.city || address.town || address.village || address.municipality,
    address.state,
    address.country,
  ].filter((valor) => typeof valor === 'string' && valor.trim().length > 0);

  if (partes.length > 0) {
    return partes.join(', ');
  }

  return data?.display_name || `Latitud ${lat.toFixed(5)}, longitud ${lon.toFixed(5)}`;
}

export default function PerfilPage() {
  const { cliente, actualizarCliente } = usePortal();
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [form, setForm] = useState(() => ({
    nombre_comercial: cliente?.nombre_comercial ?? '',
    direccion_fiscal: cliente?.direccion_fiscal ?? '',
  }));

  type PerfilApiResponse = {
    success?: boolean;
    error?: string;
    data?: {
      nombre_comercial?: string;
      direccion_fiscal?: string;
    };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!cliente) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/portal/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_comercial: form.nombre_comercial.trim(),
          direccion_fiscal: form.direccion_fiscal.trim(),
        }),
      });

      const body = (await response.json().catch(() => ({}))) as PerfilApiResponse;
      if (!response.ok) {
        throw new Error(body?.error ?? 'No se pudo actualizar el perfil');
      }

      actualizarCliente({
        nombre_comercial: body?.data?.nombre_comercial ?? form.nombre_comercial.trim(),
        direccion_fiscal: body?.data?.direccion_fiscal ?? form.direccion_fiscal.trim(),
      });

      toast.success('Perfil actualizado correctamente');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsarUbicacionActual = async () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta ubicación');
      return;
    }

    setIsLocating(true);
    try {
      const posicion = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const lat = posicion.coords.latitude;
      const lon = posicion.coords.longitude;
      const response = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lon}`, { cache: 'no-store' });
      const body = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string; data?: ReverseGeocodeData };

      if (!response.ok || !body?.success) {
        throw new Error(body?.error ?? 'No se pudo resolver la dirección');
      }

      const data = body.data;
      const direccion = construirDireccionDesdeUbicacion(data, lat, lon);

      setForm((prev) => ({ ...prev, direccion_fiscal: direccion }));
      toast.success('Dirección completada con tu ubicación actual');
    } catch (error: unknown) {
      const geoError = error as { code?: number };

      if (geoError.code === 1) {
        toast.error('Necesitamos permiso para acceder a tu ubicación');
      } else if (geoError.code === 2) {
        toast.error('No pudimos obtener tu ubicación en este momento');
      } else if (geoError.code === 3) {
        toast.error('La ubicación tardó demasiado en responder');
      } else {
        toast.error('No se pudo obtener tu ubicación actual');
      }

      console.error('[Perfil] Error al obtener ubicación:', error);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Perfil Corporativo</h1>
        <p className="text-sm text-slate-500">Gestione el nombre comercial y la dirección del cliente. RUC y razón social permanecen bloqueados.</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-slate-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Información del perfil</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <ShieldCheck size={12} /> Razón social y RUC bloqueados
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Razón Social</label>
                  <input
                    value={cliente?.razon_social || 'Cargando...'}
                    disabled
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RUC</label>
                  <input
                    value={cliente?.ruc ? String(cliente.ruc) : '—'}
                    disabled
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del perfil</label>
                  <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-slate-400 transition-colors">
                    <PencilLine size={14} className="text-slate-400 shrink-0" />
                    <input
                      value={form.nombre_comercial || cliente?.nombre_comercial || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, nombre_comercial: e.target.value }))}
                      placeholder="Nombre visible del cliente"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none"
                      maxLength={255}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección del cliente</label>
                    <button
                      type="button"
                      onClick={handleUsarUbicacionActual}
                      disabled={isSaving || isLocating}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                      {isLocating ? 'Buscando ubicación...' : 'Usar mi ubicación actual'}
                    </button>
                  </div>
                  <div className="mt-1 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-slate-400 transition-colors">
                    <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <textarea
                      value={form.direccion_fiscal || cliente?.direccion_fiscal || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, direccion_fiscal: e.target.value }))}
                      placeholder="Pulsa 'Usar mi ubicación actual' o escribe tu dirección actual"
                      className="min-h-[90px] w-full resize-none bg-transparent text-sm text-slate-900 outline-none"
                      maxLength={255}
                      disabled={isSaving}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Si aceptas el permiso del navegador, la dirección se completará automáticamente con tu ubicación actual.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={14} />
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Documentos Legales */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-slate-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Documentos del Cliente</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {['Contrato Marco B2B 2024', 'Ficha RUC Actualizada', 'Certificado de Calidad GUOR'].map((doc) => (
              <div key={doc} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium text-slate-700">{doc}</span>
                <button className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                  <Download size={14} /> PDF
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}