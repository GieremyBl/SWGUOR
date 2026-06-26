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
import { descontarStockLineaPedido } from '@/lib/helpers/producto-stock-transaction.helper';
import { notificarClienteSobrePedido } from '@/lib/helpers/pedido-seguimiento.helper';
import { calcularDescuentosEscalaAutomaticos } from '@/lib/services/descuento-escala-automatico.service';
import { multiplyMoney, roundMoney } from '@/lib/helpers/money.helper';

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

    if ('error' in resultado) {
      return NextResponse.json(
        { success: false, error: resultado.error },
        { status: resultado.status },
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

async function stockDisponibleVariante(varianteId: bigint, cantidad: number) {
  const variante = await prisma.variantes_producto.findUnique({
    where: { id: varianteId },
    select: { id: true, stock: true },
  });
  if (!variante) return { ok: false, disponible: 0 };

  const reservasActivas = await prisma.reservas_stock.findMany({
    where: {
      variante_id: varianteId,
      estado: 'activa',
      expira_en: { gt: new Date() },
    },
    select: { cantidad: true },
  });
  const reservado = reservasActivas.reduce((s, r) => s + r.cantidad, 0);
  const disponible = variante.stock - reservado;
  return { ok: cantidad <= disponible, disponible };
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
          mensaje:
            'No hay variante activa para uno de los productos. Quita el ítem del carrito y agrégalo de nuevo desde el catálogo.',
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
    const precioBasePorProducto = new Map(
      productos.map((p) => [Number(p.id), Number(p.precio)]),
    );

    const varianteIds = [...new Set(lineas.map((i) => BigInt(i.variante_id)))];
    const variantes = await prisma.variantes_producto.findMany({
      where: { id: { in: varianteIds } },
      select: { id: true, precio_adicional: true },
    });
    const adicionalPorVariante = new Map(
      variantes.map((v) => [Number(v.id), Number(v.precio_adicional ?? 0)]),
    );

    // Precio unitario calculado en servidor (precio base + ajuste de variante),
    // nunca confiando en el precio que pudiera venir manipulado desde el carrito.
    const lineasConPrecio = lineas.map((item) => {
      const precioBase = precioBasePorProducto.get(Number(item.producto_id)) ?? 0;
      const adicional = adicionalPorVariante.get(Number(item.variante_id)) ?? 0;
      return { ...item, precio_unitario: roundMoney(precioBase + adicional) };
    });

    const bajoMoq: { producto_id: number; moq: number; cantidad: number }[] = [];
    for (const item of lineasConPrecio) {
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

    const totalUnidades = lineasConPrecio.reduce((acc, i) => acc + Number(i.cantidad), 0);
    const moqAplicado = productos.length
      ? Math.max(...productos.map((p) => p.moq))
      : 400;

    // CUS_27 — descuento por escala leído desde la matriz de reglas_descuento,
    // aplicado y calculado formalmente sobre el pedido (no es libre/manual).
    const descuento = await calcularDescuentosEscalaAutomaticos(
      lineasConPrecio.map((i) => ({
        producto_id: i.producto_id,
        cantidad: Number(i.cantidad),
        precio_unitario: i.precio_unitario,
      })),
      { costoEnvio, moq: moqAplicado },
    );
    const detallePorProducto = new Map(
      descuento.detallePorProducto.map((d) => [d.producto_id, d]),
    );
    const subtotalBruto = descuento.subtotalBruto;
    const igv = descuento.igv;
    const total = descuento.total;

    if (reservar_stock) {
      for (const item of lineasConPrecio) {
        const check = await stockDisponibleVariante(
          BigInt(item.variante_id),
          Number(item.cantidad),
        );
        if (!check.ok) {
          return NextResponse.json(
            {
              success: false,
              error: 'stock_insuficiente',
              mensaje: `Stock insuficiente en variante ${item.variante_id}`,
              disponible: check.disponible,
            },
            { status: 409 },
          );
        }
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedidos.create({
        data: {
          cliente_id: sesion.cliente_id,
          created_by: sesion.usuario_id,
          estado: 'pendiente',
          subtotal: new Prisma.Decimal(subtotalBruto),
          igv: new Prisma.Decimal(igv),
          total: new Prisma.Decimal(total),
          total_estimado: new Prisma.Decimal(total),
          monto_descuento: new Prisma.Decimal(descuento.montoDescuento),
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
            create: lineasConPrecio.map((item) => {
              const detalle = detallePorProducto.get(String(item.producto_id));
              const porcentajeDescuento = detalle?.porcentaje_descuento ?? 0;
              const montoDescuentoLinea = roundMoney(
                multiplyMoney(item.precio_unitario, item.cantidad) * (porcentajeDescuento / 100),
              );
              return {
                producto_id: BigInt(item.producto_id),
                variante_id: BigInt(item.variante_id),
                cantidad: Number(item.cantidad),
                especificaciones: {
                  precio_unitario: item.precio_unitario,
                  descuento_porcentaje: porcentajeDescuento,
                  descuento_monto: montoDescuentoLinea,
                  descuento_regla_id: detalle?.regla_id ?? null,
                },
              };
            }),
          },
        },
        include: { pedido_items: true },
      });

      // reservar_stock omitido al confirmar: el descuento inmediato hace redundante
      // la reserva y el trigger de reservas_stock falla (referencia_id en movimientos_inventario).

      for (const item of lineasConPrecio) {
        await descontarStockLineaPedido(tx, {
          producto_id: item.producto_id,
          variante_id: item.variante_id,
          cantidad: Number(item.cantidad),
        });
      }

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
