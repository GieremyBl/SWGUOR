export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireServerAuth } from '@/lib/auth/server';
import {
  listarPedidosContextoPortal,
  listarPedidosDetallePortal,
} from '@/lib/services/portal-pedidos-list.service';
import { resolverCostoEnvioPedido } from '@/lib/helpers/portal-costo-envio.helper';
import { resolverItemsPedido } from '@/lib/helpers/portal-pedido-items.helper';
import { notificarClienteSobrePedido } from '@/lib/helpers/pedido-seguimiento.helper';

const IGV_RATE = 0.18;
const ALMACEN_DESPACHO_DEFAULT_ID = 1n; // 💡 Ajusta este ID según tu tabla de 'almacenes'

async function obtenerClienteSesion() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status };
  }

  const clienteDb = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
    select: { id: true, razon_social: true, estado: true },
  });

  if (!clienteDb) {
    return { error: 'cliente_no_encontrado' as const, status: 404 };
  }

  if (clienteDb.estado !== 'activo') {
    return { error: 'cliente_inactivo' as const, status: 403 };
  }

  return {
    usuario_id: auth.user.id,
    cliente_id: clienteDb.id,
    cliente: clienteDb,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const incluirFinalizados = searchParams.get('todos') === '1';
    const vistaContexto = searchParams.get('vista') === 'contexto';

    const resultado = vistaContexto
      ? await listarPedidosContextoPortal()
      : await listarPedidosDetallePortal({ incluirFinalizados });

    if (!('data' in resultado)) {
      return NextResponse.json(
        { success: false, error: 'error' in resultado ? resultado.error : 'Error desconocido' },
        { status: 'status' in resultado ? resultado.status : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt(resultado.data),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Portal] GET pedidos:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sesion = await obtenerClienteSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.status },
      );
    }

    const body = await req.json();
    const {
      items,
      direccion_despacho,
      zona_envio,
      zona_envio_id,
      costo_envio: costo_envio_body,
      notas_cliente,
      reservar_stock = true,
      metodo_pago,
    } = body;

    if (!items?.length) {
      return NextResponse.json(
        { success: false, error: 'items_requeridos' },
        { status: 400 },
      );
    }

    const itemsResueltos = await resolverItemsPedido(items);
    if ('error' in itemsResueltos) {
      return NextResponse.json(
        {
          success: false,
          error: itemsResueltos.error,
          mensaje: 'No hay variante activa para uno de los productos.',
          producto_id: itemsResueltos.producto_id,
        },
        { status: 400 },
      );
    }
    const lineas = itemsResueltos.items;

    const productoIds = [...new Set(lineas.map((i) => BigInt(i.producto_id)))];
    const productos = await prisma.productos.findMany({
      where: { id: { in: productoIds }, estado: 'activo' },
      select: { id: true, moq: true, precio: true },
    });
    const moqPorProducto = new Map(productos.map((p) => [Number(p.id), p.moq]));

    const bajoMoq: { producto_id: number; moq: number; cantidad: number }[] = [];
    for (const item of lineas) {
      const moq = moqPorProducto.get(Number(item.producto_id)) ?? 400;
      if (Number(item.cantidad) < moq) {
        bajoMoq.push({
          producto_id: Number(item.producto_id),
          moq,
          cantidad: Number(item.cantidad),
        });
      }
    }
    if (bajoMoq.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'moq_no_cumplido',
          mensaje: 'Uno o más productos no alcanzan la cantidad mínima.',
          detalle: bajoMoq,
        },
        { status: 400 },
      );
    }

    const { zona_envio_id: zonaEnvioId, costo_envio: costoEnvio } =
      await resolverCostoEnvioPedido({
        zona_envio_id,
        zona_envio,
        costo_envio: costo_envio_body,
      });

    const subtotalBruto = lineas.reduce(
      (acc, i) => acc + Number(i.precio_unitario ?? 0) * Number(i.cantidad),
      0,
    );
    const totalUnidades = lineas.reduce((acc, i) => acc + Number(i.cantidad), 0);
    const igv = subtotalBruto * IGV_RATE;
    const total = subtotalBruto + igv + costoEnvio;
    const moqAplicado = productos.length
      ? Math.max(...productos.map((p) => p.moq))
      : 400;

    // Validación de stock real físico en variantes antes de abrir transacciones pesadas
    if (reservar_stock) {
      for (const item of lineas) {
        const v = await prisma.variantes_producto.findUnique({
          where: { id: BigInt(item.variante_id) },
          select: { stock: true },
        });
        if (!v || v.stock < Number(item.cantidad)) {
          return NextResponse.json(
            {
              success: false,
              error: 'stock_insuficiente',
              mensaje: `Stock físico insuficiente en la variante ID: ${item.variante_id}`,
              disponible: v?.stock ?? 0,
            },
            { status: 409 },
          );
        }
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Registrar pedido de venta principal
      const pedido = await tx.pedidos.create({
        data: {
          cliente_id: sesion.cliente_id,
          created_by: sesion.usuario_id,
          estado: 'pendiente',
          subtotal: new Prisma.Decimal(subtotalBruto),
          igv: new Prisma.Decimal(igv),
          total: new Prisma.Decimal(total),
          total_estimado: new Prisma.Decimal(total),
          monto_descuento: new Prisma.Decimal(0),
          costo_envio: new Prisma.Decimal(costoEnvio),
          total_unidades: totalUnidades,
          moq_aplicado: moqAplicado || 400,
          direccion_despacho: direccion_despacho ?? null,
          notas_cliente: notas_cliente ?? null,
          zona_envio_id: zonaEnvioId,
          moneda: 'PEN',
          metodo_pago: metodo_pago ?? null,
          saldo_pendiente: new Prisma.Decimal(total),
          pedido_items: {
            create: lineas.map((item) => ({
              producto_id: BigInt(item.producto_id),
              variante_id: BigInt(item.variante_id),
              cantidad: Number(item.cantidad),
              especificaciones: {
                precio_unitario: Number(item.precio_unitario ?? 0),
              },
            })),
          },
        },
        include: { pedido_items: true },
      });

      // 2. Descontar stock real y registrar el kárdex (movimientos_inventario)
      if (reservar_stock) {
        const expira = new Date(Date.now() + 30 * 60 * 1000);

        for (const item of lineas) {
          const varianteIdBf = BigInt(item.variante_id);
          const cantidadNum = Number(item.cantidad);

          const varianteActual = await tx.variantes_producto.findUnique({
            where: { id: varianteIdBf },
            select: { stock: true, producto_id: true }
          });

          if (!varianteActual || varianteActual.stock < cantidadNum) {
            throw new Error(`Stock insuficiente en variante ${item.variante_id}.`);
          }

          // 2.a Registrar en reservas_stock
          await tx.reservas_stock.create({
            data: {
              variante_id: varianteIdBf,
              pedido_id: pedido.id,
              cantidad: cantidadNum,
              expira_en: expira,
              estado: 'activa',
            },
          });

          // 2.b Restar del stock real de la variante
          await tx.variantes_producto.update({
            where: { id: varianteIdBf },
            data: {
              stock: { decrement: cantidadNum },
            },
          });

          // 2.c Registrar en movimientos_inventario
          await tx.movimientos_inventario.create({
            data: {
              producto_id: varianteActual.producto_id,
              insumo_id: null,
              material_id: null,
              variante_id: varianteIdBf,
              almacen_id: ALMACEN_DESPACHO_DEFAULT_ID,
              cantidad: cantidadNum,
              usuario_id: BigInt(sesion.usuario_id),
              motivo: `Reserva automática por Compra Directa - Pedido #${pedido.id}`,
              tipo_movimiento: 'SALIDA' as any,
              referencia_tipo: 'PEDIDO' as any,
            },
          });
        }
      }

      // 3. Generar hito de trazabilidad inicial
      await tx.seguimiento_pedido.create({
        data: {
          pedido_id: pedido.id,
          status: 'pendiente',
          notas: 'Compra directa registrada. Producción en cola.',
        },
      });

      return pedido;
    });

    await notificarClienteSobrePedido({
      clienteId: sesion.cliente_id,
      pedidoId: resultado.id,
      titulo: 'Pedido confirmado',
      mensaje: `Su pedido #${resultado.id} fue registrado. Revise el avance en Trazabilidad.`,
    });

    return NextResponse.json(
      { success: true, data: serializeBigInt(resultado) },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Portal] POST pedidos:', error);

    if (message.includes('Stock insuficiente')) {
      return NextResponse.json(
        { success: false, error: 'stock_insuficiente', mensaje: message },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: false, error: message, mensaje: message }, { status: 500 });
  }
}