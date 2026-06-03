'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { subirArchivoFichaTecnica, urlVerArchivoFicha } from '@/lib/helpers/ficha-tecnica-upload.client';
import {
  buildDescripcionDetallada,
  parseDescripcionDetallada,
} from '@/lib/helpers/ficha-tecnica-descripcion.helper';

export interface FichaTecnicaData {
  id: string;
  version: string | null;
  descripcion_detallada: string | null;
  ficha_url: string | null;
  imagen_geometral: string | null;
  estado: string | null;
}

interface Props {
  pedidoId: string;
  productoId: string;
  productoNombre: string;
  fichaInicial: FichaTecnicaData | null;
  pedidoBloqueado: boolean;
}

const ESTADOS_EDITABLES = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_revision', label: 'En revisión' },
] as const;

export function FichaTecnicaDisenadorForm({
  pedidoId,
  productoId,
  productoNombre,
  fichaInicial,
  pedidoBloqueado,
}: Props) {
  const router = useRouter();
  const [fichaId, setFichaId] = useState<string | null>(fichaInicial?.id ?? null);
  const [version, setVersion] = useState(fichaInicial?.version ?? '1.0');
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState(fichaInicial?.estado ?? 'borrador');
  const [fichaUrl, setFichaUrl] = useState(fichaInicial?.ficha_url ?? '');
  const [imagenGeometral, setImagenGeometral] = useState(
    fichaInicial?.imagen_geometral ?? '',
  );
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [aprobando, setAprobando] = useState(false);
  const [subiendoPdf, setSubiendoPdf] = useState(false);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [subiendoEv, setSubiendoEv] = useState(false);

  const itemAprobado = estado === 'aprobada';
  /** Solo lectura cuando todo el pedido está aprobado (en producción). */
  const bloqueado = pedidoBloqueado;

  useEffect(() => {
    const parsed = parseDescripcionDetallada(fichaInicial?.descripcion_detallada);
    setTexto(parsed.texto);
    setEvidencias(parsed.evidencias);
    setEstado(fichaInicial?.estado ?? 'borrador');
    setFichaId(fichaInicial?.id ?? null);
    setVersion(fichaInicial?.version ?? '1.0');
    setFichaUrl(fichaInicial?.ficha_url ?? '');
    setImagenGeometral(fichaInicial?.imagen_geometral ?? '');
  }, [fichaInicial]);

  const estadoEditable =
    ESTADOS_EDITABLES.find((e) => e.value === estado)?.value ?? 'borrador';

  const valorSelectEstado =
    itemAprobado && !['borrador', 'en_revision'].includes(estado)
      ? 'aprobada'
      : estadoEditable;

  const handleSubirPdf = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Solo se permiten archivos PDF');
      return;
    }
    setSubiendoPdf(true);
    try {
      const url = await subirArchivoFichaTecnica({
        file,
        productoId,
        tipo: 'pdf',
      });
      setFichaUrl(url);
      toast.success('PDF subido correctamente');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al subir PDF');
    } finally {
      setSubiendoPdf(false);
    }
  };

  const handleSubirImagen = async (file: File, esEvidencia = false) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo imágenes JPG o PNG');
      return;
    }
    const setter = esEvidencia ? setSubiendoEv : setSubiendoImg;
    setter(true);
    try {
      const url = await subirArchivoFichaTecnica({
        file,
        productoId,
        tipo: esEvidencia ? 'evidencia' : 'geometral',
      });
      if (esEvidencia) {
        setEvidencias((prev) => [...prev, url]);
      } else {
        setImagenGeometral(url);
      }
      toast.success('Imagen subida');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setter(false);
    }
  };

  const guardar = async () => {
    if (bloqueado) return;

    setGuardando(true);
    try {
      const descripcion_detallada = buildDescripcionDetallada(texto, evidencias);
      const payload = {
        version: version.trim() || '1.0',
        descripcion_detallada,
        ficha_url: fichaUrl || null,
        imagen_geometral: imagenGeometral || null,
        estado:
          valorSelectEstado === 'aprobada' ? 'aprobada' : (valorSelectEstado as 'borrador' | 'en_revision'),
        pedido_id: pedidoId,
      };

      let res: Response;
      if (fichaId) {
        res = await fetch(`/api/fichas-tecnicas/${fichaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/fichas-tecnicas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_producto: productoId,
            version: payload.version,
            descripcion_detallada: payload.descripcion_detallada,
            ficha_url: payload.ficha_url,
            imagen_geometral: payload.imagen_geometral,
            estado: payload.estado,
            pedido_id: pedidoId,
          }),
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? 'No se pudo guardar la ficha');
      }

      if (!fichaId && json.data?.id) {
        setFichaId(String(json.data.id));
      }

      toast.success('Ficha técnica guardada');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const aprobarItem = async () => {
    if (!fichaId) {
      toast.error('Guarde la ficha antes de aprobar');
      return;
    }

    setAprobando(true);
    try {
      const res = await fetch(`/api/fichas-tecnicas/${fichaId}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido_id: pedidoId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? 'No se pudo aprobar');
      }

      setEstado('aprobada');

      if (json.data?.pedido_en_produccion) {
        toast.success(
          'Ítem aprobado. Todas las fichas listas — pedido en producción.',
        );
      } else {
        const prog = json.data?.progreso;
        const msg = prog
          ? `Ítem aprobado (${prog.aprobadas}/${prog.total} fichas del pedido).`
          : 'Ítem aprobado.';
        toast.success(msg);
      }
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al aprobar');
    } finally {
      setAprobando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 space-y-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-violet-50 pb-3">
        <FileText className="w-5 h-5 text-violet-600" />
        <div>
          <p className="text-sm font-black text-stone-900">{productoNombre}</p>
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
            Ficha técnica · Producto #{productoId}
          </p>
        </div>
      </div>

      {fichaId && (
        <p className="text-xs text-stone-500">
          Ficha #{fichaId}
          {itemAprobado && !pedidoBloqueado && (
            <span className="ml-2 text-emerald-700 font-bold">
              (Aprobada — editable hasta completar todo el pedido)
            </span>
          )}
          {pedidoBloqueado && (
            <span className="ml-2 text-stone-600 font-bold">(Solo lectura)</span>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-stone-500">Versión</Label>
          <Input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            disabled={bloqueado}
            className="text-stone-900"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-stone-500">Estado</Label>
          <select
            value={valorSelectEstado}
            onChange={(e) => setEstado(e.target.value)}
            disabled={bloqueado}
            className="w-full h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 disabled:opacity-60"
          >
            {itemAprobado && (
              <option value="aprobada">Aprobada</option>
            )}
            {ESTADOS_EDITABLES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-stone-500">
          Descripción detallada
        </Label>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={bloqueado}
          rows={4}
          className="text-stone-900"
          placeholder="Instrucciones de confección, acabados, observaciones…"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-bold uppercase text-stone-500">Ficha PDF</Label>
            {fichaUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-black uppercase tracking-widest"
                onClick={() => {
                  const url = urlVerArchivoFicha(fichaUrl);
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Ver PDF
              </Button>
            )}
          </div>

          {!bloqueado && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl p-3 cursor-pointer hover:border-violet-400 transition-colors">
              {subiendoPdf ? (
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-stone-400 mb-1" />
                  <span className="text-[10px] text-stone-500 font-bold uppercase">
                    Subir PDF
                  </span>
                </>
              )}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={bloqueado || subiendoPdf}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleSubirPdf(f);
                }}
              />
            </label>
          )}

          {fichaUrl ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shadow-inner">
              <iframe
                title={`Ficha PDF — ${productoNombre}`}
                src={urlVerArchivoFicha(fichaUrl) ?? undefined}
                className="w-full h-[320px] bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center min-h-[200px]">
              <FileText className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs text-stone-500 font-medium">Sin PDF cargado</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-bold uppercase text-stone-500">
              Imagen geométrica / firma
            </Label>
            {imagenGeometral && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-black uppercase tracking-widest"
                onClick={() => {
                  const url = urlVerArchivoFicha(imagenGeometral);
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Ver Firma
              </Button>
            )}
          </div>

          {!bloqueado && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl p-3 cursor-pointer hover:border-violet-400 transition-colors">
              {subiendoImg ? (
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5 text-stone-400 mb-1" />
                  <span className="text-[10px] text-stone-500 font-bold uppercase">
                    JPG / PNG
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={bloqueado || subiendoImg}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleSubirImagen(f, false);
                }}
              />
            </label>
          )}

          {imagenGeometral ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shadow-inner flex items-center justify-center min-h-[320px] p-2">
              <img
                src={urlVerArchivoFicha(imagenGeometral) ?? imagenGeometral}
                alt="Imagen geométrica"
                className="max-h-[300px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center min-h-[200px]">
              <ImagePlus className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs text-stone-500 font-medium">Sin imagen cargada</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-stone-500">
          Evidencias adicionales (imágenes)
        </Label>
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 text-xs font-bold uppercase cursor-pointer hover:bg-stone-50">
          {subiendoEv ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          Agregar evidencia
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={bloqueado || subiendoEv}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleSubirImagen(f, true);
            }}
          />
        </label>
        {evidencias.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {evidencias.map((url) => (
              <a
                key={url}
                href={urlVerArchivoFicha(url) ?? url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-20 h-20 rounded-lg overflow-hidden border border-stone-200"
              >
                <img
                  src={urlVerArchivoFicha(url) ?? url}
                  alt="Evidencia"
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {!bloqueado && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={guardar}
            disabled={guardando || aprobando}
            variant="outline"
            className="font-black uppercase text-[10px] tracking-widest"
          >
            {guardando && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            {fichaId ? 'Guardar borrador' : 'Crear ficha técnica'}
          </Button>

          {fichaId && !itemAprobado && (
            <Button
              type="button"
              onClick={aprobarItem}
              disabled={aprobando || guardando}
              className="font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700"
            >
              {aprobando ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              Aprobar ítem
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
