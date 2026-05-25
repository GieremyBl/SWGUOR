export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { SchemaType, Tool } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { requireServerAuth } from '@/lib/auth/server';
import { getDefaultGeminiModel } from '@/lib/gemini';

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'consultar_inventario',
        description: 'Consulta stock y precios de productos activos por nombre o categoría.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            busqueda: { type: SchemaType.STRING, description: 'Nombre del producto o categoría a buscar' },
            talla:    { type: SchemaType.STRING, description: 'Talla específica (XS, S, M, L, XL, XXL)' },
          },
          required: ['busqueda'],
        } as any,
      },
      {
        name: 'cotizar_pedido',
        description: 'Calcula el total con descuentos escalonados e IGV (18%). Valida MOQ de 400 unidades.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  producto_id: { type: SchemaType.NUMBER },
                  cantidad:    { type: SchemaType.NUMBER },
                },
                required: ['producto_id', 'cantidad'],
              } as any,
            },
          },
          required: ['items'],
        } as any,
      },
    ],
  },
];

export async function POST(req: Request) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: 'no_auth' }, { status: auth.status });
    }

    // usuarios ya NO tiene nombre_completo — lo obtenemos desde clientes o personal_interno
    const clienteDb = await prisma.clientes.findFirst({
      where: { usuario_id: auth.user.id },
      select: { id: true, razon_social: true },
    });

    // Para personal interno, obtener nombre desde personal_interno
    const personalDb = !clienteDb
      ? await prisma.personal_interno.findFirst({
          where: { usuario_id: auth.user.id },
          select: { nombre_completo: true },
        })
      : null;

    const nombreCliente =
      clienteDb?.razon_social ??
      personalDb?.nombre_completo ??
      'Estimado cliente';

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Se requieren mensajes' }, { status: 400 });
    }

    const systemPrompt = `Eres el asistente experto de Modas y Estilos GUOR.
      Estás atendiendo a: ${nombreCliente}.
      REGLAS CRÍTICAS:
      - NO utilices emojis en tus respuestas bajo ninguna circunstancia.
      - Pedido mínimo (MOQ): 400 unidades.
      - IGV: 18% incluido en todos los precios.
      - Escalas de descuento: 400-999 (0%), 1000-4999 (5%), 5000-9999 (12%), 10000+ (18%).
      - Si el cliente pregunta por disponibilidad o stock, usa 'consultar_inventario'.
      - Si el cliente quiere saber precios o armar un pedido, usa 'cotizar_pedido'.
      - Mantén un tono profesional, directo y formal orientado a negocios B2B.
      - Responde siempre en español.`;

    const model = await getDefaultGeminiModel();
    const chat = model.startChat({
      tools,
      history: [
        { role: 'user',  parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Entendido. Soy el asistente comercial de GUOR. Bienvenido/a, ${nombreCliente}. ¿En qué puedo ayudarle hoy?` }] },
        ...messages.slice(0, -1).map((m: any) => ({
          role:  m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      ],
    });

    const lastMsg = messages[messages.length - 1].content;
    let result   = await chat.sendMessage(lastMsg);
    let response = result.response;

    let iterations = 0;
    while (
      response.candidates?.[0]?.content?.parts?.some((p) => p.functionCall) &&
      iterations < 5
    ) {
      const parts = response.candidates[0].content.parts;
      const toolResponses = await Promise.all(
        parts
          .filter((p) => p.functionCall)
          .map(async (p) => {
            const call   = p.functionCall!;
            const output = await ejecutarTool(call.name, call.args);
            return { functionResponse: { name: call.name, response: output } };
          })
      );
      result   = await chat.sendMessage(toolResponses);
      response = result.response;
      iterations++;
    }

    return NextResponse.json({ success: true, text: response.text(), cliente: nombreCliente });
  } catch (error: any) {
    console.error('[Portal Chat] Error completo:', {
      message: error.message,
      status:  error.status,
      details: error.errorDetails ?? error.cause ?? null,
    });
  return NextResponse.json({ error: 'Error en el servidor de chat' }, { status: 500 });
  }
}

// ─── Tool Executors ──────────────────────────────────────────────────────────

const ESCALAS_DESCUENTO = [
  { min: 400,   dcto: 0.00 },
  { min: 1000,  dcto: 0.05 },
  { min: 5000,  dcto: 0.12 },
  { min: 10000, dcto: 0.18 },
];

async function ejecutarTool(nombre: string, args: any) {
  switch (nombre) {
    case 'consultar_inventario': {
      const where: Record<string, unknown> = { estado: 'activo' };

      if (args.busqueda) {
        const categorias = await prisma.categorias.findMany({
          where: { nombre: { contains: args.busqueda, mode: 'insensitive' } },
          select: { id: true },
        });
        const categoriaIds = categorias.map((c) => c.id);
        where.OR = [
          { nombre: { contains: args.busqueda, mode: 'insensitive' } },
          ...(categoriaIds.length > 0 ? [{ categoria_id: { in: categoriaIds } }] : []),
        ];
      }

      const productos = await prisma.productos.findMany({
        where,
        include: {
          categorias: { select: { nombre: true } },
          variantes_producto: {
            where: { estado: 'activo', stock: { gt: 0 } },
            select: { id: true, color: true, talla: true, stock: true, precio_adicional: true, sku: true },
          },
        },
        take: 8,
      });

      return {
        productos: productos.map((p) => ({
          id:       p.id.toString(),
          nombre:   p.nombre,
          categoria: p.categorias?.nombre ?? 'Sin categoría',
          precio:   Number(p.precio),
          variantes: p.variantes_producto.map((v) => ({
            color: v.color, talla: v.talla,
            stock: v.stock,
            precio_adicional: Number(v.precio_adicional),
            sku: v.sku,
          })),
        })),
        total_encontrados: productos.length,
      };
    }

    case 'cotizar_pedido': {
      if (!args.items || !Array.isArray(args.items) || args.items.length === 0) {
        return { error: 'Se requieren items con producto_id y cantidad' };
      }

      const productoIds = args.items.map((i: any) => Number(i.producto_id)).filter(Boolean);
      const productos   = await prisma.productos.findMany({
        where: { id: { in: productoIds }, estado: 'activo' },
        select: { id: true, nombre: true, precio: true, moq: true },
      });
      const precioMap = new Map(productos.map((p) => [p.id.toString(), p]));

      const subtotalBruto   = args.items.reduce((acc: number, item: any) => {
        const prod = precioMap.get(String(item.producto_id));
        return acc + (prod ? Number(prod.precio) : 0) * (item.cantidad || 0);
      }, 0);
      const totalUnidades   = args.items.reduce((s: number, i: any) => s + (i.cantidad || 0), 0);
      const escala          = [...ESCALAS_DESCUENTO].reverse().find((r) => totalUnidades >= r.min);
      const pctDescuento    = (escala?.dcto ?? 0) * 100;
      const montoDescuento  = subtotalBruto * (escala?.dcto ?? 0);
      const subtotalConDesc = subtotalBruto - montoDescuento;
      const igv             = subtotalConDesc * 0.18;
      const total           = subtotalConDesc + igv;
      const escalaSiguiente = ESCALAS_DESCUENTO.find((r) => r.min > totalUnidades);

      return {
        items_detalle: args.items.map((item: any) => {
          const prod = precioMap.get(String(item.producto_id));
          return {
            producto: prod?.nombre ?? `Producto #${item.producto_id}`,
            cantidad: item.cantidad,
            precio_unitario: prod ? Number(prod.precio) : 0,
            subtotal: prod ? Number(prod.precio) * (item.cantidad || 0) : 0,
          };
        }),
        subtotal_bruto:           Math.round(subtotalBruto   * 100) / 100,
        total_unidades:           totalUnidades,
        descuento_aplicado:       `${pctDescuento}%`,
        monto_descuento:          Math.round(montoDescuento  * 100) / 100,
        subtotal_con_descuento:   Math.round(subtotalConDesc * 100) / 100,
        igv:                      Math.round(igv             * 100) / 100,
        total:                    Math.round(total           * 100) / 100,
        cumple_moq:               totalUnidades >= 400,
        moq_estado:               totalUnidades < 400
          ? `Alerta: No alcanza el mínimo de 400 unidades (actual: ${totalUnidades})`
          : 'Requisito de pedido mínimo cumplido',
        proximo_nivel: escalaSiguiente
          ? `Si llega a ${escalaSiguiente.min} unidades obtendrá ${(escalaSiguiente.dcto * 100).toFixed(0)}% de descuento`
          : 'Ya cuenta con el descuento máximo disponible',
      };
    }

    default:
      return { error: 'Herramienta no implementada' };
  }
}