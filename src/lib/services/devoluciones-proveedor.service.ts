import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import {
  DEV_PROV_MATERIAL_MOTIVO_PREFIX,
  TRANSICIONES_DEVOLUCION_PROV,
} from '@/lib/constants/devoluciones-proveedor';
import type {
  ActualizarEstadoDevolucionProveedorInput,
  CrearDevolucionProveedorInput,
} from '@/lib/schemas/devoluciones-proveedor';
import { EstadoDevolucionProv, Prisma } from '@prisma/client';

export class DevolucionProveedorError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'DevolucionProveedorError';
    this.code = code;
    this.status = status;
  }
}

export interface ListarDevolucionesProveedorParams {
  estado?: EstadoDevolucionProv;
  proveedor_id?: number;
  busqueda?: string;
}

const includeListado = {
  proveedores: { select: { id: true, razon_social: true, ruc: true } },
  insumo: {
    select: { id: true, nombre: true, unidad_medida: true, stock_actual: true },
  },
} satisfies Prisma.devoluciones_proveedorInclude;

function buildMaterialMotivo(
  proveedorId: bigint,
  motivo: string,
  observaciones?: string,
) {
  const extra = observaciones?.trim() ? ` | ${observaciones.trim()}` : '';
  return `${DEV_PROV_MATERIAL_MOTIVO_PREFIX} proveedor=${proveedorId} motivo=${motivo}${extra}`;
}

function parseMaterialMotivo(motivo: string) {
  const match = motivo.match(
    /^\[DEV_PROV_MAT\] proveedor=(\d+) motivo=([a-z_]+)(?:\s\|\s(.+))?$/,
  );
  if (!match) return null;
  return {
    proveedor_id: BigInt(match[1]),
    motivo: match[2],
    observaciones: match[3] ?? null,
  };
}

async function aplicarSalidaInsumo(
  tx: Prisma.TransactionClient,
  insumoId: bigint,
  cantidad: number,
  motivoMovimiento: string,
  usuarioId?: bigint,
) {
  const insumo = await tx.insumo.findUniqueOrThrow({ where: { id: insumoId } });
  const stockAnterior = Number(insumo.stock_actual);

  if (cantidad > stockAnterior) {
    throw new DevolucionProveedorError(
      `Stock insuficiente. Disponible: ${stockAnterior}`,
      'STOCK_INSUFICIENTE',
      422,
    );
  }

  const nuevoStock = stockAnterior - cantidad;

  await tx.insumo.update({
    where: { id: insumoId },
    data: { stock_actual: nuevoStock.toString(), updated_at: new Date() },
  });

  await tx.movimientos_inventario.create({
    data: {
      insumo_id: insumoId,
      cantidad,
      motivo: motivoMovimiento,
      tipo_movimiento: 'devolucion_a_proveedor',
      referencia_tipo: 'DEVOLUCION',
      usuario_id: usuarioId ?? null,
    },
  });
}

async function aplicarSalidaMaterial(
  tx: Prisma.TransactionClient,
  materialId: bigint,
  cantidad: number,
  motivoMovimiento: string,
  usuarioId?: bigint,
) {
  const material = await tx.materiales.findUniqueOrThrow({ where: { id: materialId } });
  const stockAnterior = Number(material.stock_actual ?? 0);

  if (cantidad > stockAnterior) {
    throw new DevolucionProveedorError(
      `Stock insuficiente. Disponible: ${stockAnterior}`,
      'STOCK_INSUFICIENTE',
      422,
    );
  }

  const nuevoStock = stockAnterior - cantidad;

  await tx.materiales.update({
    where: { id: materialId },
    data: { stock_actual: nuevoStock, updated_at: new Date() },
  });

  await tx.movimientos_inventario.create({
    data: {
      material_id: materialId,
      cantidad,
      motivo: motivoMovimiento,
      tipo_movimiento: 'devolucion_a_proveedor',
      referencia_tipo: 'DEVOLUCION',
      usuario_id: usuarioId ?? null,
    },
  });
}

