'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireServerAuth } from '@/lib/auth/server';
import { serializePrismaPayload } from '@/lib/serializers';
import { ORIGEN_COTIZACION_SOLICITUD } from '@/lib/constants/portal-b2b';
import type {
  CategoriaCotizar,
  ItemSolicitudCotizacionInput,
  ProductoParaCotizar,
} from './nueva/types';
import { Prisma, EstadoCotizacion } from '@prisma/client';

function generarNumeroPedido(id: number): string {
  const now = new Date();
  const YY = String(now.getFullYear()).slice(2);
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  return `PED-${YY}${MM}${DD}-${String(id).padStart(4, '0')}`;
}

function normalizarImagen(img: string | null | undefined): string | null {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return img;
  return `${base}/storage/v1/object/public/productos/${img}`;
}

function generarNumeroCotizacion(id: number): string {
  const now = new Date();
  const YY = String(now.getFullYear()).slice(2);
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const Min = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  return `COT-${YY}${MM}${DD}-${HH}${Min}${SS}-${id}`;
}

function calcularTotalesSolicitud(
  items: { precio_unitario: number; cantidad: number }[],
) {
  const subtotalBruto = items.reduce(
    (acc, i) => acc + i.precio_unitario * i.cantidad,
    0,
  );
  const igv = subtotalBruto * 0.18;
  return {
    subtotalBruto,
    igv,
    total: subtotalBruto + igv,
  };
}

async function obtenerClienteIdUsuario() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error as string };
  }

  const cliente = await prisma.clientes.findFirst({
    where: { usuario_id: BigInt(auth.user.id) },
    select: { id: true, estado: true },
  });

  if (!cliente) {
    return { error: 'cliente_no_encontrado' };
  }

  if (cliente.estado !== 'activo') {
    return { error: 'cliente_inactivo' };
  }

  return { clienteId: cliente.id };
}

/*
 * Convierte una cotización en un pedido
 * 
 * @param cotizacionId - ID de la cotización a convertir
 * @returns Promise<{ success: boolean; numeroPedido?: string; error?: string }>
 */
export async function convertirCotizacionAPedido(cotizacionId: number) {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { success: false, error: 'No autenticado' };
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener la cotización con sus ítems asociados
      const cotizacion = await tx.cotizaciones.findUnique({
        where: { id: BigInt(cotizacionId) },
        include: { cotizacion_items: true },
      });

      if (!cotizacion) {
        throw new Error('La cotización especificada no existe.');
      }

      // Verificación estricta mediante el enum real de tu base de datos
      if (cotizacion.estado === EstadoCotizacion.convertida) {
        throw new Error('Esta cotización ya fue convertida en un pedido anteriormente.');
      }

      // Calcular la cantidad total de unidades para cumplir con la columna 'total_unidades' de pedidos
      const totalUnidades = cotizacion.cotizacion_items.reduce(
        (acc, item) => acc + Number(item.cantidad),
        0
      );

      // Normalización estricta de tipos Decimal para las columnas NOT NULL de tu tabla 'pedidos'
      const subtotalBase = cotizacion.subtotal ?? new Prisma.Decimal(0);
      const igvBase = cotizacion.igv ?? new Prisma.Decimal(0);
      const descuentoBase = cotizacion.monto_descuento ?? new Prisma.Decimal(0);
      const envioBase = cotizacion.costo_envio ?? new Prisma.Decimal(0);
      const totalBase = cotizacion.total ?? new Prisma.Decimal(0);

      // 2. Crear el registro en la tabla 'pedidos'
      const nuevoPedido = await tx.pedidos.create({
        data: {
          cliente_id: cotizacion.cliente_id,
          cotizacion_id: cotizacion.id,
          estado: 'pendiente', // public.EstadoPedido
          prioridad: 'normal',   // public.PrioridadPedido
          subtotal: subtotalBase,
          igv: igvBase,
          monto_descuento: descuentoBase,
          costo_envio: envioBase,
          total: totalBase,
          total_estimado: totalBase,
          total_unidades: totalUnidades,
          moq_aplicado: 400,
          moneda: cotizacion.moneda ?? 'PEN',
          direccion_despacho: cotizacion.direccion_despacho,
          zona_envio_id: cotizacion.zona_envio_id,
          monto_pagado: new Prisma.Decimal(0),
          saldo_pendiente: totalBase,
          notas_pedido: cotizacion.notas_internas ?? 'Generado automáticamente desde Cotización.',
        },
      });

      // 3. Registrar las líneas logísticas en 'pedido_items' y decrementar stock en paralelo
      for (const item of cotizacion.cotizacion_items) {

        await tx.pedido_items.create({
          data: {
            pedido_id: nuevoPedido.id,
            producto_id: item.producto_id,
            variante_id: item.variante_id,
            cantidad: Number(item.cantidad),
            especificaciones: {
              color_snapshot: item.color_snapshot,
              talla_snapshot: item.talla_snapshot,
              precio_congelado: item.precio_unitario_snapshot ? Number(item.precio_unitario_snapshot) : 0
            } as Prisma.InputJsonValue,
          },
        });

        // Modificar stock real de la variante seleccionada
        if (item.variante_id) {
          await tx.variantes_producto.update({
            where: { id: item.variante_id },
            data: {
              stock: {
                decrement: Number(item.cantidad),
              },
            },
          });
        }
      }

      // 4. Cambiar el estado de la cotización original a 'convertida'
      await tx.cotizaciones.update({
        where: { id: cotizacion.id },
        data: { estado: EstadoCotizacion.convertida },
      });

      return { pedidoId: Number(nuevoPedido.id) };
    });

    // Revalidar cachés logísticas y comerciales de Next.js
    revalidatePath('/portal/cotizaciones');
    revalidatePath(`/portal/cotizaciones/${cotizacionId}`);
    revalidatePath('/portal/pedidos');

    return { success: true, pedidoId: resultado.pedidoId };
  } catch (error) {
    console.error('[CONVERT_COTIZACION_ERROR]:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno al procesar el pedido corporativo.',
    };
  }
}

