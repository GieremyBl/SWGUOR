export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reservaStockBaseSchema as reservasStockSchema } from '@/lib/schemas/reserva-stock';
import { serializeBigInt } from '@/lib/utils/serialize';
import { ZodError } from 'zod';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';

const RESERVA_ROLES: any = ['administrador', 'gerente', 'almacenero', 'vendedor'];

export async function GET() {
  const auth = await requireServerRole(RESERVA_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const reservas = await prisma.reservas_stock.findMany({
      where: { estado: 'activa' },
      orderBy: { expira_en: 'asc' },
      include: {
        pedidos: { select: { id: true, estado: true } },
        cotizaciones: { select: { id: true, numero: true, estado: true } },
        variantes_producto: {
          select: {
            color: true,
            talla: true,
            sku: true,
            productos: { select: { nombre: true, sku: true } },
          },
        },
      },
    });
    return NextResponse.json(serializeBigInt(reservas));
  } catch (error: any) {
    console.error('[GET /reservas-stock]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireServerRole(RESERVA_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const validated = reservasStockSchema.parse(body);

    const reserva = await prisma.reservas_stock.create({
      data: {
        variante_id: BigInt(validated.variante_id),
        pedido_id: validated.pedido_id ? BigInt(validated.pedido_id) : undefined,
        cantidad: validated.cantidad,
        estado: validated.estado,
      },
      include: { pedidos: true },
    });

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'reservas_stock',
      registro_id: BigInt(reserva.id),
      datos_despues: reserva,
    });

    return NextResponse.json(serializeBigInt(reserva), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[POST /reservas-stock]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}