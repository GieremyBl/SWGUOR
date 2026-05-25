import { getDefaultGeminiModel } from '@/lib/gemini';

export async function analizarCotizaciónConIA(datosCotizacion: any) {
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
  return JSON.parse(response.text());
}