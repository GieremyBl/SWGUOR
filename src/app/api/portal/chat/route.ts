export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { SchemaType, Tool } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { requireServerAuth } from '@/lib/auth/server';
import { getDefaultGeminiModel } from '@/lib/gemini';
import { buildUiBlocksDesdePreview, buildUiBlocksDesdePreviewIncidencia } from '@/lib/helpers/guorino-chat-ui.helper';
import { prepararPedidoGuorino } from '@/lib/services/guorino-pedido.service';
import { prepararIncidenciaGuorino } from '@/lib/services/guorino-incidencia.service';
import type { GuorinoUiBlock } from '@/lib/types/guorino-chat';

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
            talla: { type: SchemaType.STRING, description: 'Talla específica (XS, S, M, L, XL, XXL)' },
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
                  cantidad: { type: SchemaType.NUMBER },
                },
                required: ['producto_id', 'cantidad'],
              } as any,
            },
          },
          required: ['items'],
        } as any,
      },
      {
        name: 'preparar_pedido',
        description:
          'Valida stock, MOQ y reglas de negocio, y genera una previsualización de pedido para que el cliente confirme o deniegue.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  producto_id: { type: SchemaType.NUMBER },
                  cantidad: { type: SchemaType.NUMBER },
                  talla_snapshot: { type: SchemaType.STRING },
                  color_snapshot: { type: SchemaType.STRING },
                },
                required: ['producto_id', 'cantidad'],
              } as any,
            },
            notas_cliente: { type: SchemaType.STRING },
          },
          required: ['items'],
        } as any,
      },
      {
        name: 'consultar_pedidos_cliente',
        description:
          'Lista los pedidos recientes del cliente para consultas de estado o reporte de incidencias.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            limite: { type: SchemaType.NUMBER, description: 'Cantidad máxima de pedidos (default 8)' },
          },
        } as any,
      },
      {
        name: 'preparar_incidencia',
        description:
          'Prepara un reporte de incidencia post-venta vinculado a un pedido. El cliente debe confirmar o denegar antes de registrarlo.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            pedido_id: { type: SchemaType.NUMBER },
            tipo: {
              type: SchemaType.STRING,
              description:
                'defecto_confeccion | pedido_equivocado | talla_incorrecta | cantidad_incorrecta | dano_en_transporte | empaque_defectuoso | otro',
            },
            descripcion: { type: SchemaType.STRING, description: 'Detalle del problema (mín. 10 caracteres)' },
            severidad: { type: SchemaType.STRING, description: 'baja | media | alta' },
          },
          required: ['pedido_id', 'tipo', 'descripcion'],
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
      select: { id: true, razon_social: true, direccion_fiscal: true },
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

    const systemPrompt = `Eres Guorino, el asistente comercial experto de Modas y Estilos GUOR.
      Estás atendiendo a: ${nombreCliente}.
      REGLAS CRÍTICAS:
      - NO utilices emojis en tus respuestas bajo ninguna circunstancia.
      - Pedido mínimo (MOQ): 400 unidades por producto y en total del pedido.
      - IGV: 18% incluido en todos los precios.
      - Si el cliente pregunta por disponibilidad o stock, usa 'consultar_inventario'.
      - Si el cliente quiere cotizar sin compromiso, usa 'cotizar_pedido'.
      - Si el cliente pide realizar, confirmar o generar un pedido, SIEMPRE usa 'preparar_pedido' después de verificar stock.
      - Si el cliente consulta el estado de sus pedidos, usa 'consultar_pedidos_cliente'.
      - Si el cliente reporta un problema, defecto o incidencia con un pedido, usa 'consultar_pedidos_cliente' si no conoce el número y luego 'preparar_incidencia'.
      - Para incidencias, confirma pedido_id, tipo, descripción clara y severidad (baja, media, alta) antes de preparar el reporte.
      - Explica con claridad las reglas de negocio cuando no se pueda comprar o reportar (stock, MOQ, pedido inexistente).
      - Si el caso es muy complejo o el cliente pide hablar con una persona, indique que puede contactar soporte humano por WhatsApp o el módulo Soporte del portal.
      - Mantén un tono profesional, directo y formal orientado a negocios B2B.
      - Responde siempre en español.`;

    const model = await getDefaultGeminiModel();
    let uiBlocks: GuorinoUiBlock[] = [];
    const chat = model.startChat({
      tools,
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Entendido. Soy el asistente comercial de GUOR. Bienvenido/a, ${nombreCliente}. ¿En qué puedo ayudarle hoy?` }] },
        ...messages.slice(0, -1).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      ],
    });

    const lastMsg = messages[messages.length - 1].content;
    let result = await chat.sendMessage(lastMsg);
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
            const call = p.functionCall!;
            const output = await ejecutarTool(call.name, call.args, {
              clienteId: clienteDb?.id ?? null,
              direccionDespacho: clienteDb?.direccion_fiscal ?? null,
            });
            if (output._ui_blocks) {
              uiBlocks = output._ui_blocks as GuorinoUiBlock[];
            }
            const { _ui_blocks: _omit, ...clean } = output as Record<string, unknown>;
            return { functionResponse: { name: call.name, response: clean } };
          })
      );
      result = await chat.sendMessage(toolResponses);
      response = result.response;
      iterations++;
    }

    return NextResponse.json({
      success: true,
      text: response.text(),
      cliente: nombreCliente,
      ui_blocks: uiBlocks.length > 0 ? uiBlocks : undefined,
    });
  } catch (error: any) {
    console.error('[Portal Chat] Error completo:', {
      message: error.message,
      status: error.status,
      details: error.errorDetails ?? error.cause ?? null,
    });
    return NextResponse.json({ error: 'Error en el servidor de chat' }, { status: 500 });
  }
}

// ─── Tool Executors ──────────────────────────────────────────────────────────

async function ejecutarTool(
  nombre: string,
  args: any,
  ctx: { clienteId: bigint | null; direccionDespacho: string | null },
) {
  switch (nombre) {
    case 'consultar_inventario': {
      const where: Record<string, unknown> = { estado: 'activo' };

      if (args.busqueda) {
        const categorias = await prisma.categorias_productos.findMany({
          where: { nombre: { contains: args.busqueda, mode: 'insensitive' } },
          select: { id: true },
        });
        const categoriaIds = categorias.map((c) => c.id);
        where.OR = [
          { nombre: { contains: args.busqueda, mode: 'insensitive' } },
          { sku: { contains: args.busqueda, mode: 'insensitive' } },
          ...(categoriaIds.length > 0 ? [{ categoria_id: { in: categoriaIds } }] : []),
        ];
      }

      const productos = await prisma.productos.findMany({
        where,
        include: {
          categorias_productos: { select: { nombre: true } },
          variantes_producto: {
            where: { estado: 'activo', stock: { gt: 0 } },
            select: { id: true, color: true, talla: true, stock: true, precio_adicional: true, sku: true },
          },
        },
        take: 8,
      });

      return {
        productos: productos.map((p) => ({
          id: p.id.toString(),
          nombre: p.nombre,
          categoria: p.categorias_productos?.nombre ?? 'Sin categoría',
          precio: Number(p.precio),
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

      const productoIds = args.items.map((i: { producto_id: number }) => Number(i.producto_id)).filter(Boolean);
      const productos = await prisma.productos.findMany({
        where: { id: { in: productoIds }, estado: 'activo' },
        select: { id: true, nombre: true, precio: true, moq: true },
      });
      const precioMap = new Map(productos.map((p) => [p.id.toString(), p]));

      const itemsCalculo = args.items.map((item: { producto_id: number; cantidad: number }) => {
        const prod = precioMap.get(String(item.producto_id));
        return {
          producto_id: item.producto_id,
          cantidad: item.cantidad || 0,
          precio_unitario: prod ? Number(prod.precio) : 0,
        };
      });

      const { calcularDescuentosEscalaAutomaticos } = await import(
        '@/lib/services/descuento-escala-automatico.service'
      );
      const { REGLAS_NEGOCIO } = await import('@/lib/constants/estados');
      const totales = await calcularDescuentosEscalaAutomaticos(itemsCalculo);
      const pctDescuento =
        totales.subtotalBruto > 0
          ? Math.round((totales.montoDescuento / totales.subtotalBruto) * 10000) / 100
          : 0;

      return {
        items_detalle: args.items.map((item: { producto_id: number; cantidad: number }) => {
          const prod = precioMap.get(String(item.producto_id));
          return {
            producto: prod?.nombre ?? `Producto #${item.producto_id}`,
            cantidad: item.cantidad,
            precio_unitario: prod ? Number(prod.precio) : 0,
            subtotal: prod ? Number(prod.precio) * (item.cantidad || 0) : 0,
          };
        }),
        subtotal_bruto: totales.subtotalBruto,
        total_unidades: totales.cantidadTotal,
        descuento_aplicado: `${pctDescuento}%`,
        monto_descuento: totales.montoDescuento,
        subtotal_con_descuento: totales.subtotalConDescuento,
        igv: totales.igv,
        total: totales.total,
        cumple_moq: totales.cumpleMOQ,
        moq_estado: totales.cumpleMOQ
          ? 'Requisito de pedido mínimo cumplido'
          : `Alerta: No alcanza el mínimo de ${REGLAS_NEGOCIO.MOQ_GENERAL} unidades (actual: ${totales.cantidadTotal})`,
        detalle_descuentos_por_producto: totales.detallePorProducto,
      };
    }

    case 'preparar_pedido': {
      if (!ctx.clienteId) {
        return { error: 'Solo clientes del portal pueden generar pedidos desde Guorino.' };
      }
      if (!args.items?.length) {
        return { error: 'Indique productos y cantidades para preparar el pedido.' };
      }

      try {
        const preview = await prepararPedidoGuorino({
          clienteId: ctx.clienteId,
          items: args.items,
          direccion_despacho: ctx.direccionDespacho,
          notas_cliente: args.notas_cliente ?? null,
        });

        return {
          preview_id: preview.id,
          total: preview.totales.total,
          total_unidades: preview.totales.total_unidades,
          cumple_reglas: preview.errores.length === 0 && preview.totales.cumple_moq_global,
          errores: preview.errores,
          advertencias: preview.advertencias,
          items: preview.items.map((i) => ({
            producto_id: i.producto_id,
            nombre: i.nombre,
            cantidad: i.cantidad,
            subtotal: i.subtotal,
            stock_disponible: i.stock_disponible,
            moq: i.moq,
          })),
          _ui_blocks: buildUiBlocksDesdePreview(preview),
        };
      } catch (error: unknown) {
        return {
          error: error instanceof Error ? error.message : 'No se pudo preparar el pedido',
        };
      }
    }

    case 'consultar_pedidos_cliente': {
      if (!ctx.clienteId) {
        return { error: 'Solo clientes del portal pueden consultar sus pedidos.' };
      }
      const limite = Math.min(Math.max(Number(args.limite) || 8, 1), 15);
      const pedidos = await prisma.pedidos.findMany({
        where: { cliente_id: ctx.clienteId },
        orderBy: { created_at: 'desc' },
        take: limite,
        select: {
          id: true,
          estado: true,
          total: true,
          total_unidades: true,
          created_at: true,
        },
      });

      return {
        pedidos: pedidos.map((p) => ({
          id: p.id.toString(),
          estado: p.estado,
          total: Number(p.total),
          total_unidades: p.total_unidades,
          fecha: p.created_at?.toISOString() ?? null,
        })),
        total: pedidos.length,
      };
    }

    case 'preparar_incidencia': {
      if (!ctx.clienteId) {
        return { error: 'Solo clientes del portal pueden reportar incidencias desde Guorino.' };
      }
      if (!args.pedido_id || !args.tipo || !args.descripcion) {
        return { error: 'Indique pedido_id, tipo y descripción del problema.' };
      }

      try {
        const preview = await prepararIncidenciaGuorino({
          clienteId: ctx.clienteId,
          pedido_id: Number(args.pedido_id),
          tipo: String(args.tipo),
          descripcion: String(args.descripcion),
          severidad: args.severidad ? String(args.severidad) : undefined,
        });

        return {
          preview_id: preview.id,
          pedido_id: preview.pedido_id,
          tipo: preview.tipo_label,
          severidad: preview.severidad,
          cumple_reglas: preview.errores.length === 0,
          errores: preview.errores,
          _ui_blocks: buildUiBlocksDesdePreviewIncidencia(preview),
        };
      } catch (error: unknown) {
        return {
          error: error instanceof Error ? error.message : 'No se pudo preparar la incidencia',
        };
      }
    }

    default:
      return { error: 'Herramienta no implementada' };
  }
}