/**
 * Obtiene los productos, variantes y categorías disponibles para cotizar
 */
export async function obtenerProductosParaCotizar(): Promise<
  | { success: true; productos: ProductoParaCotizar[]; categorias: CategoriaCotizar[] }
  | { success: false; error: string }
> {
  const sesion = await obtenerClienteIdUsuario();
  if ('error' in sesion) {
    return { success: false, error: sesion.error as string };
  }

  const [productosRaw, categoriasRaw] = await Promise.all([
    prisma.productos.findMany({
      where: { estado: 'activo' },
      include: {
        categorias: { select: { id: true, nombre: true } },
        variantes_producto: {
          where: { estado: 'activo' },
          select: {
            id: true,
            color: true,
            talla: true,
            stock: true,
            precio_adicional: true,
            sku: true,
          },
          orderBy: [{ talla: 'asc' }, { color: 'asc' }],
        },
      },
      orderBy: { nombre: 'asc' },
      take: 200,
    }),
    prisma.categorias.findMany({
      where: { activo: { not: false } },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
  ]);

  const productos: ProductoParaCotizar[] = productosRaw
    .filter((p) => p.variantes_producto.length > 0)
    .map((p) => ({
      id: Number(p.id),
      nombre: p.nombre,
      sku: p.sku,
      moq: Number(p.moq),
      precio: Number(p.precio),
      stock: p.stock,
      imagen: normalizarImagen(p.imagen),
      descripcion: p.descripcion,
      categoria: p.categorias
        ? { id: Number(p.categorias.id), nombre: p.categorias.nombre }
        : null,
      variantes: p.variantes_producto.map((v) => ({
        id: Number(v.id),
        color: v.color,
        talla: v.talla,
        stock: v.stock,
        precio_adicional: Number(v.precio_adicional),
        sku: v.sku,
      })),
    }));

  const categorias: CategoriaCotizar[] = categoriasRaw.map((c) => ({
    id: Number(c.id),
    nombre: c.nombre,
  }));

  return serializePrismaPayload({
    success: true as const,
    productos,
    categorias,
  });
}

/**
 * Registra formalmente la solicitud de cotización con precios propuestos e indicaciones
 */
export async function crearSolicitudCotizacion(input: {
  mensaje: string;
  items: ItemSolicitudCotizacionInput[];
}): Promise<
  | { success: true; id: number; numero: string }
  | { success: false; error: string }
> {
  const sesion = await obtenerClienteIdUsuario();
  if ('error' in sesion) {
    return { success: false, error: sesion.error as string };
  }

  const mensaje = input.mensaje?.trim() ?? '';
  if (!mensaje) {
    return { success: false, error: 'mensaje_requerido' };
  }

  const items = input.items ?? [];
  if (items.length === 0) {
    return { success: false, error: 'items_requeridos' };
  }

  for (const item of items) {
    if (!item.variante_id || item.cantidad < 1) {
      return { success: false, error: 'item_invalido' };
    }
  }

  const totales = calcularTotalesSolicitud(items);
  const validaHasta = new Date();
  validaHasta.setDate(validaHasta.getDate() + 7);

  try {
    const cotizacion = await prisma.$transaction(async (tx) => {
      const nueva = await tx.cotizaciones.create({
        data: {
          numero: 'PENDIENTE',
          cliente_id: sesion.clienteId,
          estado: 'enviada',
          origen: ORIGEN_COTIZACION_SOLICITUD,
          subtotal: new Prisma.Decimal(totales.subtotalBruto),
          igv: new Prisma.Decimal(totales.igv),
          total: new Prisma.Decimal(totales.total),
          valida_hasta: validaHasta,
          expira_at: validaHasta,
          monto_descuento: new Prisma.Decimal(0),
          costo_envio: new Prisma.Decimal(0),
          costo_total_estimado: new Prisma.Decimal(totales.total),
          moneda: 'PEN',
          notas_internas: mensaje,
          cotizacion_items: {
            create: items.map((item) => ({
              producto_id: BigInt(item.producto_id),
              variante_id: BigInt(item.variante_id),
              cantidad: Number(item.cantidad),
              precio_unitario_snapshot: new Prisma.Decimal(item.precio_unitario),
              subtotal: new Prisma.Decimal(
                item.cantidad * item.precio_unitario,
              ),
              color_snapshot: item.color_snapshot,
              talla_snapshot: item.talla_snapshot,
            })),
          },
        },
      });

      const numero = generarNumeroCotizacion(Number(nueva.id));
      return tx.cotizaciones.update({
        where: { id: nueva.id },
        data: { numero },
        select: { id: true, numero: true },
      });
    });

    revalidatePath('/portal/cotizaciones');

    return {
      success: true,
      id: Number(cotizacion.id),
      numero: cotizacion.numero,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error al crear la solicitud';
    console.error('[Portal] crearSolicitudCotizacion:', err);
    return { success: false, error: message };
  }
}