export const DevolucionesProveedorService = {
  async listar(params?: ListarDevolucionesProveedorParams) {
    const where: Prisma.devoluciones_proveedorWhereInput = {
      ...(params?.estado && { estado: params.estado }),
      ...(params?.proveedor_id && { proveedor_id: BigInt(params.proveedor_id) }),
    };

    const [rows, movimientosMaterial] = await Promise.all([
      prisma.devoluciones_proveedor.findMany({
        where,
        include: includeListado,
        orderBy: { created_at: 'desc' },
      }),
      prisma.movimientos_inventario.findMany({
        where: {
          tipo_movimiento: 'devolucion_a_proveedor',
          material_id: { not: null },
          motivo: { startsWith: DEV_PROV_MATERIAL_MOTIVO_PREFIX },
        },
        include: {
          materiales: {
            select: { id: true, nombre: true, unidad_medida: true, stock_actual: true, proveedor_id: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 200,
      }),
    ]);

    let resultado = [
      ...rows.map((row) => ({
        ...serializeBigInt(row),
        tipo_recurso: 'insumo' as const,
        material_id: null,
      })),
      ...(await Promise.all(
        movimientosMaterial
          .filter((mov) => {
            if (!params?.proveedor_id) return true;
            const parsed = parseMaterialMotivo(mov.motivo);
            const provId = parsed?.proveedor_id ?? mov.materiales?.proveedor_id;
            return Number(provId) === params.proveedor_id;
          })
          .map(async (mov) => {
            const parsed = parseMaterialMotivo(mov.motivo);
            const proveedorId = parsed?.proveedor_id ?? mov.materiales?.proveedor_id;
            const proveedor = proveedorId
              ? await prisma.proveedores.findUnique({
                where: { id: proveedorId },
                select: { id: true, razon_social: true, ruc: true },
              })
              : null;

            return serializeBigInt({
              id: `mov-${mov.id}`,
              tipo_recurso: 'material' as const,
              proveedor_id: proveedorId,
              material_id: mov.material_id,
              insumo_id: null,
              orden_id: null,
              cantidad: mov.cantidad,
              motivo: parsed?.motivo ?? 'otros',
              estado: 'completado',
              accion_requerida: null,
              monto_estimado_recuperar: null,
              fecha_salida: null,
              numero_guia_remision: null,
              observaciones: parsed?.observaciones,
              created_at: mov.created_at,
              updated_at: mov.created_at,
              proveedores: proveedor,
              insumo: null,
              material: mov.materiales,
            });
          }),
      )),
    ] as Record<string, unknown>[];

    resultado.sort((a, b) => {
      const da = new Date(String(a.created_at ?? 0)).getTime();
      const db = new Date(String(b.created_at ?? 0)).getTime();
      return db - da;
    });

    if (params?.busqueda?.trim()) {
      const q = params.busqueda.trim().toLowerCase();
      resultado = resultado.filter((row) => {
        const proveedor = row.proveedores as Record<string, unknown> | undefined;
        const insumo = row.insumo as Record<string, unknown> | undefined;
        const material = row.material as Record<string, unknown> | undefined;
        const texto = [
          row.id,
          row.proveedor_id,
          proveedor?.razon_social,
          insumo?.nombre,
          material?.nombre,
          row.motivo,
          row.estado,
        ]
          .join(' ')
          .toLowerCase();
        return texto.includes(q);
      });
    }

    if (params?.estado && params.estado !== 'completado') {
      resultado = resultado.filter((row) => row.estado === params.estado);
    }

    return resultado;
  },

  async obtenerPorId(id: string | number) {
    const idStr = String(id);
    if (idStr.startsWith('mov-')) {
      const movId = idStr.replace('mov-', '');
      const mov = await prisma.movimientos_inventario.findUnique({
        where: { id: BigInt(movId) },
        include: {
          materiales: {
            select: {
              id: true,
              nombre: true,
              unidad_medida: true,
              stock_actual: true,
              proveedor_id: true,
            },
          },
        },
      });
      if (!mov?.material_id) return null;

      const parsed = parseMaterialMotivo(mov.motivo);
      const proveedor = parsed?.proveedor_id
        ? await prisma.proveedores.findUnique({
          where: { id: parsed.proveedor_id },
          select: { id: true, razon_social: true, ruc: true },
        })
        : null;

      return serializeBigInt({
        id: `mov-${mov.id}`,
        tipo_recurso: 'material',
        proveedor_id: parsed?.proveedor_id ?? mov.materiales?.proveedor_id,
        material_id: mov.material_id,
        insumo_id: null,
        orden_id: null,
        cantidad: mov.cantidad,
        motivo: parsed?.motivo ?? 'otros',
        estado: 'completado',
        observaciones: parsed?.observaciones,
        created_at: mov.created_at,
        updated_at: mov.created_at,
        proveedores: proveedor,
        insumo: null,
        material: mov.materiales,
      });
    }

    const row = await prisma.devoluciones_proveedor.findUnique({
      where: { id: BigInt(id) },
      include: {
        ...includeListado,
        usuarios: { select: { id: true, email: true } },
      },
    });

    return row
      ? serializeBigInt({ ...row, tipo_recurso: 'insumo', material_id: null })
      : null;
  },

  async crear(input: CrearDevolucionProveedorInput, usuarioId?: number) {
    const proveedorId = BigInt(input.proveedor_id);
    const cantidad = Number(input.cantidad);
    const usuarioBigInt = usuarioId ? BigInt(usuarioId) : undefined;

    const proveedor = await prisma.proveedores.findUnique({
      where: { id: proveedorId },
      select: { id: true, estado: true, razon_social: true },
    });

    if (!proveedor) {
      throw new DevolucionProveedorError('Proveedor no encontrado', 'PROVEEDOR_NO_ENCONTRADO', 404);
    }

    if (proveedor.estado !== 'activo') {
      throw new DevolucionProveedorError('El proveedor no está activo', 'PROVEEDOR_INACTIVO', 422);
    }

    if (input.orden_id) {
      const orden = await prisma.ordenes_compra.findFirst({
        where: { id: BigInt(input.orden_id), proveedor_id: proveedorId },
        select: { id: true },
      });
      if (!orden) {
        throw new DevolucionProveedorError(
          'La orden de compra no pertenece al proveedor',
          'ORDEN_INVALIDA',
          422,
        );
      }
    }

    if (input.tipo_recurso === 'insumo') {
      const insumoId = BigInt(input.insumo_id);
      const insumo = await prisma.insumo.findUnique({
        where: { id: insumoId },
        select: { id: true, nombre: true, proveedor_id: true },
      });

      if (!insumo) {
        throw new DevolucionProveedorError('Insumo no encontrado', 'INSUMO_NO_ENCONTRADO', 404);
      }

      if (insumo.proveedor_id && insumo.proveedor_id !== proveedorId) {
        throw new DevolucionProveedorError(
          'El insumo no pertenece al proveedor seleccionado',
          'INSUMO_PROVEEDOR_INVALIDO',
          422,
        );
      }

      const motivoMov = `Devolución a proveedor ${proveedor.razon_social}: ${input.motivo}`;

      const created = await prisma.$transaction(async (tx) => {
        const devolucion = await tx.devoluciones_proveedor.create({
          data: {
            proveedor_id: proveedorId,
            insumo_id: insumoId,
            orden_id: input.orden_id ? BigInt(input.orden_id) : null,
            cantidad,
            motivo: input.motivo,
            estado: EstadoDevolucionProv.pendiente_envio,
            accion_requerida: input.accion_requerida ?? null,
            monto_estimado_recuperar: input.monto_estimado_recuperar ?? null,
            observaciones: input.observaciones ?? null,
            usuario_id: usuarioBigInt ?? null,
            fotos_evidencia: [],
          },
        });

        await aplicarSalidaInsumo(
          tx,
          insumoId,
          cantidad,
          `${motivoMov} (#${devolucion.id})`,
          usuarioBigInt,
        );

        return devolucion;
      });

      const full = await prisma.devoluciones_proveedor.findUnique({
        where: { id: created.id },
        include: includeListado,
      });

      return serializeBigInt({ ...full, tipo_recurso: 'insumo', material_id: null });
    }

    const materialId = BigInt(input.material_id);
    const material = await prisma.materiales.findUnique({
      where: { id: materialId },
      select: { id: true, nombre: true, proveedor_id: true },
    });

    if (!material) {
      throw new DevolucionProveedorError('Material no encontrado', 'MATERIAL_NO_ENCONTRADO', 404);
    }

    if (material.proveedor_id && material.proveedor_id !== proveedorId) {
      throw new DevolucionProveedorError(
        'El material no pertenece al proveedor seleccionado',
        'MATERIAL_PROVEEDOR_INVALIDO',
        422,
      );
    }

    const movimiento = await prisma.$transaction(async (tx) => {
      const motivoMov = buildMaterialMotivo(proveedorId, input.motivo, input.observaciones);
      await aplicarSalidaMaterial(tx, materialId, cantidad, motivoMov, usuarioBigInt);

      return tx.movimientos_inventario.findFirst({
        where: {
          material_id: materialId,
          tipo_movimiento: 'devolucion_a_proveedor',
          motivo: motivoMov,
        },
        orderBy: { created_at: 'desc' },
        include: {
          materiales: {
            select: { id: true, nombre: true, unidad_medida: true, stock_actual: true },
          },
        },
      });
    });

    if (!movimiento) {
      throw new DevolucionProveedorError('No se pudo registrar la devolución', 'ERROR_REGISTRO', 500);
    }

    const proveedorFull = await prisma.proveedores.findUnique({
      where: { id: proveedorId },
      select: { id: true, razon_social: true, ruc: true },
    });

    return serializeBigInt({
      id: `mov-${movimiento.id}`,
      tipo_recurso: 'material',
      proveedor_id: proveedorId,
      material_id: materialId,
      insumo_id: null,
      orden_id: input.orden_id ?? null,
      cantidad,
      motivo: input.motivo,
      estado: 'completado',
      accion_requerida: input.accion_requerida ?? null,
      monto_estimado_recuperar: input.monto_estimado_recuperar ?? null,
      observaciones: input.observaciones ?? null,
      created_at: movimiento.created_at,
      proveedores: proveedorFull,
      insumo: null,
      material: movimiento.materiales,
    });
  },

  async actualizarEstado(
    id: string | number,
    input: ActualizarEstadoDevolucionProveedorInput,
    usuarioId?: number,
  ) {
    const idStr = String(id);
    if (idStr.startsWith('mov-')) {
      throw new DevolucionProveedorError(
        'Las devoluciones de material no admiten cambio de estado',
        'TIPO_NO_EDITABLE',
        422,
      );
    }

    const actual = await prisma.devoluciones_proveedor.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, estado: true, observaciones: true },
    });

    if (!actual) {
      throw new DevolucionProveedorError('Devolución no encontrada', 'NO_ENCONTRADA', 404);
    }

    const permitidos = TRANSICIONES_DEVOLUCION_PROV[actual.estado] ?? [];
    if (!permitidos.includes(input.estado)) {
      throw new DevolucionProveedorError(
        `No se puede pasar de "${actual.estado}" a "${input.estado}"`,
        'TRANSICION_INVALIDA',
        422,
      );
    }

    if (input.estado === EstadoDevolucionProv.en_transito && !input.numero_guia_remision?.trim()) {
      throw new DevolucionProveedorError(
        'Indica el número de guía de remisión para marcar en tránsito',
        'GUIA_REQUERIDA',
        422,
      );
    }

    const observaciones =
      input.observaciones !== undefined
        ? input.observaciones
        : actual.observaciones;

    const updated = await prisma.devoluciones_proveedor.update({
      where: { id: BigInt(id) },
      data: {
        estado: input.estado,
        ...(input.estado === EstadoDevolucionProv.en_transito && {
          fecha_salida: new Date(),
          numero_guia_remision: input.numero_guia_remision?.trim() ?? null,
        }),
        ...(observaciones !== undefined && { observaciones }),
        ...(usuarioId && { usuario_id: BigInt(usuarioId) }),
        updated_at: new Date(),
      },
      include: includeListado,
    });

    return serializeBigInt({ ...updated, tipo_recurso: 'insumo', material_id: null });
  },
};

export function isDevolucionProveedorError(error: unknown): error is DevolucionProveedorError {
  return error instanceof DevolucionProveedorError;
}
