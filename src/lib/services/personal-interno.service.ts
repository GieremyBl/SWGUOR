import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { Cargo, EstadoPersonal } from '@prisma/client';
import { Prisma } from '@prisma/client';

type Serialize<T> = {
  [K in keyof T]: T[K] extends bigint
  ? string
  : T[K] extends bigint | null
  ? string | null
  : T[K] extends object
  ? Serialize<T[K]>
  : T[K];
};

export type PersonalRow = Serialize<Awaited<ReturnType<typeof PersonalInternoService.listar>>[number]>;

export const PersonalInternoService = {

  // ── Listar ──────────────────────────────────────────────────
  async listar(params?: { cargo?: string; estado?: string; busqueda?: string }) {
    // FIX: Tipado estricto con el contrato WhereInput nativo de Prisma
    const where: Prisma.personal_internoWhereInput = {};

    if (params?.cargo) {
      where.cargo = params.cargo as Cargo;
    }

    if (params?.estado && params.estado !== '') {
      where.estado = params.estado as EstadoPersonal;
    }

    if (params?.busqueda) {
      where.OR = [
        { nombre_completo: { contains: params.busqueda, mode: 'insensitive' } },
        { usuarios: { email: { contains: params.busqueda, mode: 'insensitive' } } },
      ];
    }

    const personal = await prisma.personal_interno.findMany({
      where,
      include: {
        usuarios: {
          select: { id: true, email: true, estado: true, rol: true, ultimo_acceso: true },
        },
      },
      orderBy: { nombre_completo: 'asc' },
    });

    return serializeBigInt(personal);
  },

  // ── Crear colaborador vinculando usuario existente ──────────
  async crear(data: {
    usuario_id: string;
    nombre_completo: string;
    cargo: string;
    dni?: number;
    telefono?: number;
    fecha_ingreso?: string;
  }) {
    const personal = await prisma.personal_interno.create({
      data: {
        usuario_id: BigInt(data.usuario_id),
        nombre_completo: data.nombre_completo,
        cargo: data.cargo as Cargo,
        ...(data.dni !== undefined && { dni: BigInt(data.dni) }),
        ...(data.telefono !== undefined && { telefono: BigInt(data.telefono) }),
        ...(data.fecha_ingreso !== undefined && { fecha_ingreso: new Date(data.fecha_ingreso) }),
      },
      include: {
        usuarios: {
          select: { id: true, email: true, estado: true, rol: true, ultimo_acceso: true },
        },
      },
    });
    return serializeBigInt(personal);
  },

  // ── Obtener por ID ──────────────────────────────────────────
  async obtenerPorId(id: string) {
    const personal = await prisma.personal_interno.findUnique({
      where: { id: BigInt(id) },
      include: { usuarios: { select: { id: true, email: true, estado: true, rol: true } } },
    });
    return personal ? serializeBigInt(personal) : null;
  },

  // ── Obtener por usuario_id ──────────────────────────────────
  async obtenerPorUsuarioId(usuarioId: string) {
    const personal = await prisma.personal_interno.findFirst({
      where: { usuario_id: BigInt(usuarioId) },
      include: { usuarios: { select: { id: true, email: true, estado: true, rol: true } } },
    });
    return personal ? serializeBigInt(personal) : null;
  },

  // ── Actualizar datos del colaborador ────────────────────────
  async actualizar(id: string, data: Partial<{
    nombre_completo: string;
    cargo: string;
    dni: number;
    telefono: number;
    fecha_ingreso: string;
    estado: string;
  }>) {
    const { dni, telefono, fecha_ingreso, cargo, estado, ...rest } = data;

    const personal = await prisma.personal_interno.update({
      where: { id: BigInt(id) },
      data: {
        ...rest,
        ...(cargo !== undefined && { cargo: cargo as Cargo }),
        ...(estado !== undefined && { estado: estado as EstadoPersonal }),
        ...(dni !== undefined && { dni: BigInt(dni) }),
        ...(telefono !== undefined && { telefono: BigInt(telefono) }),
        ...(fecha_ingreso !== undefined && { fecha_ingreso: new Date(fecha_ingreso) }),
        updated_at: new Date(),
      },
    });

    return serializeBigInt(personal);
  },

  // ── Actualizar por usuario_id ───────────────────────────────
  async actualizarPorUsuarioId(usuarioId: string, data: Partial<{
    nombre_completo: string;
    cargo: string;
    dni: number;
    telefono: number;
    fecha_ingreso: string;
    estado: string;
  }>) {
    const personal = await prisma.personal_interno.findFirst({
      where: { usuario_id: BigInt(usuarioId) },
    });
    if (!personal) throw new Error('Personal no encontrado para este usuario');
    return this.actualizar(personal.id.toString(), data);
  },
};