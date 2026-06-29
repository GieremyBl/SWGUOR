import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

import DetalleProductoInteractive from '@/components/portal/catalogo/detalle/DetalleProductoInteractive';

// ─── Tipos Locales adaptados a los componentes ──────────────────────────────
interface Variante {
    id: number;
    color: string;
    talla: string;
    estado: string;
    stock: number;
    precio_adicional: number;
    precio_final: number;
    sku: string;
    imagen_url: string | null;
}

interface Categoria {
    id: number | null;
    nombre: string;
    imagen: string | null;
}

interface ReglaDescuento {
    id: number;
    nombre: string;
    cantidad_minima: number;
    descuento_porcentaje: number;
    tipo_beneficio: string;
    tipo_conteo: string;
}

interface ProductoDetalle {
    id: number;
    nombre: string;
    descripcion?: string | null;
    codigo?: string | null;
    precio: number;
    imagen: string | null;
    stock_disponible: number;
    categoria: Categoria;
    colores_disponibles: string[];
    tallas_disponibles: string[];
    tallas_por_color: Record<string, string[]>;
    colores_por_talla: Record<string, string[]>;
    variantes: Variante[];
    regla_descuento: ReglaDescuento; // Ahora siempre garantizamos una regla
}

// ─── Fetch de Datos (Server Side) ───────────────────────────────────────────
async function getProducto(id: string): Promise<ProductoDetalle | null> {
    try {
        const prodId = Number(id);
        if (isNaN(prodId)) return null;

        const p = await prisma.productos.findUnique({
            where: { id: prodId },
            include: {
                categorias_productos: true,
                reglas_descuento: true,
            },
        }) as any;

        if (!p) return null;
        const colores: string[] = Array.isArray(p.colores_disponibles) ? p.colores_disponibles : [];
        const tallas: string[] = Array.isArray(p.tallas_disponibles) ? p.tallas_disponibles : [];
        const variantesSimuladas: Variante[] = [];
        const tallas_por_color: Record<string, string[]> = {};
        const colores_por_talla: Record<string, string[]> = {};

        colores.forEach((color) => {
            tallas_por_color[color] = tallas;
            tallas.forEach((talla) => {
                if (!colores_por_talla[talla]) colores_por_talla[talla] = [];
                if (!colores_por_talla[talla].includes(color)) colores_por_talla[talla].push(color);

                variantesSimuladas.push({
                    id: Number(p.id),
                    color,
                    talla,
                    estado: p.estado,
                    stock: p.stock,
                    precio_adicional: 0,
                    precio_final: Number(p.precio),
                    sku: p.sku,
                    imagen_url: p.imagen
                });
            });
        });

        // ─── LÓGICA DE LA REGLA DE DESCUENTO MAOUEADA Y FALLBACK ───
        let reglaFinal: ReglaDescuento;

        if (p.reglas_descuento) {
            // CORRECCIÓN: Usamos 'cantidad_min' y 'valor_descuento' que vienen del SQL real
            reglaFinal = {
                id: Number(p.reglas_descuento.id),
                nombre: p.reglas_descuento.nombre,
                cantidad_minima: p.reglas_descuento.cantidad_min ?? 400,
                descuento_porcentaje: Number(p.reglas_descuento.valor_descuento ?? 0),
                tipo_beneficio: p.reglas_descuento.tipo_beneficio ?? 'PORCENTAJE',
                tipo_conteo: p.reglas_descuento.tipo_conteo ?? 'POR_PRODUCTO',
            };
        } else {
            // COMODÍN: Si el producto no tiene regla en la BD, creamos una estándar para cumplir que se visualice en todos
            reglaFinal = {
                id: 0,
                nombre: 'Tarifa Mayorista Estándar',
                cantidad_minima: 400,
                descuento_porcentaje: 10, // Puedes cambiar este 10% por defecto si lo deseas
                tipo_beneficio: 'PORCENTAJE',
                tipo_conteo: 'POR_PRODUCTO',
            };
        }

        return {
            id: Number(p.id),
            nombre: p.nombre,
            descripcion: p.descripcion,
            codigo: p.sku,
            precio: Number(p.precio),
            imagen: p.imagen,
            stock_disponible: p.stock,
            categoria: {
                id: p.categorias_productos ? Number(p.categorias_productos.id) : null,
                nombre: p.categorias_productos?.nombre ?? 'Sin categoría',
                imagen: p.categorias_productos?.imagen ?? null,
            },
            colores_disponibles: colores,
            tallas_disponibles: tallas,
            tallas_por_color,
            colores_por_talla,
            variantes: variantesSimuladas,
            regla_descuento: reglaFinal,
        };
    } catch (err) {
        console.error('[Portal] getProducto:', err);
        return null;
    }
}

// ─── Metadata dinámica ──────────────────────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const producto = await getProducto(id);

    if (!producto) {
        return { title: 'Producto no encontrado | Portal B2B GUOR' };
    }

    return {
        title: `${producto.nombre} | Portal B2B GUOR`,
        description:
            producto.descripcion ??
            `${producto.nombre} — ${producto.categoria.nombre}. Venta mayorista desde ${producto.regla_descuento?.cantidad_minima ?? 400} unidades.`,
        openGraph: {
            title: producto.nombre,
            description: producto.descripcion ?? undefined,
            images: producto.imagen ? [{ url: producto.imagen }] : [],
        },
    };
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default async function DetalleProductoPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!id || isNaN(Number(id))) {
        notFound();
    }

    const producto = await getProducto(id);

    if (!producto) {
        notFound();
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <DetalleProductoInteractive producto={producto} />
        </main>
    );
}