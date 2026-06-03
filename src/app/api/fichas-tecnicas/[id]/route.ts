export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FichasTecnicasService } from '@/lib/services/fichas-tecnicas.service';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import type { EstadoFicha } from '@prisma/client';
import { pedidoFichasEnModoSoloLectura } from '@/lib/helpers/ficha-tecnica-pedido.helper';

const ROLES_FICHA: RolUsuario[] = ['disenador', 'administrador', 'gerente'];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_FICHA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const ficha = await FichasTecnicasService.obtenerPorId(id);
    if (!ficha) {
      return NextResponse.json({ error: 'Ficha no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: ficha });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_FICHA);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const fichaAntes = await prisma.fichas_tecnicas.findUnique({
      where: { id: BigInt(id) },
      select: { estado: true, id_producto: true },
    });

    if (!fichaAntes) {
      return NextResponse.json({ error: 'Ficha no encontrada' }, { status: 404 });
    }

    const pedidoIdBody = body.pedido_id ?? body.pedidoId;
    if (pedidoIdBody) {
      const pedido = await prisma.pedidos.findUnique({
        where: { id: BigInt(pedidoIdBody) },
        select: { estado: true },
      });
      if (pedido && pedidoFichasEnModoSoloLectura(pedido.estado)) {
        return NextResponse.json(
          { error: 'Todas las fichas están aprobadas. El pedido ya no admite cambios.' },
          { status: 422 },
        );
      }
    }

    const data: Partial<{
      version: string;
      descripcion_detallada: string;
      ficha_url: string;
      imagen_geometral: string;
      estado: EstadoFicha;
    }> = {};

    if (body.version !== undefined) data.version = body.version;
    if (body.descripcion_detallada !== undefined) {
      data.descripcion_detallada = body.descripcion_detallada;
    }
    if (body.ficha_url !== undefined) data.ficha_url = body.ficha_url;
    if (body.imagen_geometral !== undefined) {
      data.imagen_geometral = body.imagen_geometral;
    }
    if (body.estado !== undefined) {
      if (body.estado === 'aprobada') {
        return NextResponse.json(
          {
            error:
              'Use el botón "Aprobar ítem" para aprobar la ficha. No puede asignar estado aprobada desde aquí.',
          },
          { status: 400 },
        );
      }
      data.estado = body.estado;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 },
      );
    }

    const ficha = await FichasTecnicasService.actualizar(id, data);

    return NextResponse.json({ success: true, data: ficha });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
