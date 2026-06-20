import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServerRole } from '@/lib/auth/server';
import type { RolUsuario } from '@/lib/constants/roles';
import { generarOrdenParaPedido } from '@/lib/helpers/generar-ordenes-pedidos-pagados.helper';
import { obtenerPagoDetalleAdmin } from '@/lib/services/admin-pago-detalle.service';

const PAGOS_ROLES: RolUsuario[] = ['administrador', 'gerente', 'recepcionista'];

/** GET /api/admin/pagos/[id] — detalle con pedido y comprobante */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireServerRole(PAGOS_ROLES);
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const detalle = await obtenerPagoDetalleAdmin(id);

    if (!detalle) {
      return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: detalle });
  } catch (error) {
    console.error('[GET /api/admin/pagos/:id]', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado, verificado_por } = body;

    if (!estado) {
      return NextResponse.json({ error: 'Estado es requerido' }, { status: 400 });
    }

    const pago = await prisma.pagos.update({
      where: { id_uuid: id },
      data: {
        estado,
        verificado_at: estado === 'verificado' ? new Date() : undefined,
        verificado_por: verificado_por ? BigInt(verificado_por) : undefined,
      },
    });

    // Si el pago fue verificado, intentamos generar la orden de producción para el pedido asociado.
    if (estado === 'verificado' && pago.pedido_id) {
      try {
        // generar solo para ese pedido
        await generarOrdenParaPedido(BigInt(pago.pedido_id));
      } catch (err) {
        console.error('Error generando orden de producción tras verificación de pago:', err);
        // No impedimos la respuesta al cliente; la verificación del pago ya fue guardada.
      }
    }

    const serialized = JSON.parse(
      JSON.stringify(pago, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value
      )
    );

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating pago:', error);
    return NextResponse.json({ error: 'Error al actualizar el pago' }, { status: 500 });
  }
}
