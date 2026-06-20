import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import { ROLES_EMPAQUE_PEDIDO } from '@/lib/constants/pedidos-logistica';
import { PedidoEmpaqueForm } from '@/components/admin/pedidos/empaque/PedidoEmpaqueForm';

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

export default async function PedidoEmpaquePage({ params }: PageProps) {
  const auth = await requireServerRole(ROLES_EMPAQUE_PEDIDO);
  if (!auth.success) {
    redirectOnAuthFailure(auth.error);
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const pedido = await prisma.pedidos.findUnique({
    where: { id: BigInt(id) },
    select: {
      id: true,
      estado: true,
      direccion_despacho: true,
    },
  });

  if (!pedido) notFound();

  if (pedido.estado !== 'listo_para_despacho') {
    redirect(`/admin/Panel-Administrativo/pedidos/${id}`);
  }

  const despachoActivo = await prisma.despachos.findFirst({
    where: {
      pedido_id: pedido.id,
      estado: { in: ['preparando', 'en_ruta', 'pendiente'] },
    },
  });

  if (despachoActivo) {
    if (despachoActivo.estado === 'en_ruta') {
      redirect(`/admin/Panel-Administrativo/pedidos/${id}/entrega`);
    }
    redirect(`/admin/Panel-Administrativo/pedidos/${id}`);
  }

  return (
    <PedidoEmpaqueForm
      pedidoId={String(pedido.id)}
      direccionInicial={pedido.direccion_despacho ?? ''}
    />
  );
}
