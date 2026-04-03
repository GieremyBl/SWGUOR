export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { SchemaType, Tool } from "@google/generative-ai";
import { getEscalaPorCantidad } from '@/lib/logic/cotizaciones-logic'; 
import { model } from '@/lib/gemini';

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "consultar_inventario",
        description: "Consulta stock y precios de productos por nombre o categoria.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            busqueda: { type: SchemaType.STRING, description: "Nombre o categoria del producto" },
            talla: { type: SchemaType.STRING, description: "Talla del producto" },
          },
          required: ["busqueda"],
        } as any,
      },
      {
        name: "cotizar_pedido",
        description: "Calcula el total con descuentos y IGV para una lista de productos.",
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
                required: ["producto_id", "cantidad"],
              } as any,
            },
          },
          required: ["items"],
        } as any,
      },
    ],
  },
];

export async function POST(req: Request) {
  try {
    const { messages, cliente_id } = await req.json();
    const { default: prisma } = await import('@/lib/prisma');
    const cliente = await prisma.clientes.findUnique({
      where: { id: cliente_id },
      select: { razon_social: true }
    });

    const systemPrompt = `Eres el asistente experto de Modas y Estilos GUOR. 
      Cliente actual: ${cliente?.razon_social || 'Desconocido'}. 
      REGLAS CRITICAS: 
      - No utilices emojis en tus respuestas bajo ninguna circunstancia.
      - Pedido minimo (MOQ): 400 unidades. 
      - IGV: 18% incluido en precios. 
      - Si el cliente pregunta por disponibilidad, usa 'consultar_inventario'.
      - Si el cliente quiere saber precios o totales, usa 'cotizar_pedido'.
      - Manten un tono profesional, directo y formal.`;

    const chat = model.startChat({
      tools: tools,
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Entendido. Soy el asistente de GUOR. ¿En que puedo ayudarle hoy?" }] },
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
    while (response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && iterations < 5) {
      const parts = response.candidates[0].content.parts;
      const toolResponses = await Promise.all(
        parts.filter(p => p.functionCall).map(async (p) => {
          const call = p.functionCall!;
          const output = await ejecutarTool(call.name, call.args);
          return { functionResponse: { name: call.name, response: output } };
        })
      );
      result = await chat.sendMessage(toolResponses);
      response = result.response;
      iterations++;
    }

    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error('ERROR_CHAT:', error);
    return NextResponse.json({ error: "Error en el servidor de chat" }, { status: 500 });
  }
}

async function ejecutarTool(nombre: string, args: any) {
  switch (nombre) {
    case 'consultar_inventario':
      const { default: prisma } = await import('@/lib/prisma');
      const productos = await prisma.productos.findMany({
        where: { 
          nombre: { contains: args.busqueda, mode: 'insensitive' },
          estado: 'activo' 
        },
        include: { variantes_producto: true },
        take: 5
      });
      return JSON.parse(JSON.stringify({ productos }, (k, v) => typeof v === 'bigint' ? v.toString() : v));

    case 'cotizar_pedido':
      const totalUnidades = args.items.reduce((s: number, i: any) => s + (i.cantidad || 0), 0);
      const escala = getEscalaPorCantidad(totalUnidades);
      return { 
        descuento_aplicable: `${escala.pct}%`,
        proximo_nivel: escala.minimoSiguiente ? `Si llega a ${escala.minimoSiguiente} unidades obtendra un mayor descuento` : "Ya cuenta con el descuento maximo",
        moq_estado: totalUnidades < 400 ? "Alerta: El pedido no alcanza el minimo de 400 unidades" : "Requisito de pedido minimo cumplido",
        total_unidades: totalUnidades
      };

    default:
      return { error: "Herramienta no implementada" };
  }
}