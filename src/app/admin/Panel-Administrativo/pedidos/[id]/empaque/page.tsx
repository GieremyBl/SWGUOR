import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerAuthUser } from '@/lib/auth/server';
import { PedidoEmpaqueForm } from '@/components/admin/pedidos/empaque/PedidoEmpaqueForm';

export const dynamic = 'force-dynamic';

const ROLES = ['administrador', 'gerente'] as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PedidoEmpaquePage({ params }: PageProps) {
  const auth = await getServerAuthUser();
  if (!auth.success) notFound();
  if (!ROLES.includes(auth.user.rol as (typeof ROLES)[number])) {
    redirect('/admin/acceso-denegado');
  }

  const { id } = await params;
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
