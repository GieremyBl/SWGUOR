import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const BUCKET_PRODUCTOS = 'productos';

function buildImageUrl(rawValue: string | null): string | null {
    if (!rawValue) return null;
    if (rawValue.startsWith('http')) return rawValue;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_PRODUCTOS}/${rawValue}`;
}

export async function GET() {
    try {
        const rows = await prisma.$queryRaw`
          SELECT 
            producto, 
            producto_imagen, 
            ranking::int as ranking
          FROM ventas_productos_mas_vendidos_mensuales
          WHERE mes = DATE_TRUNC('month', CURRENT_DATE)::date
          ORDER BY ranking ASC
          LIMIT 10
        ` as Array<{
            producto: string;
            producto_imagen: string | null;
            ranking: number;
        }>;

        const data = rows.map((r, index) => ({
            id: index + 1,
            nombre: r.producto,
            image_url: buildImageUrl(r.producto_imagen),
        }));

        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'no-store' }
        });

    } catch (error) {
        console.error("Error en API productos destacados:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}