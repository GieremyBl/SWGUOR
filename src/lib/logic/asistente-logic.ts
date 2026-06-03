// lib/services/ia-cotizaciones.service.ts
import { getDefaultGeminiModel } from '@/lib/gemini';

// Interfaz estricta para los datos de entrada de la cotización
export interface DatosCotizacionInput {
  cliente_id:    string | number;
  total:         number;
  descuento_pct: number;
  total_prendas: number;
}

// Interfaz estricta para el JSON estructurado que responderá la IA
export interface ResultadoAnalisisIA {
  analisis:             string;
  sugerencia_comercial: string;
}

export async function analizarCotizaciónConIA(datosCotizacion: DatosCotizacionInput): Promise<ResultadoAnalisisIA> {
  const prompt = `
    Actua como un experto consultor comercial para la empresa Modas y Estilos GUOR.
    Tu objetivo es analizar la siguiente cotizacion y dar 3 consejos breves para cerrar la venta.

    DATOS DE LA COTIZACION:
    - Cliente ID: ${datosCotizacion.cliente_id}
    - Total: S/ ${datosCotizacion.total}
    - Descuento aplicado: ${datosCotizacion.descuento_pct}%
    - Cantidad total de prendas: ${datosCotizacion.total_prendas}

    INSTRUCCIONES:
    1. No utilices emojis en tu respuesta.
    2. Si el cliente esta cerca de un nivel de descuento mayor, recomiendale subir el pedido para maximizar su margen.
    3. Menciona que el pedido minimo es de 400 unidades si el actual es inferior.
    4. Manten un lenguaje formal, tecnico y orientado a negocios B2B.
    
    Responde estrictamente en formato JSON: { "analisis": "texto profesional", "sugerencia_comercial": "consejo estrategico" }
  `;

  const model = await getDefaultGeminiModel();
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  // Obtenemos el texto crudo del LLM
  const textoRespuesta = response.text();

  // Parseamos el resultado asegurando que cumpla con la interfaz de respuesta comercial
  return JSON.parse(textoRespuesta) as ResultadoAnalisisIA;
}