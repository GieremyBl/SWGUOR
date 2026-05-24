export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';

async function obtenerClienteSesion() {
  const auth = await requireServerAuth();
  if (!auth.success) {
    return { error: auth.error, status: auth.status };
  }

  const clienteDb = await prisma.clientes.findFirst({
    where: { usuario_id: auth.user.id },
  });

  if (!clienteDb) {
    return { error: 'cliente_no_encontrado' as const, status: 404 };
  }

  return {
    auth_user_id: auth.user.authId,
    usuario_id:   auth.user.id,
    usuario:      auth.user,
    cliente_id:   clienteDb.id,
    cliente:      clienteDb,
  };
}

// GET: Perfil del cliente autenticado
export async function GET() {
  try {
    const sesion = await obtenerClienteSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.error ? 401 : 404 }
      );
    }

    const direcciones = await prisma.direcciones_cliente.findMany({
      where: { cliente_id: sesion.cliente_id },
      orderBy: { es_principal: 'desc' },
    });

    const [cotizacionesCount, pedidosCount] = await Promise.all([
      prisma.cotizaciones.count({ where: { cliente_id: sesion.cliente_id } }),
      prisma.pedidos.count({     where: { cliente_id: sesion.cliente_id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cliente:     serializeBigInt(sesion.cliente),
        usuario:     serializeBigInt(sesion.usuario),
        direcciones: serializeBigInt(direcciones),
        stats: { cotizaciones: cotizacionesCount, pedidos: pedidosCount },
      },
    });
  } catch (error: any) {  
    console.error('[Portal] Error en GET perfil:', error);
  }  return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
}

// PATCH: Actualizar datos del perfil del cliente
export async function PATCH(req: Request) {
  try {
    const sesion = await obtenerClienteSesion();
    if ('error' in sesion) {
      return NextResponse.json(
        { success: false, error: sesion.error },
        { status: sesion.error ? 401 : 404 }
      );
    }

    const body = await req.json();

    const CAMPOS_PERMITIDOS = ['nombre_comercial', 'direccion_fiscal'];

    const dataCliente: Record<string, unknown> = {};
    for (const campo of CAMPOS_PERMITIDOS) {
      if (body[campo] !== undefined) dataCliente[campo] = body[campo];
    }

    if (typeof dataCliente.nombre_comercial === 'string') {
      dataCliente.nombre_comercial = dataCliente.nombre_comercial.trim();
    }

    if (typeof dataCliente.direccion_fiscal === 'string') {
      dataCliente.direccion_fiscal = dataCliente.direccion_fiscal.trim();
    }

    if (Object.keys(dataCliente).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se enviaron campos editables' },
        { status: 400 }
      );
    }

    const clienteActualizado = await prisma.clientes.update({
      where: { id: sesion.cliente_id },
      data:  dataCliente,
    });

    return NextResponse.json({ success: true, data: serializeBigInt(clienteActualizado) });
  } catch (error: any) {
    console.error('[Portal] Error en PATCH perfil:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}