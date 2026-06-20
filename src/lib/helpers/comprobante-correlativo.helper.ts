import { prisma } from '@/lib/prisma';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Obtiene el siguiente correlativo secuencial para una serie de comprobante.
 * Debe invocarse dentro de una transacción Prisma para evitar duplicados concurrentes.
 */
export async function obtenerProximoCorrelativoSerie(
  db: Tx | typeof prisma,
  serie: string,
): Promise<number> {
  const ultimo = await db.comprobantes.findFirst({
    where: { serie },
    orderBy: { correlativo: 'desc' },
    select: { correlativo: true },
  });

  return (ultimo?.correlativo ? parseInt(ultimo.correlativo, 10) : 0) + 1;
}
