import { NextResponse } from 'next/server';
import { getDefaultGeminiModel } from '@/lib/gemini';
import { requireServerAuth } from '@/lib/auth/server';

export async function POST(req: Request) {
  try {
    const auth = await requireServerAuth();
    if (!auth.success) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { items, resumen } = await req.json();

    const prompt = `Analiza la siguiente cotización B2B de una empresa textil y proporciona un "Insight de IA" estratégico.
    
    Datos de la cotización:
    - Items: ${JSON.stringify(items)}
    - Resumen: ${JSON.stringify(resumen)}
    
    Reglas de negocio:
    - MOQ (Mínimo por pedido): 400 unidades.
    - Escalas de descuento: 1,000 uds (5%), 5,000 uds (12%), 10,000 uds (18%).
    
    Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
    {
      "mensaje": "Resumen breve del análisis",
      "sugerencia": "Recomendación específica para optimizar el pedido",
      "tipo": "ahorro" | "stock" | "estrategico",
      "impacto": "Monto de ahorro estimado o beneficio clave"
    }`;

    const model = await getDefaultGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpiar respuesta por si acaso viene con markdown
    const cleanedText = text.replace(/```json\n?/, '').replace(/```/, '').trim();
    const insight = JSON.parse(cleanedText);

    return NextResponse.json({ success: true, insight });
  } catch (error: any) {
    console.error('[Analizar Cotización] Error:', error);
    return NextResponse.json({ error: 'Error al procesar el análisis de IA' }, { status: 500 });
  }
}
