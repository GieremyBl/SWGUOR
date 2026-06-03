import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { stringifyBigInts } from '@/lib/utils/serialize';
import { ArrowLeft } from 'lucide-react';
import { ESTADO_LABELS } from '@/lib/schemas/confecciones';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfeccionDetallePage({ params }: PageProps) {
  const { id } = await params;

  const conf = await prisma.confecciones.findUnique({
    where: { id: BigInt(id) },
    include: {
      talleres: { select: { id: true, nombre: true, contacto: true, telefono: true } },
      ordenes_produccion: {
        include: {
          pedidos: {
            select: {
              id: true,
              estado: true,
              clientes: {
                select: { razon_social: true, nombre_comercial: true },
              },
            },
          },
        },
      },
    },
  });

  if (!conf) notFound();

  const data = stringifyBigInts(conf) as unknown as {
    id: string;
    prenda: string;
    cantidad: number;
    estado: string;
    notas: string | null;
    talleres: { nombre: string; contacto: string | null; telefono: string | null } | null;
    ordenes_produccion: {
      id: string;
      pedidos: {
        id: string;
        estado: string;
        clientes: { razon_social: string | null; nombre_comercial: string | null } | null;
      } | null;
    } | null;
  };

  const pedido = data.ordenes_produccion?.pedidos;
  const cliente =
    pedido?.clientes?.razon_social ||
    pedido?.clientes?.nombre_comercial ||
    '—';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link
        href="/admin/Panel-Administrativo/confecciones"
        className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-pink-600 hover:opacity-80"
      >
        <ArrowLeft size={13} /> Volver a confecciones
      </Link>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-black text-stone-900">Confección #{data.id}</h1>
        <p className="text-sm text-stone-600">{data.prenda}</p>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] font-black uppercase text-stone-400">Taller</dt>
            <dd className="font-bold text-stone-800">{data.talleres?.nombre ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase text-stone-400">Cantidad</dt>
            <dd className="font-bold text-stone-800">{data.cantidad} u.</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase text-stone-400">Estado</dt>
            <dd className="font-bold text-stone-800">
              {ESTADO_LABELS[data.estado as keyof typeof ESTADO_LABELS] ?? data.estado}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase text-stone-400">Pedido</dt>
            <dd className="font-bold text-stone-800">#{pedido?.id ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-black uppercase text-stone-400">Cliente</dt>
            <dd className="font-bold text-stone-800">{cliente}</dd>
          </div>
        </dl>

        {data.estado !== 'completada' && (
          <Link
            href={`/ayudante/confecciones/${data.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-teal-700"
          >
            Aprobar conformidad (ayudante)
          </Link>
        )}
      </div>
    </div>
  );
}
