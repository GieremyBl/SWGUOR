import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_LOGISTICA_DESPACHO } from '@/lib/constants/pedidos-logistica';
import { PedidoEntregaForm } from '@/components/admin/pedidos/entrega/PedidoEntregaForm';
import { PedidoEntregaPendienteRuta } from '@/components/admin/pedidos/entrega/PedidoEntregaPendienteRuta';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function redirectOnAuthFailure(error: string) {
  if (error === 'unauthenticated' || error === 'usuario_no_encontrado') {
    redirect('/login-admin');
  }
  redirect('/admin/acceso-denegado');
}

export default async function PedidoEntregaPage({ params }: PageProps) {
  const auth = await requireServerRole(ROLES_LOGISTICA_DESPACHO);
  if (!auth.success) {
    redirectOnAuthFailure(auth.error);
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

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
