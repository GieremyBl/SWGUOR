'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Upload, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { DespachoPortal } from '../_contexts/PortalContext';
import { useIncidencia } from '@/lib/hooks/useDespachos';
import Image from 'next/image';
import { TIPO_INCIDENCIA_CLIENTE_LABELS } from '@/lib/constants/incidencias-cliente';
import type { SeveridadIncidencia } from '@/lib/services/despachos.service';
import type { TipoIncidenciaCliente } from '@prisma/client';

interface ModalIncidenciaProps {
  despacho: DespachoPortal;
  onClose: () => void;
}

const SEVERIDAD_OPCIONES = {
  baja: {
    label: 'Baja',
    desc: 'Observación menor, no detiene la entrega.',
    color: '#64748B',
    bg: '#F8FAFC',
    border: '#E2E8F0'
  },
  media: {
    label: 'Media',
    desc: 'Requiere revisión o cambio parcial.',
    color: '#D4AF37',
    bg: '#FFFDF5',
    border: '#FDE047'
  },
  alta: {
    label: 'Crítica',
    desc: 'Impide la recepción conforme del lote.',
    color: '#E11D48',
    bg: '#FFF1F2',
    border: '#FECDD3'
  }
};

type SeveridadKey = keyof typeof SEVERIDAD_OPCIONES;

export default function ModalIncidencia({ despacho, onClose }: ModalIncidenciaProps) {
  const [tipo, setTipo] = useState<TipoIncidenciaCliente>('defecto_confeccion');
  const [severidad, setSeveridad] = useState<SeveridadKey>('media');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const { status, errorMsg, submit, reset } = useIncidencia();

  // Limpiar estado del hook al montar
  useEffect(() => {
    if (reset) reset();
  }, [reset]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('La foto no debe superar 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFoto(file);
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setLocalError('');
  }

  // CORRECCIÓN AQUÍ: Forzamos la aserción de tipo para sincronizarse con el Hook
  const handleSubmit = useCallback(async () => {
    if (!descripcion.trim()) {
      setLocalError('La descripción es obligatoria.');
      return;
    }
    setLocalError('');
    if (submit) {
      await submit(despacho.pedido_id, {
        tipo: tipo as TipoIncidenciaCliente,
        severidad: severidad as SeveridadIncidencia,
        descripcion,
        foto
      });
    }
  }, [descripcion, despacho.pedido_id, tipo, severidad, foto, submit]);

  const displayError = localError || errorMsg;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom duration-300">

        {/* ── Cabecera ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Reportar Incidencia</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Despacho <span className="font-bold text-[#B8962D]">#DG-{despacho.id}</span> · Pedido <span className="font-bold text-slate-700">#{despacho.pedido_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Incidencia registrada con éxito</h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                El reporte ha sido ingresado al sistema de auditoría. Nuestro equipo de logística B2B evaluará los detalles para contactarle a la brevedad.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs uppercase tracking-widest font-bold transition-all shadow-sm"
              >
                Entendido
              </button>
            </div>
          ) : (
            <>
              {/* Tipo */}
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo de incidencia <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoIncidenciaCliente)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#B8962D] focus:bg-white transition-colors pr-10 cursor-pointer"
                  >
                    {Object.entries(TIPO_INCIDENCIA_CLIENTE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Severidad */}
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nivel de Severidad <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {Object.entries(SEVERIDAD_OPCIONES).map(([value, cfg]) => {
                    const estaSeleccionado = severidad === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSeveridad(value as SeveridadKey)}
                        className="flex sm:flex-col items-center sm:items-start gap-2.5 p-3 rounded-xl border text-left transition-all shadow-2xl"
                        style={{
                          borderColor: estaSeleccionado ? cfg.border : '#E2E8F0',
                          background: estaSeleccionado ? cfg.bg : 'white',
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 sm:mb-1"
                          style={{ background: cfg.color }}
                        />
                        <div>
                          <p
                            className="text-xs font-bold tracking-tight"
                            style={{ color: estaSeleccionado ? cfg.color : '#334155' }}
                          >
                            {cfg.label}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 sm:block hidden">
                            {cfg.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Detalle del problema <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Por favor, especifique el percance: cantidad de prendas afectadas, códigos de empaque, o detalles del estado de entrega..."
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#B8962D] focus:bg-white transition-colors resize-none leading-relaxed"
                />
                <p className="text-[10px] font-bold text-slate-400 mt-1 text-right">
                  {descripcion.length} / 1000 caracteres
                </p>
              </div>

              {/* Foto */}
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Evidencia Fotográfica{' '}
                  <span className="text-slate-400 font-normal normal-case">
                    (Opcional · PNG, JPG hasta 5 MB)
                  </span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFoto}
                  className="hidden"
                />
                {fotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 shadow-inner">
                    <Image
                      src={fotoPreview}
                      alt="Vista previa de la evidencia adjuntada"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => { setFoto(null); setFotoPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-slate-900/90 flex items-center justify-center transition-colors shadow-sm"
                      aria-label="Remover foto adjunta"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-amber-300/60 hover:border-[#B8962D] bg-amber-50/20 hover:bg-amber-50/40 rounded-xl py-6 flex flex-col items-center justify-center gap-2 transition-all group shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 group-hover:border-amber-300 flex items-center justify-center transition-all shadow-3xs group-hover:scale-105">
                      <Upload className="w-4 h-4 text-[#B8962D]" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                      Haga clic para examinar archivos
                    </p>
                  </button>
                )}
              </div>

              {/* Caja de Errores */}
              {displayError && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-left">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose-700 leading-normal">{displayError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {status !== 'success' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-xs uppercase tracking-wider font-bold transition-colors shadow-2xs"
            >
              Cerrar
            </button>
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              type="button"
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-rose-600/10"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Procesando…
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Enviar Reporte
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}