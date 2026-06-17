import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';
// 📦 Única importación transaccional para auditoría e historial del kárdex
import { MovimientosInventarioService } from './movimientos-inventario.service';

export const OrdenesProduccionService = {

  async listar(params?: {
    producto_id?: string;
    taller_id?: string;
    pedido_id?: string;
    estado?: string | string[];
    etapa?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { producto_id, taller_id, pedido_id, estado, etapa, search, page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ordenes_produccionWhereInput = {};

    if (producto_id) where.producto_id = BigInt(producto_id);
    if (taller_id) where.taller_id = BigInt(taller_id);

    if (estado && estado !== 'todos' && estado !== 'all') {
      if (Array.isArray(estado)) {
        where.estado = { in: estado } as Prisma.ordenes_produccionWhereInput['estado'];
      } else {
        where.estado = estado as Prisma.ordenes_produccionWhereInput['estado'];
      }
    }

    if (pedido_id) where.pedido_id = BigInt(pedido_id);

    if (etapa && etapa !== 'all') {
      where.seguimiento_produccion = {
        some: {
          etapa: etapa as Prisma.seguimiento_produccionWhereInput['etapa'],
          activo: true,
        },
      };
    }

    if (search) {
      where.OR = [
        { productos: { nombre: { contains: search, mode: 'insensitive' } } },
        { talleres: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
      if (!isNaN(Number(search))) {
        where.OR.push({ id: BigInt(search) });
      }
    }

    const [total, ordenes] = await Promise.all([
      prisma.ordenes_produccion.count({ where }),
      prisma.ordenes_produccion.findMany({
        where,
        take: limit,
        skip,
        include: {
          productos: { select: { id: true, nombre: true, sku: true } },
          talleres: { select: { id: true, nombre: true, email: true, contacto: true } },
          fichas_tecnicas: { select: { id: true, version: true, estado: true } },
          seguimiento_produccion: {
            where: { activo: true },
            take: 1,
            orderBy: { created_at: 'desc' },
          },
          confecciones: {
            select: { id: true, estado: true, taller_id: true, cantidad: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      data: serializeBigInt(ordenes),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async obtenerPorId(id: string) {
    const orden = await prisma.ordenes_produccion.findUnique({
      where: { id: BigInt(id) },
      include: {
        productos: { select: { id: true, nombre: true, sku: true, imagen: true } },
        talleres: { select: { id: true, nombre: true, email: true, contacto: true, telefono: true } },
        fichas_tecnicas: true,
        pedidos: {
          select: {
            id: true,
            estado: true,
            clientes: { select: { id: true, razon_social: true } },
          },
        },
        seguimiento_produccion: { orderBy: { created_at: 'desc' } },
        confecciones: {
          include: {
            talleres: { select: { id: true, nombre: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });
    return orden ? serializeBigInt(orden) : null;
  },

  async crear(data: {
    producto_id: string | number;
    taller_id: string | number;
    ficha_id: string | number;
    pedido_id: string | number;
    cantidad_solicitada: number;
    fecha_entrega?: string;
    notas?: string;
    creado_por?: string | number;
  }) {
    return prisma.$transaction(async (tx) => {
      const orden = await tx.ordenes_produccion.create({
        data: {
          producto_id: BigInt(data.producto_id),
          taller_id: BigInt(data.taller_id),
          ficha_id: BigInt(data.ficha_id),
          pedido_id: BigInt(data.pedido_id),
          cantidad_solicitada: data.cantidad_solicitada,
          fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
          notas: data.notas ?? null,
          creado_por: data.creado_por ? BigInt(data.creado_por) : null,
          estado: 'borrador',
          etapa: 'corte',
        },
        include: {
          productos: { select: { id: true, nombre: true, sku: true } },
          talleres: { select: { id: true, nombre: true, email: true } },
          fichas_tecnicas: { select: { id: true, version: true } },
        },
      });

      await tx.seguimiento_produccion.create({
        data: {
          orden_id: orden.id,
          etapa: 'corte',
          observaciones: 'Orden creada — pendiente de inicio',
          activo: true,
        },
      });

      return serializeBigInt(orden);
    });
  },

  async actualizar(id: string, data: {
    fecha_entrega?: string;
    notas?: string;
    taller_id?: string;
  }) {
    const orden = await prisma.ordenes_produccion.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.fecha_entrega !== undefined && { fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null }),
        ...(data.notas !== undefined && { notas: data.notas }),
        ...(data.taller_id !== undefined && { taller_id: BigInt(data.taller_id) }),
        updated_at: new Date(),
      },
    });
    return serializeBigInt(orden);
  },

  async registrarEtapa(data: {
    orden_id: string;
    etapa: string;
    observaciones?: string;
    usuario_id?: string;
  }) {
    const idOrden = BigInt(data.orden_id);

    return prisma.$transaction(async (tx) => {
      // 1. Obtener la información base de la Orden de Producción incluyendo su Ficha Técnica
      const ordenActual = await tx.ordenes_produccion.findUnique({
        where: { id: idOrden },
        include: {
          fichas_tecnicas: {
            include: {
              fichas_tecnicas_detalle: true
            }
          }
        }
      });

      if (!ordenActual) throw new Error('Orden de producción no encontrada');

      // 2. Desactivar etapa anterior en el historial de seguimiento
      await tx.seguimiento_produccion.updateMany({
        where: { orden_id: idOrden, activo: true },
        data: { activo: false, completado_en: new Date() },
      });

      // 3. Crear el nuevo registro de seguimiento histórico
      const seg = await tx.seguimiento_produccion.create({
        data: {
          orden_id: idOrden,
          etapa: data.etapa as Prisma.seguimiento_produccionCreateInput['etapa'],
          observaciones: data.observaciones ?? null,
          usuario_id: data.usuario_id ? BigInt(data.usuario_id) : null,
          activo: true,
        },
      });

      // 4. ACTUALIZACIÓN DIRECTA EN LA ORDEN: Sincroniza la columna 'etapa' física del DDL
      await tx.ordenes_produccion.update({
        where: { id: idOrden },
        data: {
          etapa: data.etapa as Prisma.ordenes_produccionUpdateInput['etapa'],
          updated_at: new Date(),
        }
      });

      // 5. DISPARADOR AUTOMÁTICO A: Consumo de materia prima al pasar a 'confeccion'
      if (data.etapa === 'confeccion') {
        const itemsFicha = ordenActual.fichas_tecnicas?.fichas_tecnicas_detalle || [];

        for (const item of itemsFicha) {
          // Multiplica la cantidad requerida en la ficha por el número de prendas solicitadas
          const consumoTotal = Number((item as any).cantidad_requerida || 0) * ordenActual.cantidad_solicitada;

          if (consumoTotal > 0) {
            await MovimientosInventarioService.registrar({
              cantidad: consumoTotal,
              tipo_movimiento: 'consumo_orden_produccion',
              referencia_tipo: 'ORDEN_PRODUCCION',
              referencia_id: Number(idOrden),
              motivo: `Consumo automático por avance a confección de la OP #${idOrden}`,
              usuario_id: data.usuario_id ? String(data.usuario_id) : undefined,
              // Envía el recurso correcto respetando la restricción de recurso único
              ...((item as any).insumo_id && { insumo_id: String((item as any).insumo_id) }),
              ...((item as any).material_id && { material_id: String((item as any).material_id) }),
            });
          }
        }
      }

      // 6. DISPARADOR AUTOMÁTICO B: Ingreso de Producto Terminado al marcar como 'completada'
      if (data.etapa === 'completada') {
        await tx.ordenes_produccion.update({
          where: { id: idOrden },
          data: {
            estado: 'completada',
            updated_at: new Date()
          },
        });

        // Suma de forma automática las prendas listas al stock de productos mediante el pipeline transaccional
        await MovimientosInventarioService.registrar({
          producto_id: String(ordenActual.producto_id),
          cantidad: ordenActual.cantidad_solicitada,
          tipo_movimiento: 'produccion_entrada',
          referencia_tipo: 'ORDEN_PRODUCCION',
          motivo: `Ingreso automático de prendas terminadas desde taller. OP #${idOrden}`,
          usuario_id: data.usuario_id ? String(data.usuario_id) : undefined,
        });
      }

      return serializeBigInt(seg);
    });
  },
};