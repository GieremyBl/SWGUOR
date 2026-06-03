import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import { auditoriaService } from '@/lib/services/auditoria.service';

const PAGOS_ROLES: any = ['administrador', 'gerente', 'recepcionista'];

export async function GET() {
  const auth = await requireServerRole(PAGOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const pagos = await prisma.pagos.findMany({
      include: {
        pedidos: {
          select: {
            id: true,
            estado: true,
            total: true,
            monto_pagado: true,
            saldo_pendiente: true,
            clientes: {
              select: {
                id: true,
                razon_social: true,
                ruc: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            personal_interno: {
              select: {
                nombre_completo: true,
              },
            },
          },
        },
        verificado_por_usuario: {
          select: {
            id: true,
            personal_interno: {
              select: {
                nombre_completo: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_pago: 'desc' },
    });

    // Serialize BigInt fields and flatten user names
    const serialized = JSON.parse(
      JSON.stringify(pagos, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value
      )
    ).map((p: any) => ({
      ...p,
      usuario: p.usuario ? {
        id: p.usuario.id,
        nombre_completo: p.usuario.personal_interno?.[0]?.nombre_completo ?? 'Sistema'
      } : null,
      verificado_por_usuario: p.verificado_por_usuario ? {
        id: p.verificado_por_usuario.id,
        nombre_completo: p.verificado_por_usuario.personal_interno?.[0]?.nombre_completo ?? 'Pendiente'
      } : null
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching pagos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireServerRole(PAGOS_ROLES);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { pedido_id, monto, metodo_pago, tipo, notas } = body;

    if (!pedido_id || !monto || !metodo_pago) {
      return NextResponse.json(
        { error: 'pedido_id, monto y metodo_pago son requeridos' },
        { status: 400 }
      );
    }

    const pago = await prisma.pagos.create({
      data: {
        id_uuid: crypto.randomUUID(),
        pedido_id: BigInt(pedido_id),
        monto: parseFloat(monto),
        metodo_pago,
        tipo: tipo ?? 'pago_completo',
        estado: 'pendiente',
        notas: notas ?? null,
        usuario_id: BigInt(auth.user.id),
      },
    });

    // Update pedido monto_pagado
    await prisma.$executeRaw`
      UPDATE pedidos 
      SET monto_pagado = monto_pagado + ${parseFloat(monto)},
          saldo_pendiente = total - (monto_pagado + ${parseFloat(monto)}),
          updated_at = NOW()
      WHERE id = ${BigInt(pedido_id)}
    `;

    await auditoriaService.registrar({
      usuario_id: BigInt(auth.user.id),
      accion: 'CREAR',
      tabla: 'pagos',
      registro_id: BigInt(pago.id_uuid),
      datos_despues: pago,
    });

    const serialized = JSON.parse(
      JSON.stringify(pago, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value
      )
    );

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error('Error creating pago:', error);
    return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 });
  }
}
