import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser } from '@/lib/auth/server';
import { PedidoEntregaForm } from '@/components/admin/pedidos/entrega/PedidoEntregaForm';
import { PedidoEntregaPendienteRuta } from '@/components/admin/pedidos/entrega/PedidoEntregaPendienteRuta';

export const dynamic = 'force-dynamic';

const ROLES = ['administrador', 'gerente'] as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PedidoEntregaPage({ params }: PageProps) {
  const auth = await getServerAuthUser();
  if (!auth.success) notFound();
  if (!ROLES.includes(auth.user.rol as (typeof ROLES)[number])) {
    redirect('/admin/acceso-denegado');
  }

  const { id } = await params;

  const pedido = await prisma.pedidos.findUnique({
    where: { id: BigInt(id) },
    select: { id: true, estado: true },
  });

  if (!pedido) notFound();

  if (pedido.estado === 'entregado') {
    redirect(`/admin/Panel-Administrativo/pedidos/${id}`);
  }

  const despachoEnRuta = await prisma.despachos.findFirst({
    where: {
      pedido_id: BigInt(id),
      estado: 'en_ruta',
    },
    orderBy: { created_at: 'desc' },
  });

  if (despachoEnRuta) {
    return (
      <PedidoEntregaForm
        pedidoId={id}
        despacho={{
          id: String(despachoEnRuta.id),
          estado: despachoEnRuta.estado,
          direccion_entrega: despachoEnRuta.direccion_entrega,
          fecha_entrega: despachoEnRuta.fecha_entrega?.toISOString() ?? null,
        }}
      />
    );
  }

  const despachoPreparando = await prisma.despachos.findFirst({
    where: {
      pedido_id: BigInt(id),
      estado: 'preparando',
    },
    orderBy: { created_at: 'desc' },
  });

  if (despachoPreparando) {
    return (
      <PedidoEntregaPendienteRuta
        pedidoId={id}
        despacho={{
          id: String(despachoPreparando.id),
          estado: despachoPreparando.estado,
          direccion_entrega: despachoPreparando.direccion_entrega,
        }}
      />
    );
  }

  if (pedido.estado === 'listo_para_despacho') {
    redirect(`/admin/Panel-Administrativo/pedidos/${id}/empaque`);
  }

  redirect(`/admin/Panel-Administrativo/pedidos/${id}`);
}
