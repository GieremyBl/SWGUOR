'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2, Package, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { subirFotoEmpaque } from '@/lib/helpers/despacho-upload.client';
import { DireccionDespachoPeruFields, esDireccionDespachoPeruValida } from '@/components/shared/DireccionDespachoPeruFields';

interface Props {
  pedidoId: string;
  direccionInicial: string;
}

export function PedidoEmpaqueForm({ pedidoId, direccionInicial }: Props) {
  const router = useRouter();
  const [direccion, setDireccion] = useState(direccionInicial);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [notas, setNotas] = useState('');
  const [fotos, setFotos] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const onSelectFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const nuevas = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFotos((prev) => [...prev, ...nuevas]);
    e.target.value = '';
  };

  const quitarFoto = (index: number) => {
    setFotos((prev) => {
      const copia = [...prev];
      URL.revokeObjectURL(copia[index].preview);
      copia.splice(index, 1);
      return copia;
    });
  };

  const handleSubmit = async () => {
    if (!esDireccionDespachoPeruValida(direccion)) {
      toast.error('Complete departamento, provincia, distrito y ubicación exacta');
      return;
    }
    if (!fechaEntrega) {
      toast.error('Seleccione la fecha estimada de entrega');
      return;
    }

    setLoading(true);
    setSubiendo(true);
    try {
      const urls: string[] = [];
      for (const f of fotos) {
        urls.push(await subirFotoEmpaque(pedidoId, f.file));
      }

      const res = await fetch(`/api/admin/pedidos/${pedidoId}/empaque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direccion_entrega: direccion,
          fecha_entrega_estimada: fechaEntrega,
          fotos: urls,
          notas,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al crear despacho');

      toast.success('Despacho creado correctamente');
      router.push(`/admin/Panel-Administrativo/pedidos/${pedidoId}/entrega`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar empaque');
    } finally {
      setLoading(false);
      setSubiendo(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/Panel-Administrativo/pedidos/${pedidoId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-700 transition-colors mb-4"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Volver al pedido
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20">
            <Package size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Empaque — Pedido #{pedidoId}
            </h1>
            <p className="text-sm text-stone-500 font-medium">Registre evidencias y cree el despacho</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-8">

        {/* Zona de Subida de Archivos */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={14} /> Evidencias Fotográficas
          </label>
          <label className="group flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-violet-500 hover:bg-violet-50/50 rounded-2xl py-10 cursor-pointer transition-all duration-200">
            <div className="bg-stone-100 group-hover:bg-violet-100 p-3 rounded-full mb-3 transition-colors duration-200">
              <Upload size={24} className="text-stone-500 group-hover:text-violet-600 transition-colors duration-200" />
            </div>
            <span className="text-sm font-bold text-stone-700 group-hover:text-violet-700">Haz clic para subir imágenes</span>
            <span className="text-xs text-stone-500 mt-1">Formatos soportados: JPG, PNG, WEBP</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onSelectFotos}
            />
          </label>

          {/* Grilla de Imágenes Previsualizadas */}
          {fotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {fotos.map((f, i) => (
                <div key={f.preview} className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 shadow-sm bg-stone-50">
                  <img
                    src={f.preview}
                    alt="Vista previa de empaque"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Overlay oscuro sutil al hacer hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                  <button
                    type="button"
                    onClick={() => quitarFoto(i)}
                    className="absolute top-2 right-2 bg-stone-900/60 hover:bg-red-500 text-white rounded-full p-1.5 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-95 group-hover:scale-100 shadow-sm"
                    title="Eliminar foto"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-stone-100" />

        {/* Campos del Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 md:col-span-2">
            <div>
              <label
                htmlFor="direccion"
                className="text-[11px] font-black text-stone-500 uppercase tracking-widest block mb-2"
              >
                Dirección de entrega
              </label>
              {direccionInicial.trim() ? (
                <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 mb-3">
                  Precargada desde el pedido. Verifíquela antes de continuar.
                </p>
              ) : (
                <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-3">
                  El cliente no registró dirección. Ingrese una válida.
                </p>
              )}
              <DireccionDespachoPeruFields
                value={direccion}
                onChange={setDireccion}
                variant="admin"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="fecha-entrega"
              className="text-[11px] font-black text-stone-500 uppercase tracking-widest block mb-2"
            >
              Fecha estimada de entrega
            </label>
            <input
              id="fecha-entrega"
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="notas-empaque"
              className="text-[11px] font-black text-stone-500 uppercase tracking-widest block mb-2"
            >
              Notas u Observaciones
            </label>
            <textarea
              id="notas-empaque"
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none"
              placeholder="Ej. Paquete frágil, caja reforzada con cinta de seguridad..."
            />
          </div>
        </div>

        <Button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-violet-600/20"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              {subiendo ? 'Procesando evidencias...' : 'Confirmando despacho...'}
            </>
          ) : (
            'Crear Despacho'
          )}
        </Button>
      </div>
    </div>
  );
}