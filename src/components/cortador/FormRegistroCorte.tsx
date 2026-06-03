'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  pedidoId: string;
  corteCompletado: boolean;
  ordenId: string | null;
  puedeRegistrarCorte: boolean;
  pedidoEstado: string;
}

export function FormRegistroCorte({
  pedidoId,
  corteCompletado,
  ordenId,
  puedeRegistrarCorte,
  pedidoEstado,
}: Props) {
  const router = useRouter();
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cortador/pedidos/${pedidoId}/corte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'No se pudo registrar el corte');
      }
      toast.success(
        json.data?.ya_existia
          ? 'El corte ya estaba registrado'
          : 'Corte registrado. Orden de confección enviada al taller externo.',
      );
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al registrar corte');
    } finally {
      setLoading(false);
    }
  };

  if (corteCompletado) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
        <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={18} />
          Corte registrado en planta
        </p>
        {ordenId && (
          <p className="text-xs text-emerald-700">
            Orden de confección #{ordenId} generada para el taller externo. El pedido
            sigue en producción para el cliente.
          </p>
        )}
      </div>
    );
  }

  if (!puedeRegistrarCorte) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        {pedidoEstado !== 'en_produccion' ? (
          <p>
            El pedido aún no está en <strong>producción</strong> (estado actual:{' '}
            {pedidoEstado.replace(/_/g, ' ')}). El diseñador debe aprobar todas las
            fichas técnicas antes de que pueda registrar el corte.
          </p>
        ) : (
          <p>
            Falta la ficha técnica aprobada del producto principal. Solicite al diseñador
            que complete y apruebe la ficha antes de cortar.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-white p-5 space-y-4 shadow-sm">
      <div>
        <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
          Registro de corte (planta interna)
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Al confirmar, el sistema creará automáticamente la orden de confección para el
          taller externo. El estado del pedido ante el cliente no cambia.
        </p>
      </div>
      <div>
        <label
          htmlFor="notas-corte"
          className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1.5"
        >
          Notas de corte
        </label>
        <textarea
          id="notas-corte"
          rows={4}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones del corte, mermas, ubicación de piezas..."
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>
      <Button
        type="button"
        disabled={loading}
        onClick={handleSubmit}
        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 font-black uppercase text-xs tracking-widest"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Registrando...
          </>
        ) : (
          'Registrar corte completado y generar Orden de Confección'
        )}
      </Button>
    </div>
  );
}
