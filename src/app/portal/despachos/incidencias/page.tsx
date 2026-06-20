'use client';

import { useCallback, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  Clock,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ESTADO_INCIDENCIA_LABELS,
  ESTADO_INCIDENCIA_STYLES,
  TIPO_INCIDENCIA_CLIENTE_LABELS,
} from '@/lib/constants/incidencias-cliente';
import { useIncidenciasClientePortal } from '@/lib/hooks/useIncidenciasCliente';
import { uploadEvidencia } from '@/lib/services/despachos.service';
import type { TipoIncidenciaCliente } from '@prisma/client';
import type { CrearIncidenciaClienteInput } from '@/lib/schemas/incidencias-cliente';

const TIPOS = Object.entries(TIPO_INCIDENCIA_CLIENTE_LABELS) as [TipoIncidenciaCliente, string][];

export default function ReportarIncidenciaPage() {
  const searchParams = useSearchParams();
  const pedidoParam = searchParams.get('pedido_id') ?? searchParams.get('pedido') ?? '';

  const { incidencias, isLoading, crear, isCreating, refetch } = useIncidenciasClientePortal();

  const [pedidoId, setPedidoId] = useState(pedidoParam);
  const [tipo, setTipo] = useState<TipoIncidenciaCliente>('defecto_confeccion');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La evidencia no debe superar 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFoto(file);
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const resetForm = () => {
    setDescripcion('');
    setFoto(null);
    setFotoPreview(null);
    setTipo('defecto_confeccion');
    setSuccess(false);
    setError('');
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      const pedidoNum = Number(pedidoId);
      if (!pedidoId || Number.isNaN(pedidoNum) || pedidoNum <= 0) {
        setError('Ingresa un número de pedido válido.');
        return;
      }
      if (descripcion.trim().length < 10) {
        setError('Describe el problema con al menos 10 caracteres.');
        return;
      }

      try {
        const evidencia_url: string[] = [];
        if (foto) {
          const url = await uploadEvidencia(pedidoNum, foto);
          evidencia_url.push(url);
        }

        const payload: CrearIncidenciaClienteInput = {
          pedido_id: pedidoNum,
          tipo,
          descripcion: descripcion.trim(),
          evidencia_url,
        };

        await crear(payload);
        setSuccess(true);
        await refetch();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'No se pudo registrar la incidencia.');
      }
    },
    [pedidoId, descripcion, foto, tipo, crear, refetch],
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Link
                href="/portal/despachos"
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-slate-500" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Incidencias de Despacho</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reporta problemas y consulta el historial de tus casos
                </p>
              </div>
            </div>
            <Link href="/portal/despachos" className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </Link>
          </div>

          {success ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="font-bold text-slate-800">Incidencia enviada con éxito</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Nuestro equipo de soporte revisará tu reporte y podrás ver las actualizaciones en el
                historial.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
              >
                Registrar otra incidencia
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <label className="block text-xs font-bold text-blue-700 uppercase mb-2">
                  Pedido relacionado
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pedidoId}
                  onChange={(e) => setPedidoId(e.target.value)}
                  placeholder="Ej. 1042"
                  className="w-full p-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tipo de incidencia <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoIncidenciaCliente)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {TIPOS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Descripción del problema <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe detalladamente el problema que experimentaste..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Adjuntar evidencia (opcional)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFoto}
                  className="hidden"
                />
                {fotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border aspect-video bg-slate-50">
                    <Image src={fotoPreview} alt="Vista previa" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => {
                        setFoto(null);
                        setFotoPreview(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <Upload className="text-slate-400 mb-2" size={32} />
                    <p className="text-sm text-slate-600 font-medium">Haz clic para subir imagen o PDF</p>
                    <p className="text-xs text-slate-400 mt-1">Máx. 5 MB</p>
                  </button>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Link
                  href="/portal/despachos"
                  className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-center transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar reporte'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-800">Historial de incidencias</h2>
          </div>
          <div className="p-6">
            {isLoading ? (
              <p className="text-sm text-slate-500 text-center py-8">Cargando historial...</p>
            ) : incidencias.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                Aún no has registrado incidencias.
              </p>
            ) : (
              <ul className="space-y-4">
                {incidencias.map((item) => {
                  const estadoKey = (item.estado ?? 'abierta') as keyof typeof ESTADO_INCIDENCIA_LABELS;
                  return (
                    <li
                      key={String(item.id)}
                      className="border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-500">
                          #{item.id} · Pedido #{item.pedido_id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ESTADO_INCIDENCIA_STYLES[estadoKey] ?? ''}`}
                        >
                          {ESTADO_INCIDENCIA_LABELS[estadoKey] ?? item.estado}
                        </span>
                      </div>
                      {item.tipo && (
                        <p className="text-sm font-semibold text-slate-800 mb-1">
                          {TIPO_INCIDENCIA_CLIENTE_LABELS[item.tipo as TipoIncidenciaCliente]}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4">
                        {item.descripcion}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString('es-PE')
                          : '—'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
