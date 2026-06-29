export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import { EMPRESA_GUOR } from '@/lib/constants/empresa';
import { notificarTransicionEstadoPedido } from '@/lib/helpers/crear-notificacion.helper';
import { puedeTransicionar } from '@/lib/helpers/pedido-transiciones.helper';
import type { RolUsuario } from '@/lib/constants/roles';
import type { EstadoDespacho } from '@prisma/client';

const ROLES: RolUsuario[] = ['ayudante', 'administrador', 'gerente'];
const ESTADOS_PERMITIDOS = z.enum([
  'pendiente',
  'preparando',
  'en_almacen',
  'en_ruta',
  'entregado',
  'incidencia',
  'devuelto',
  'cancelado',
]);

const bodySchema = z.object({
  estado: ESTADOS_PERMITIDOS,
  notas: z.string().trim().min(1).max(1000),
  evidencias: z.array(z.string().url()).min(1),
  repartidor: z.string().trim().max(255).optional(),
  placa_vehiculo: z.string().trim().max(50).optional(),
});

function generarNumeroGuia(pedidoId: bigint, totalPrevias: number): string {
  return `GR-DESP-${String(pedidoId).padStart(5, '0')}-${String(totalPrevias + 1).padStart(3, '0')}`;
}

function serializarNotasSeguimiento(params: {
  notas: string;
  evidencias: string[];
  repartidor?: string;
  placaVehiculo?: string;
}): string {
  const partes: string[] = [params.notas.trim()];

  if (params.repartidor?.trim() || params.placaVehiculo?.trim()) {
    const datos: string[] = [];
    if (params.repartidor?.trim()) datos.push(`Repartidor: ${params.repartidor.trim()}`);
    if (params.placaVehiculo?.trim()) datos.push(`Placa: ${params.placaVehiculo.trim()}`);
    partes.push(datos.join(' | '));
  }

  partes.push(`[EVIDENCIAS] ${JSON.stringify(params.evidencias)}`);
  return partes.join('\n');
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireServerRole(ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload inválido' },
        { status: 400 },
      );
    }

    const despachoId = BigInt(id);
    const estadoNuevo = parsed.data.estado;

    const despachoAntes = await prisma.despachos.findUnique({
      where: { id: despachoId },
      select: {
        id: true,
        pedido_id: true,
        estado: true,
        pedidos: { select: { id: true, cliente_id: true, direccion_despacho: true } },
        despachos_grupo_pedidos: { take: 1 },
      },
    });

    if (!despachoAntes?.pedido_id || !despachoAntes?.pedidos?.cliente_id) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    if (!puedeTransicionar(despachoAntes.estado, estadoNuevo)) {
      return NextResponse.json(
        { error: `Transición no permitida: ${despachoAntes.estado ?? 'sin estado'} → ${estadoNuevo}` },
        { status: 422 },
      );
    }

    if (estadoNuevo === 'en_almacen') {
      if (!parsed.data.repartidor?.trim()) {
        return NextResponse.json({ error: 'El repartidor es obligatorio para en_almacen' }, { status: 400 });
      }
      if (!parsed.data.placa_vehiculo?.trim()) {
        return NextResponse.json({ error: 'La placa del vehículo es obligatoria para en_almacen' }, { status: 400 });
      }
    }

    const grupoId = despachoAntes.despachos_grupo_pedidos[0]?.grupo_despacho_id ?? null;

    const resultado = await prisma.$transaction(async (tx) => {
      const seguimiento = await tx.seguimiento_despachos.create({
        data: {
          grupo_despacho_id: grupoId ?? undefined,
          status: estadoNuevo,
          notas: serializarNotasSeguimiento({
            notas: parsed.data.notas,
            evidencias: parsed.data.evidencias,
            repartidor: parsed.data.repartidor,
            placaVehiculo: parsed.data.placa_vehiculo,
          }),
          creado_por: auth.user.authId,
        },
      });

      await tx.despachos.update({
        where: { id: despachoId },
        data: {
          estado: estadoNuevo as EstadoDespacho,
          updated_at: new Date(),
        },
      });

      if (grupoId) {
        await tx.despachos_grupos.update({
          where: { id: grupoId },
          data: {
            estado: estadoNuevo as EstadoDespacho,
            updated_at: new Date(),
            ...(estadoNuevo === 'entregado' ? { fecha_entrega: new Date() } : {}),
          },
        });
      }

      let guiaId: bigint | null = null;

      if (estadoNuevo === 'entregado') {
        await tx.pedidos.update({
          where: { id: despachoAntes.pedido_id },
          data: {
            estado: 'entregado',
            updated_at: new Date(),
          },
        });

        const existente = await tx.guias_remision.findFirst({
          where: {
            pedido_id: despachoAntes.pedido_id,
            tipo: 'despacho_cliente',
          },
          orderBy: { created_at: 'desc' },
        });

        const pdfUrl = `/api/admin/despachos/${despachoId.toString()}/guias-remision/pdf`;
        const fechaActual = new Date();
        const destinoDireccion = despachoAntes.pedidos.direccion_despacho?.trim();

        if (!destinoDireccion) {
          throw new Error('El pedido no tiene dirección de despacho registrada');
        }

        if (existente) {
          const guia = await tx.guias_remision.update({
            where: { id: existente.id },
            data: {
              estado: 'entregada',
              fecha_entrega: fechaActual,
              pdf_url: pdfUrl,
              observaciones: parsed.data.notas,
              updated_at: fechaActual,
            },
          });
          guiaId = guia.id;
        } else {
          const totalPrevias = await tx.guias_remision.count({
            where: {
              pedido_id: despachoAntes.pedido_id,
              tipo: 'despacho_cliente',
            },
          });

          const guia = await tx.guias_remision.create({
            data: {
              numero: generarNumeroGuia(despachoAntes.pedido_id, totalPrevias),
              tipo: 'despacho_cliente',
              estado: 'entregada',
              origen_tipo: 'almacen',
              origen_direccion: EMPRESA_GUOR.direccion,
              destino_tipo: 'cliente',
              destino_direccion: destinoDireccion,
              pedido_id: despachoAntes.pedido_id,
              fecha_traslado: fechaActual,
              fecha_entrega: fechaActual,
              pdf_url: pdfUrl,
              observaciones: parsed.data.notas,
              emitido_por: auth.user.id,
            },
          });
          guiaId = guia.id;
        }

        await notificarTransicionEstadoPedido({
          clienteId: despachoAntes.pedidos.cliente_id,
          pedidoId: despachoAntes.pedido_id,
          estadoAnterior: despachoAntes.estado,
          estadoNuevo: 'entregado',
        });
      }

      return { seguimiento, guiaId };
    });

    return NextResponse.json({
      success: true,
      data: {
        despacho_id: despachoId.toString(),
        seguimiento_id: resultado.seguimiento.id.toString(),
        guia_id: resultado.guiaId ? resultado.guiaId.toString() : null,
        estado: estadoNuevo,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST /api/admin/despachos/:id/estado]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
