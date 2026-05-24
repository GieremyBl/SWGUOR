export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth/server';
import { notificacionesService } from '@/lib/services/notificaciones.service';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/admin/notificaciones/[id]
 * Marca una notificación específica como leída
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ← Promise en Next.js 15
) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;                      // ← await obligatorio
    const notificacionId = BigInt(id);

    const notificacion = await prisma.notificaciones.findUnique({
      where:  { id: notificacionId },
      select: { usuario_id: true },
    });

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    if (notificacion.usuario_id !== BigInt(auth.user?.id ?? 0)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const actualizada = await notificacionesService.marcarComoLeida(notificacionId);

    return NextResponse.json({
      success: true,
      data:    actualizada,
      message: 'Notificación marcada como leída',
    });

  } catch (error: any) {
    console.error('[API_NOTIF_ID] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar notificación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/notificaciones/[id]
 * Elimina una notificación
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ← Promise en Next.js 15
) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;                      // ← await obligatorio
    const notificacionId = BigInt(id);

    const notificacion = await prisma.notificaciones.findUnique({
      where:  { id: notificacionId },
      select: { usuario_id: true },
    });

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    if (Number(notificacion.usuario_id) !== auth.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    await prisma.notificaciones.delete({
      where: { id: notificacionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada',
    });

  } catch (error: any) {
    console.error('[API_NOTIF_DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar notificación' },
      { status: 500 }
    );
  }
}