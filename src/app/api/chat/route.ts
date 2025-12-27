import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

// Permitir respuestas de hasta 30 segundos
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'), // El modelo más potente y rápido de Groq
    messages,
    system: "Eres un asistente experto para una tienda e-commerce. Sé amable y conciso.",
  });

  return result.toTextStreamResponse();
}