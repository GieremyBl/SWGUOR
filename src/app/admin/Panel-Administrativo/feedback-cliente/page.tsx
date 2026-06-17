'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, MessageSquareQuote, SmilePlus, Star, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import StatCard from '@/components/admin/common/StatCard';
import FeedbackClienteTable, { type FeedbackClienteRecord } from '@/components/admin/feedback-cliente/FeedbackClienteTable';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';

export default function FeedbackClientePage() {
  const { can } = usePermissions();
  const [feedbacks, setFeedbacks] = useState<FeedbackClienteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!can('view', 'feedback_cliente')) return;

    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/feedback-cliente', { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body?.error ?? 'Error al cargar feedback');
        }
        setFeedbacks(Array.isArray(body) ? body : (body.data ?? []));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [can]);

  const summary = useMemo(() => {
    const total = feedbacks.length;
    const average = total > 0
      ? feedbacks.reduce((acc, item) => acc + Number(item.puntuacion ?? 0), 0) / total
      : 0;
    const recomendan = total > 0
      ? Math.round((feedbacks.filter((item) => item.recomendaria === true).length / total) * 100)
      : 0;
    const conObservaciones = feedbacks.filter((item) => Boolean(item.comentarios?.trim())).length;
    const revisados = feedbacks.filter((item) => item.estado === 'revisado').length;
    const avgCalidad = total > 0
      ? feedbacks.reduce((acc, item) => acc + Number(item.calidad_producto ?? item.puntuacion ?? 0), 0) / total
      : 0;
    const avgEntrega = total > 0
      ? feedbacks.reduce((acc, item) => acc + Number(item.tiempo_entrega ?? item.puntuacion ?? 0), 0) / total
      : 0;

    return { total, average, recomendan, conObservaciones, revisados, avgCalidad, avgEntrega };
  }, [feedbacks]);

  const getScoreLabel = (score: number) => {
    if (score >= 5) return 'Excelente';
    if (score >= 4) return 'Muy bueno';
    if (score >= 3) return 'Aceptable';
    if (score >= 2) return 'Bajo';
    return 'Crítico';
  };

  if (!can('view', 'feedback_cliente')) {
    return <div className="p-8 text-center text-slate-500">Acceso denegado</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <AdminPageHeader
          title="Feedback de Clientes"
          description="Grados de satisfacción por compra, observaciones y recomendación sobre la atención recibida."
          showAction={false}
        />
        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-rose-900/80 shadow-sm max-w-2xl">
          Aquí puedes revisar cómo perciben los clientes la calidad del producto, los tiempos de entrega y la atención personal, además de sus comentarios abiertos.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard title="Total feedback" value={summary.total} icon={MessageSquareQuote} color="pink" />
          <StatCard
            title="Satisfacción promedio"
            value={`${getScoreLabel(summary.average)} · ${Math.round(summary.average)}/5`}
            icon={Star}
            color="amber"
          />
          <StatCard title="Recomiendan" value={`${summary.recomendan}%`} icon={BadgeCheck} color="emerald" />
          <StatCard title="Con observación" value={summary.conObservaciones} icon={SmilePlus} color="blue" />
          <StatCard title="Revisados" value={summary.revisados} icon={Truck} color="slate" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calidad del producto</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{summary.avgCalidad.toFixed(1)}/5</p>
            <p className="mt-1 text-sm text-slate-500">Promedio de evaluación sobre acabado, tela y conformidad.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tiempo de entrega</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{summary.avgEntrega.toFixed(1)}/5</p>
            <p className="mt-1 text-sm text-slate-500">Valoración sobre puntualidad y cumplimiento del pedido.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clientes que recomiendan</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{summary.recomendan}%</p>
            <p className="mt-1 text-sm text-slate-500">Proporción de feedback positivo con intención de recomendación.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden p-4 md:p-6">
          <FeedbackClienteTable data={feedbacks} loading={loading} />
        </div>
      </div>
    </div>
  );
}