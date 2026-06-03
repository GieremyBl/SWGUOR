export const runtime = 'nodejs';
import { ClientesService } from '@/lib/services/clientes.service';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';
import type { RolUsuario } from '@/lib/constants/roles';
import { NextResponse } from 'next/server';

const CLIENTES_ROLES: RolUsuario[] = ['administrador', 'gerente', 'recepcionista'];

// Función utilitaria para transformar tipos complejos (bigint, Decimal, Date) a tipos JSON nativos válidos
const serializarPrisma = (objeto: any) => {
  return JSON.parse(
    JSON.stringify(objeto, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

// GET /api/admin/clientes?busqueda=xxx&estado=xxx
export async function GET(req: Request) {
  const auth = await requireServerRole(CLIENTES_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const { searchParams } = new URL(req.url);
    const data = await ClientesService.listar({
      busqueda: searchParams.get('busqueda') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
    });
    return NextResponse.json({ success: true, data: serializarPrisma(data) });
  } catch (error: any) {
    console.error('[GET /clientes]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/clientes — crea usuario Auth + clientes
export async function POST(req: Request) {
  const auth = await requireServerRole(CLIENTES_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { ruc, email, password } = body;

    if (!ruc) return NextResponse.json({ error: 'ruc requerido' }, { status: 400 });
    if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 });
    if (!password) return NextResponse.json({ error: 'password requerido' }, { status: 400 });

    const cliente = await ClientesService.crear(body);

    if (!cliente) {
      return NextResponse.json({ error: 'No se pudo crear el cliente' }, { status: 500 });
    }

    // Sanitizamos los datos del cliente para evitar errores con InputJsonValue en la auditoría
    const clienteSerializado = serializarPrisma(cliente);

    // Registro en auditoría
    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'clientes',
      registro_id: BigInt(cliente.id),
      datos_despues: clienteSerializado, // <-- Evita incompatibilidades de tipo bigint
    });

    return NextResponse.json({ success: true, data: clienteSerializado }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /clientes]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'RUC o email ya registrado' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/clientes — actualiza datos del cliente
export async function PUT(req: Request) {
  const auth = await requireServerRole(CLIENTES_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 });
    }

    const cliente = await ClientesService.actualizar(id, data);

    if (!cliente) {
      return NextResponse.json({ error: 'No se pudo actualizar el cliente' }, { status: 500 });
    }

    // Sanitizamos los datos antes de introducirlos en la auditoría o enviarlos de regreso
    const clienteSerializado = serializarPrisma(cliente);

    // Registro en auditoría
    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'ACTUALIZAR',
      tabla: 'clientes',
      registro_id: BigInt(id),
      datos_despues: clienteSerializado,
    });

    return NextResponse.json({ success: true, data: clienteSerializado });
  } catch (error: any) {
    console.error('[PUT /clientes]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}