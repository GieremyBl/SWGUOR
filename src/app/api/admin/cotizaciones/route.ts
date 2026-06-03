export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { CotizacionesService } from '@/lib/services/cotizaciones.service';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { auditoriaService } from '@/lib/services/auditoria.service';

const ROLES_LECTURA: RolUsuario[] = ['administrador', 'gerente', 'recepcionista', 'disenador'];
const ROLES_ESCRITURA: RolUsuario[] = ['administrador', 'gerente', 'recepcionista'];

// Función utilitaria interna y rápida para sanitizar las respuestas HTTP al cliente
const serializarHttp = (objeto: any) => {
  return JSON.parse(
    JSON.stringify(objeto, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export async function GET(req: Request) {
  const auth = await requireServerRole(ROLES_LECTURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const data = await CotizacionesService.listar(
      searchParams.get('estado') ?? undefined
    );
    
    // Purificamos el objeto 'data' antes de enviarlo por la red HTTP
    return NextResponse.json({ success: true, data: serializarHttp(data) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireServerRole(ROLES_ESCRITURA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.items?.length || !body.valida_hasta) {
      return NextResponse.json(
        { error: 'items y valida_hasta son requeridos' },
        { status: 400 }
      );
    }
    const data = await CotizacionesService.crear(body);

    // Gracias a la mejora del auditoriaService, ahora puedes mandar el objeto 'data' 
    // directamente aquí sin envoltorios extras ni transformaciones manuales manuales.
    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'cotizaciones',
      registro_id: BigInt(data.id),
      datos_despues: data, 
    });

    return NextResponse.json({ success: true, data: serializarHttp(data) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}