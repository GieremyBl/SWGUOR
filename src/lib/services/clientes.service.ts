// lib/services/clientes.service.ts
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { createClient } from '@/lib/supabase/server';
import { Prisma, EstadoCliente, TipoCliente } from '@prisma/client';

export interface ClienteListItem {
  id: string;
  ruc: string;
  razon_social: string | null;
  nombre_comercial: string | null;
  activo: string;
  email: string | null;
  telefono: string | null;
  tipo_cliente: TipoCliente | null;
  direccion_fiscal: string | null;
  ultimo_pedido_en: string | null;
  usuarios: {
    id: string;
    email: string;
    estado: string;
    rol: string | null;
    ultimo_acceso: string | null;
  } | null;
  direcciones_cliente: DireccionCliente[];
}

export interface DireccionCliente {
  id: string;
  alias: string;
  direccion: string;
  ciudad: string | null;
  departamento: string | null;
  es_principal: boolean;
}

export interface ClienteEditable {
  id: string;
  ruc: string;
  razon_social: string | null;
  nombre_comercial: string | null;
  telefono: string | null;
  direccion_fiscal: string | null;
  tipo_cliente: TipoCliente | null;
  direcciones_cliente: DireccionCliente[];
}

export const ClientesService = {

  // ── Listar ──────────────────────────────────────────────────
  async listar(params?: { busqueda?: string; estado?: string }) {
    const where: Prisma.clientesWhereInput = {};

    if (params?.estado && params.estado !== 'todos') {
      where.estado = params.estado as EstadoCliente;
    }
    if (params?.busqueda) {
      where.OR = [
        { razon_social: { contains: params.busqueda, mode: 'insensitive' } },
        { ruc: { contains: params.busqueda, mode: 'insensitive' } },
        { nombre_comercial: { contains: params.busqueda, mode: 'insensitive' } },
        { usuarios: { email: { contains: params.busqueda, mode: 'insensitive' } } },
      ];
    }

    const clientes = await prisma.clientes.findMany({
      where,
      include: {
        usuarios: { select: { id: true, email: true, estado: true, rol: true, ultimo_acceso: true } },
        direcciones_cliente: { orderBy: [{ es_principal: 'desc' }, { created_at: 'asc' }] },
        pedidos: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { id: true, created_at: true, estado: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const resultado = clientes.map(c => ({
      ...c,
      activo: c.estado,
      ultimo_pedido_en: c.pedidos?.[0]?.created_at ?? null,
      pedidos: undefined,
    }));
    return serializeBigInt(resultado);
  },

  // ── Obtener por ID ──────────────────────────────────────────
  async obtenerPorId(id: string) {
    const cliente = await prisma.clientes.findUnique({
      where: { id: BigInt(id) },
      include: {
        usuarios: {
          select: { id: true, email: true, estado: true, rol: true, ultimo_acceso: true, auth_id: true },
        },
        direcciones_cliente: { orderBy: [{ es_principal: 'desc' }, { created_at: 'asc' }] },
      },
    });
    if (!cliente) return null;
    return serializeBigInt({ ...cliente, activo: cliente.estado });
  },

  // ── Crear cliente + usuario en Auth ─────────────────────────
  async crear(data: {
    ruc: string;
    razon_social?: string;
    nombre_comercial?: string;
    email: string;
    password: string;
    telefono?: string;
    direccion_fiscal?: string;
    tipo_cliente?: string;
  }) {
    const supabase = await createClient();

    // PASO 1: Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? 'Error al crear usuario en Supabase Auth');
    }
    const auth_id = authData.user.id;

    try {
      const resultado = await prisma.$transaction(async (tx) => {
        // PASO 2: Crear usuarios
        const usuario = await tx.usuarios.create({
          data: { email: data.email, rol: 'cliente', estado: 'activo', auth_id },
        });

        // PASO 3: Crear clientes vinculado al usuario
        const cliente = await tx.clientes.create({
          data: {
            ruc: data.ruc,
            razon_social: data.razon_social ?? null,
            nombre_comercial: data.nombre_comercial ?? null,
            email: data.email,
            telefono: data.telefono ?? null,
            direccion_fiscal: data.direccion_fiscal ?? null,
            tipo_cliente: (data.tipo_cliente as TipoCliente) ?? 'corporativo',
            estado: 'activo' as EstadoCliente,
            usuario_id: usuario.id,
          },
          include: {
            usuarios: { select: { id: true, email: true, estado: true, rol: true } },
            direcciones_cliente: true,
          },
        });
        return cliente;
      });
      return serializeBigInt(resultado);
    } catch (dbError) {
      await supabase.auth.admin.deleteUser(auth_id);
      throw dbError;
    }
  },

  // ── Actualizar ──────────────────────────────────────────────
  async actualizar(id: string, data: Partial<{
    ruc: string;
    razon_social: string;
    nombre_comercial: string;
    email: string;
    telefono: string;
    direccion_fiscal: string;
    tipo_cliente: string;
    activo: string;
  }>) {
    const { activo, tipo_cliente, ...rest } = data;

    const updateData: Prisma.clientesUpdateInput = {
      ...rest,
      ...(activo !== undefined && { activo: activo as EstadoCliente }),
      ...(tipo_cliente !== undefined && { tipo_cliente: tipo_cliente as TipoCliente }),
      updated_at: new Date(),
    };

    const cliente = await prisma.clientes.update({
      where: { id: BigInt(id) },
      data: {
        ...rest,
        ...(activo !== undefined && { estado: activo as EstadoCliente }),
        ...(tipo_cliente !== undefined && { tipo_cliente: tipo_cliente as TipoCliente }),
        updated_at: new Date(),
      },
    });
    return serializeBigInt(cliente);
  },

  // ── Toggle estado (sincroniza con Auth) ─────────────────────
  async toggleEstado(clienteId: string, estado: EstadoCliente) {
    const supabase = await createClient();

    const cliente = await prisma.clientes.findUnique({
      where: { id: BigInt(clienteId) },
      include: { usuarios: { select: { id: true, auth_id: true } } },
    });
    if (!cliente) throw new Error('Cliente no encontrado');

    if (cliente.usuarios?.auth_id) {
      await supabase.auth.admin.updateUserById(cliente.usuarios.auth_id, {
        ban_duration: estado === 'inactivo' ? '87600h' : 'none',
      });
    }

    const [clienteActualizado] = await prisma.$transaction([
      prisma.clientes.update({
        where: { id: BigInt(clienteId) },
        data: { estado, updated_at: new Date() },
      }),
      ...(cliente.usuarios
        ? [prisma.usuarios.update({
          where: { id: cliente.usuarios.id },
          data: { estado: estado === 'activo' ? 'activo' : 'inactivo', updated_at: new Date() },
        })]
        : []),
    ]);
    return serializeBigInt(clienteActualizado);
  },

  // ── Direcciones ─────────────────────────────────────────────
  async agregarDireccion(clienteId: string, data: {
    alias: string;
    direccion: string;
    ciudad?: string;
    departamento?: string;
    es_principal?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      if (data.es_principal) {
        await tx.direcciones_cliente.updateMany({
          where: { cliente_id: BigInt(clienteId) },
          data: { es_principal: false },
        });
      }
      const dir = await tx.direcciones_cliente.create({
        data: {
          cliente_id: BigInt(clienteId),
          alias: data.alias,
          direccion: data.direccion,
          ciudad: data.ciudad ?? null,
          departamento: data.departamento ?? null,
          es_principal: data.es_principal ?? false,
        },
      });
      return serializeBigInt(dir);
    });
  },

  async actualizarDireccion(dirId: string, clienteId: string, data: Partial<{
    alias: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    es_principal: boolean;
  }>) {
    return prisma.$transaction(async (tx) => {
      if (data.es_principal) {
        await tx.direcciones_cliente.updateMany({
          where: { cliente_id: BigInt(clienteId), id: { not: BigInt(dirId) } },
          data: { es_principal: false },
        });
      }
      const dir = await tx.direcciones_cliente.update({
        where: { id: BigInt(dirId) },
        data,
      });
      return serializeBigInt(dir);
    });
  },

  async eliminarDireccion(dirId: string) {
    await prisma.direcciones_cliente.delete({ where: { id: BigInt(dirId) } });
    return { success: true };
  },

  // ── Obtener detalle completo ────────────────────────────────
  async obtenerDetalle(id: string) {
    const cliente = await prisma.clientes.findUnique({
      where: { id: BigInt(id) },
      include: {
        usuarios: {
          select: {
            id: true, email: true, estado: true,
            rol: true, ultimo_acceso: true, auth_id: true,
          },
        },
        direcciones_cliente: {
          orderBy: [{ es_principal: 'desc' }, { created_at: 'asc' }],
        },
        pedidos: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            estado: true,
            prioridad: true,
            total_estimado: true,
            total_unidades: true,
            moq_aplicado: true,
            notas_cliente: true,
            notas_pedido: true,
            created_at: true,
            updated_at: true,
            pedido_items: {
              select: {
                id: true,
                cantidad: true,
                productos: {
                  select: { id: true, nombre: true, sku: true, imagen: true },
                },
                variantes_producto: {
                  select: { id: true, color: true, talla: true, sku: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cliente) return null;

    const pedidos = cliente.pedidos ?? [];

    const ahora = Date.now();
    const totalPedidos = pedidos.length;
    const pedidosActivos = pedidos.filter(p =>
      !['entregado', 'cancelado'].includes(p.estado ?? '')
    ).length;
    const ultimoPedido = pedidos[0]?.created_at ?? null;
    const diasDesdeUltimo = ultimoPedido
      ? Math.floor((ahora - new Date(ultimoPedido).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const totalUnidades = pedidos.reduce((acc, p) => acc + (p.total_unidades ?? 0), 0);
    const totalEstimado = pedidos.reduce((acc, p) => acc + Number(p.total_estimado ?? 0), 0);

    const mapaProductos = new Map<string, {
      producto_id: string;
      nombre: string;
      sku: string | null;
      imagen: string | null;
      total_cantidad: number;
      total_pedidos: number;
      variantes: Map<string, {
        color: string | null;
        talla: string | null;
        sku: string | null;
        cantidad: number;
      }>;
    }>();

    for (const pedido of pedidos) {
      for (const item of pedido.pedido_items ?? []) {
        if (!item.productos) continue;
        const pid = String(item.productos.id);

        if (!mapaProductos.has(pid)) {
          mapaProductos.set(pid, {
            producto_id: pid,
            nombre: item.productos.nombre,
            sku: item.productos.sku ?? null,
            imagen: item.productos.imagen ?? null,
            total_cantidad: 0,
            total_pedidos: 0,
            variantes: new Map(),
          });
        }

        const entrada = mapaProductos.get(pid)!;
        entrada.total_cantidad += item.cantidad;
        entrada.total_pedidos += 1;

        const vid = String(item.variantes_producto?.id ?? 'sin-variante');
        if (!entrada.variantes.has(vid)) {
          entrada.variantes.set(vid, {
            color: item.variantes_producto?.color ?? null,
            talla: item.variantes_producto?.talla ?? null,
            sku: item.variantes_producto?.sku ?? null,
            cantidad: 0,
          });
        }
        entrada.variantes.get(vid)!.cantidad += item.cantidad;
      }
    }

    const productosTop = Array.from(mapaProductos.values())
      .sort((a, b) => b.total_cantidad - a.total_cantidad)
      .slice(0, 10)
      .map(p => ({
        producto_id: p.producto_id,
        nombre: p.nombre,
        sku: p.sku,
        imagen: p.imagen,
        total_cantidad: p.total_cantidad,
        total_pedidos: p.total_pedidos,
        variantes: Array.from(p.variantes.values())
          .sort((a, b) => b.cantidad - a.cantidad),
      }));

    return serializeBigInt({
      ...cliente,
      productosTop,
      metricas: {
        totalPedidos,
        pedidosActivos,
        ultimoPedido,
        diasDesdeUltimo,
        totalUnidades,
        totalEstimado,
        totalProductosDistintos: mapaProductos.size,
      },
    });
  },
};