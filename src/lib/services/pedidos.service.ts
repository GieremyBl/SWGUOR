import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { EstadoPedido, PrioridadPedido } from '@prisma/client';
import { notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';
import { validarTransicionEstadoPedido } from '@/lib/helpers/pedido-transiciones.helper';
import { resolverEstadoVisualPedido } from '@/lib/helpers/pedido-estado-visual.helper';
import { precargarDireccionDespachoPedido } from '@/lib/helpers/pedido-direccion.helper';
import { MovimientosInventarioService } from './movimientos-inventario.service';

export const PedidosService = {

  async listar() {
    const pedidos = await prisma.pedidos.findMany({
      include: {
        clientes: { select: { id: true, razon_social: true, nombre_comercial: true, ruc: true } },
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
            productos: { select: { id: true, nombre: true, sku: true, imagen: true } },
            variantes_producto: { select: { id: true, color: true, talla: true, sku: true } },
          },
        },
        seguimiento_pedido: { orderBy: { created_at: 'desc' } },
        ordenes_produccion: {
          include: {
            talleres: { select: { id: true, nombre: true, contacto: true, email: true } },
            fichas_tecnicas: { select: { id: true, version: true, estado: true } },
            seguimiento_produccion: {
              where: { activo: true },
              take: 1,
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
    estado?: EstadoPedido;
    prioridad?: PrioridadPedido;
    notas_pedido?: string;
    notas_cliente?: string;
    almacen_id?: string | number; // 🏢 Añadido: Almacén de donde saldrá físicamente la mercadería
    usuario_id?: string | number; // 👤 Añadido: Quién procesa el cambio de estado
  }) {
    const { almacen_id, usuario_id, ...dataPrisma } = data;

    const antes = dataPrisma.estado
      ? await prisma.pedidos.findUnique({
        where: { id: BigInt(id) },
        select: { estado: true, cliente_id: true },
      })
      : null;

    if (dataPrisma.estado) {
      if (!antes) {
        throw new Error('Pedido no encontrado');
      }
      if (dataPrisma.estado !== antes.estado) {
        validarTransicionEstadoPedido(antes.estado, dataPrisma.estado);
      }
    }

    // Ejecutamos todo de forma estrictamente transaccional
    const pedido = await prisma.$transaction(async (tx) => {

      const pedidoActualizado = await tx.pedidos.update({
        where: { id: BigInt(id) },
        data: { ...dataPrisma, updated_at: new Date() },
      });

      // Si pasa a listo para despacho, ejecutamos la salida física de inventario
      if (dataPrisma.estado === 'listo_para_despacho' && antes?.estado !== 'listo_para_despacho') {

        // 1. Buscamos los productos y cantidades exactas de este pedido
        const items = await tx.pedido_items.findMany({
          where: { pedido_id: BigInt(id) },
          select: { producto_id: true, cantidad: true }
        });

        // 2. Registramos la salida en el kárdex por cada ítem.
        // Como 'registrar' valida el stock preventivo por almacén e interactúa con el Helper,
        // garantizamos consistencia total antes de liberar el despacho.
        for (const item of items) {
          if (item.producto_id) {
            await MovimientosInventarioService.registrar({
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              tipo_movimiento: 'salida', // Descuenta el inventario
              motivo: `Reserva y preparación automatizada de despacho`,
              origen: { tipo: 'PEDIDO_CLIENTE', id: id }, // Enlaza el origen limpiamente sin parámetros inventados
              almacen_id: almacen_id, // Almacén seleccionado en el modal del frontend
              usuario_id: usuario_id,
              verificarStock: true // Frena la operación si no hay stock físico real en ese almacén
            });
          }
        }

        // 3. Logística de dirección heredada
        if (antes?.cliente_id) {
          await precargarDireccionDespachoPedido(tx, BigInt(id), antes.cliente_id!);
        }
      }

      return pedidoActualizado;
    });

    // Notificaciones fuera de la transacción para no bloquear la BD si el servicio externo tarda
    if (
      antes?.cliente_id &&
      dataPrisma.estado &&
      antes.estado !== dataPrisma.estado
    ) {
      await notificarTransicionEstadoPedido({
        clienteId: antes.cliente_id,
        pedidoId: pedido.id,
        estadoAnterior: antes.estado,
        estadoNuevo: dataPrisma.estado,
      });
    }

    return serializeBigInt(pedido);
  },

  async registrarSeguimiento(data: {
    pedido_id: string;
    status: EstadoPedido;
    notas?: string;
    creado_por?: string;
    almacen_id?: string | number;
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
          pedido_id: BigInt(data.pedido_id),
          status: data.status,
          notas: data.notas ?? null,
          creado_por: data.creado_por ?? null,
        },
      });

      // Delegamos la actualización al método maestro interno para heredar la lógica del kárdex si el status cambia aquí
      await tx.pedidos.update({
        where: { id: BigInt(data.pedido_id) },
        data: { estado: data.status, updated_at: new Date() },
      });

      if (data.status === 'listo_para_despacho' && antes.estado !== 'listo_para_despacho') {
        const items = await tx.pedido_items.findMany({
          where: { pedido_id: BigInt(data.pedido_id) },
          select: { producto_id: true, cantidad: true }
        });

        for (const item of items) {
          if (item.producto_id) {
            await MovimientosInventarioService.registrar({
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              tipo_movimiento: 'salida',
              motivo: `Reserva desde línea de tiempo de seguimiento`,
              origen: { tipo: 'PEDIDO_CLIENTE', id: data.pedido_id },
              almacen_id: data.almacen_id,
              usuario_id: data.creado_por,
              verificarStock: true
            });
          }
        }

        if (antes?.cliente_id) {
          await precargarDireccionDespachoPedido(tx, BigInt(data.pedido_id), antes.cliente_id!);
        }
      }

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