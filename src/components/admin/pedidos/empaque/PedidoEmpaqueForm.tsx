'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2, Package, Upload, X } from 'lucide-react';
import Image from 'next/image';
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href={`/admin/Panel-Administrativo/pedidos/${pedidoId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-violet-600 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver al pedido
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-sm">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Empaque — Pedido #{pedidoId}
            </h1>
            <p className="text-sm text-stone-500">Registre evidencias y cree el despacho</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">
            Fotos de empaque
          </label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl py-8 cursor-pointer hover:bg-stone-50 transition-colors">
            <Upload size={24} className="text-stone-400 mb-2" />
            <span className="text-xs font-bold text-stone-500">Seleccionar imágenes</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onSelectFotos}
            />
          </label>
          {fotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {fotos.map((f, i) => (
                <div key={f.preview} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <Image src={f.preview} alt="" fill className="object-cover" unoptimized />
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
            htmlFor="notas-empaque"
            className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5"
          >
            Notas de empaque
          </label>
          <textarea
            id="notas-empaque"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Observaciones del empaque..."
          />
        </div>

        <div>
          <label
            htmlFor="direccion"
            className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5"
          >
            Dirección de entrega
          </label>
          {direccionInicial.trim() ? (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-2">
              Precargada desde la dirección indicada por el cliente. Confírmela o ajústela si es necesario.
            </p>
          ) : (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
              El cliente no registró dirección. Ingrese la dirección de entrega antes de crear el despacho.
            </p>
          )}
          <DireccionDespachoPeruFields
            value={direccion}
            onChange={setDireccion}
            variant="admin"
          />
        </div>

        <div>
          <label
            htmlFor="fecha-entrega"
            className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5"
          >
            Fecha estimada de entrega
          </label>
          <input
            id="fecha-entrega"
            type="date"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </div>

        <Button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-violet-600 hover:bg-violet-700 font-black uppercase text-xs tracking-widest"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              {subiendo ? 'Subiendo fotos...' : 'Creando despacho...'}
            </>
          ) : (
            'Crear despacho'
          )}
        </Button>
      </div>
    </div>
  );
}
