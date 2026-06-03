import { prisma } from '@/lib/prisma';
import {
  crearNotificacion,
  crearNotificacionCliente,
} from '@/lib/helpers/crear-notificacion.helper';
import { precargarDireccionDespachoPedido } from '@/lib/helpers/pedido-direccion.helper';
import { validarTransicionEstadoPedido } from '@/lib/helpers/pedido-transiciones.helper';

const NOTA_CONFORMIDAD = 'Conformidad aprobada por ayudante';

export interface ResultadoConformidad {
  pedidoId: bigint;
  yaAprobada: boolean;
}

async function notificarAdministradoresEmpaque(pedidoId: bigint) {
  const admins = await prisma.usuarios.findMany({
    where: {
      rol: { in: ['administrador', 'gerente'] },
      estado: 'activo',
    },
    select: { id: true },
  });

  const ref = String(pedidoId);
  const url = `/admin/Panel-Administrativo/pedidos/${ref}/empaque`;

  await Promise.all(
    admins.map((admin) =>
      crearNotificacion({
        usuario_id: admin.id,
        tipo: 'orden_produccion',
        titulo: 'Pedido listo para despacho',
        mensaje: `Pedido #${ref} listo para empacar y despachar.`,
        referencia_tipo: 'PEDIDO',
        referencia_id: pedidoId,
        url_destino: url,
      }),
    ),
  );
}

export async function aprobarConformidadConfeccion(params: {
  confeccionId: bigint;
  usuarioId: bigint;
}): Promise<ResultadoConformidad> {
  const conf = await prisma.confecciones.findUnique({
    where: { id: params.confeccionId },
    include: {
      ordenes_produccion: {
        include: {
          pedidos: {
            select: {
              id: true,
              estado: true,
              cliente_id: true,
            },
          },
        },
      },
    },
  });

  if (!conf) {
    throw new Error('Confección no encontrada');
  }

  const pedido = conf.ordenes_produccion?.pedidos;

  // ── Guard: cliente_id puede ser null en el esquema de Prisma ─────────────
  if (!pedido?.cliente_id) {
    throw new Error('La confección no está vinculada a un pedido válido');
  }

  // A partir de aquí TypeScript sabe que cliente_id es bigint (no null).
  const clienteId: bigint = pedido.cliente_id;

  if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
    throw new Error('El pedido ya no admite conformidad de taller');
  }

  if (pedido.estado === 'listo_para_despacho' && conf.estado === 'completada') {
    return { pedidoId: pedido.id, yaAprobada: true };
  }

  validarTransicionEstadoPedido(pedido.estado, 'listo_para_despacho');

  await prisma.$transaction(async (tx) => {
    await tx.confecciones.update({
      where: { id: params.confeccionId },
      data: {
        estado: 'completada',
        fecha_fin: new Date(),
        updated_at: new Date(),
      },
    });

    await tx.seguimiento_confeccion.create({
      data: {
        confeccion_id: params.confeccionId,
        estado_anterior: conf.estado,
        estado_nuevo: 'completada',
        notas: NOTA_CONFORMIDAD,
        responsable_id: params.usuarioId,
      },
    });

    if (conf.orden_produccion_id) {
      await tx.ordenes_produccion.update({
        where: { id: conf.orden_produccion_id },
        data: { estado: 'completada', updated_at: new Date() },
      });
    }

    await tx.pedidos.update({
      where: { id: pedido.id },
      data: { estado: 'listo_para_despacho', updated_at: new Date() },
    });

    await precargarDireccionDespachoPedido(tx, pedido.id, clienteId);

    await tx.seguimiento_pedido.create({
      data: {
        pedido_id: pedido.id,
        status: 'listo_para_despacho',
        notas: NOTA_CONFORMIDAD,
      },
    });
  });

  await crearNotificacionCliente({
    clienteId,
    tipo: 'sistema',
    titulo: '¡Tu pedido está listo!',
    mensaje: '¡Tu pedido está listo! Confirma tu dirección de entrega.',
    referencia_tipo: 'PEDIDO',
    referencia_id: pedido.id,
    url_destino: '/portal/seguimiento-pedido',
  });

  await notificarAdministradoresEmpaque(pedido.id);

  return { pedidoId: pedido.id, yaAprobada: false };
}