export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';

type Params = { params: Promise<{ id: string }> };

const ROLES_VERIFICACION_ALMACEN: RolUsuario[] = [
  'almacenero',
  'administrador',
  'gerente',
];

const bodySchema = z.object({
  cantidad_verificada: z.number().int().positive(),
  notas: z.string().trim().max(500).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const auth = await requireServerRole(ROLES_VERIFICACION_ALMACEN);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload inválido' },
        { status: 400 },
      );
    }

    const despachoId = BigInt(id);
    const despacho = await prisma.despachos.findUnique({
      where: { id: despachoId },
      include: {
        pedidos: { select: { id: true, total_unidades: true } },
        despachos_grupo_pedidos: { take: 1 },
      },
    });

    if (!despacho) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    if (despacho.estado !== 'preparando') {
      return NextResponse.json(
        { error: 'Solo se puede verificar almacén cuando el despacho está en preparando.' },
        { status: 422 },
      );
    }

    const grupoId = despacho.despachos_grupo_pedidos[0]?.grupo_despacho_id;
    if (!grupoId) {
      return NextResponse.json(
        { error: 'El despacho no tiene grupo logístico asociado' },
        { status: 422 },
      );
    }

    const cantidadPedida = Number(despacho.pedidos.total_unidades ?? 0);
    const cantidadVerificada = parsed.data.cantidad_verificada;

    if (cantidadVerificada !== cantidadPedida) {
      return NextResponse.json(
        {
          error:
            'La verificación de almacén requiere coincidencia exacta con la cantidad solicitada del pedido.',
          data: {
            cantidad_pedida: cantidadPedida,
            cantidad_verificada: cantidadVerificada,
          },
        },
        { status: 422 },
      );
    }

    const marcaVerificacion = {
      cantidad_verificada: cantidadVerificada,
      cantidad_pedida: cantidadPedida,
      verificado_por_rol: auth.user.rol,
      verificado_por_usuario_id: auth.user.id,
      timestamp: new Date().toISOString(),
    };

    await prisma.seguimiento_despachos.create({
      data: {
        grupo_despacho_id: grupoId,
        status: 'preparando',
        notas: `${parsed.data.notas?.trim() || 'Verificación de almacén conforme.'}\nVERIFICACION_ALMACEN_OK ${JSON.stringify(marcaVerificacion)}`,
        creado_por: auth.user.authId ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        despacho_id: String(despacho.id),
        pedido_id: String(despacho.pedido_id),
        cantidad_pedida: cantidadPedida,
        cantidad_verificada: cantidadVerificada,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST admin/despachos/verificar-almacen]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
