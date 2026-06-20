/**
 * Verificación previa/posterior a la migración 20260528_drop_detalle_ficha_insumos.sql
 *
 * Uso:
 *   npx tsx scripts/verify-detalle-ficha-insumos-deprecation.ts
 *
 * Requiere DATABASE_URL en .env
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL no configurada.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const canonical = await prisma.fichas_tecnicas_detalle.count();
    console.log(`fichas_tecnicas_detalle (canónica): ${canonical} filas`);

    try {
      const legacyRows = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM public.detalle_ficha_insumos',
      );
      const legacy = Number(legacyRows.rows[0]?.count ?? 0);
      console.log(`detalle_ficha_insumos (legacy): ${legacy} filas — ejecutar migración SQL`);
    } catch {
      console.log('detalle_ficha_insumos: tabla no existe (migración completada)');
    }

    const fichasConDetalle = await prisma.fichas_tecnicas.findMany({
      where: { fichas_tecnicas_detalle: { some: {} } },
      include: { _count: { select: { fichas_tecnicas_detalle: true } } },
      take: 5,
      orderBy: { created_at: 'desc' },
    });

    if (fichasConDetalle.length > 0) {
      console.log('\nMuestra de fichas con detalle canónico:');
      for (const f of fichasConDetalle) {
        console.log(`  - Ficha #${f.id} v${f.version}: ${f._count.fichas_tecnicas_detalle} items`);
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
