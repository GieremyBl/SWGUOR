import { prisma }          from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { EstadoPedido, PrioridadPedido } from '@prisma/client';
import { notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';
import { validarTransicionEstadoPedido } from '@/lib/helpers/pedido-transiciones.helper';
import { resolverEstadoVisualPedido } from '@/lib/helpers/pedido-estado-visual.helper';
import { precargarDireccionDespachoPedido } from '@/lib/helpers/pedido-direccion.helper';

export const PedidosService = {

  async listar() {
    const pedidos = await prisma.pedidos.findMany({
      include: {
        clientes:    { select: { id: true, razon_social: true, nombre_comercial: true, ruc: true,} },
        pedido_items: { select: { id: true, cantidad: true } },
        despachos: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { estado: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return serializeBigInt(pedidos).map((pedido) => {
      const despachoEstado = pedido.despachos?.[0]?.estado ?? null;
      const visual = resolverEstadoVisualPedido(pedido.estado, despachoEstado);
      const { despachos: _despachos, ...resto } = pedido;

      return {
        ...resto,
        despacho_estado: despachoEstado,
        estado_visual: visual.key,
        estado_label: visual.label,
      };
    });
  },

  async obtenerPorId(id: string) {
    const pedido = await prisma.pedidos.findUnique({
      where: { id: BigInt(id) },
      include: {
        clientes: {
          select: {
            id: true, ruc: true, razon_social: true,
            nombre_comercial: true, telefono: true, email: true,
          },
        },
        pedido_items: {
          include: {
            productos:         { select: { id: true, nombre: true, sku: true, imagen: true } },
            variantes_producto: { select: { id: true, color: true, talla: true, sku: true } },
          },
        },
        seguimiento_pedido: { orderBy: { created_at: 'desc' } },
        ordenes_produccion: {
          include: {
            talleres:       { select: { id: true, nombre: true, contacto: true, email: true } },
            fichas_tecnicas: { select: { id: true, version: true, estado: true } },
            seguimiento_produccion: {
              where:   { activo: true },
              take:    1,
              orderBy: { created_at: 'desc' },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });
    return pedido ? serializeBigInt(pedido) : null;
  },

  async actualizar(id: string, data: {
    estado?:        EstadoPedido;
    prioridad?:     PrioridadPedido;
    notas_pedido?:  string;
    notas_cliente?: string;
  }) {
    const antes = data.estado
      ? await prisma.pedidos.findUnique({
          where: { id: BigInt(id) },
          select: { estado: true, cliente_id: true },
        })
      : null;

    if (data.estado) {
      if (!antes) {
        throw new Error('Pedido no encontrado');
      }
      if (data.estado !== antes.estado) {
        validarTransicionEstadoPedido(antes.estado, data.estado);
      }
    }

    const pedido = await prisma.pedidos.update({
      where: { id: BigInt(id) },
      data:  { ...data, updated_at: new Date() },
    });

    if (
      data.estado === 'listo_para_despacho' &&
      antes?.cliente_id
    ) {
      await prisma.$transaction(async (tx) => {
        await precargarDireccionDespachoPedido(tx, BigInt(id), antes.cliente_id!);
      });
    }

    if (
      antes?.cliente_id &&
      data.estado &&
      antes.estado !== data.estado
    ) {
      await notificarTransicionEstadoPedido({
        clienteId: antes.cliente_id,
        pedidoId: pedido.id,
        estadoAnterior: antes.estado,
        estadoNuevo: data.estado,
      });
    }

    return serializeBigInt(pedido);
  },

  async registrarSeguimiento(data: {
    pedido_id:   string;
    status:      EstadoPedido;
    notas?:      string;
    creado_por?: string;
  }) {
    const antes = await prisma.pedidos.findUnique({
      where: { id: BigInt(data.pedido_id) },
      select: { estado: true, cliente_id: true },
    });

    if (!antes) {
      throw new Error('Pedido no encontrado');
    }

    validarTransicionEstadoPedido(antes.estado, data.status);

    const seg = await prisma.$transaction(async (tx) => {
      const registro = await tx.seguimiento_pedido.create({
        data: {
          pedido_id:  BigInt(data.pedido_id),
          status:     data.status,
          notas:      data.notas      ?? null,
          creado_por: data.creado_por ?? null,
        },
      });

      await tx.pedidos.update({
        where: { id: BigInt(data.pedido_id) },
        data:  { estado: data.status, updated_at: new Date() },
      });

      return registro;
    });

    if (antes?.cliente_id && antes.estado !== data.status) {
      await notificarTransicionEstadoPedido({
        clienteId: antes.cliente_id,
        pedidoId: BigInt(data.pedido_id),
        estadoAnterior: antes.estado,
        estadoNuevo: data.status,
      });
    }

    return serializeBigInt(seg);
  },
};