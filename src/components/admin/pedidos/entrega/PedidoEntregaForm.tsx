'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, FileText, Loader2, Truck, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { subirActaEntrega, subirFotoEntrega } from '@/lib/helpers/despacho-upload.client';
import { labelEstado } from '@/lib/helpers/despachos-helpers';

interface Props {
  pedidoId: string;
  despacho: {
    id: string;
    estado: string;
    direccion_entrega: string;
    fecha_entrega: string | null;
  };
}

export function PedidoEntregaForm({ pedidoId, despacho }: Props) {
  const router = useRouter();
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [fotos, setFotos] = useState<{ file: File; preview: string }[]>([]);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const onSelectFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setFotos((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
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
    if (!actaFile) {
      toast.error('Debe subir el acta de conformidad (PDF)');
      return;
    }

    setLoading(true);
    try {
      const actaUrl = await subirActaEntrega(pedidoId, actaFile);
      const urls: string[] = [];
      for (const f of fotos) {
        urls.push(await subirFotoEntrega(pedidoId, f.file));
      }

      const res = await fetch(`/api/admin/pedidos/${pedidoId}/entrega`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acta_pdf_url: actaUrl,
          fotos: urls,
          notas,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al confirmar entrega');

      toast.success('Entrega confirmada');
      router.push(`/admin/Panel-Administrativo/pedidos/${pedidoId}`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al confirmar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href={`/admin/Panel-Administrativo/pedidos/${pedidoId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-violet-600 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver al pedido
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Entrega — Pedido #{pedidoId}
            </h1>
            <p className="text-sm text-stone-500">
              Despacho #{despacho.id} · {labelEstado(despacho.estado)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-bold text-stone-900">Dirección</p>
        <p>{despacho.direccion_entrega}</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">
            Acta de conformidad (PDF)
          </label>
          <label className="flex items-center gap-2 border border-dashed border-stone-200 rounded-lg px-4 py-3 cursor-pointer hover:bg-stone-50">
            <FileText size={18} className="text-stone-400" />
            <span className="text-sm text-stone-600 truncate">
              {actaFile?.name ?? 'Seleccionar PDF'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setActaFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">
            Fotos de evidencia de entrega
          </label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl py-6 cursor-pointer hover:bg-stone-50">
            <Upload size={22} className="text-stone-400 mb-1" />
            <span className="text-xs font-bold text-stone-500">Agregar fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onSelectFotos}
            />
          </label>
          {fotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {fotos.map((f, i) => (
                <div
                  key={f.preview}
                  className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-stone-200 bg-stone-100"
                >
                  {/* img nativo: next/image no renderiza bien blob URLs locales */}
                  <img
                    src={f.preview}
                    alt={`Evidencia de entrega ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => quitarFoto(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="notas-entrega"
            className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5"
          >
            Notas de entrega
          </label>
          <textarea
            id="notas-entrega"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>

        <Button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Confirmando...
            </>
          ) : (
            'Confirmar entrega'
          )}
        </Button>
      </div>
    </div>
  );
}
