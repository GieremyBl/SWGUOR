import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta GEMINI_API_KEY en las variables de entorno');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Modelo JSON para extracción (CUS_44).
 * Sin systemInstruction en la inicialización — el prompt va en generateContent.
 */
export function getGeminiJsonModel(modelId: string) {
  return genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      responseMimeType: 'application/json',
    },
  });
}

/** Modelo general (fichas técnicas, etc.) — requiere modelId resuelto */
export function getGeminiFlashModel(modelId: string) {
  return genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
    },
  });
}

let cachedDefaultModel: ReturnType<typeof getGeminiFlashModel> | null = null;

/** Modelo por defecto resuelto contra la API (chat portal, asistente, etc.) */
export async function getDefaultGeminiModel() {
  if (!cachedDefaultModel) {
    const { resolveGeminiModelId } = await import('@/lib/helpers/gemini-models.helper');
    const modelId = await resolveGeminiModelId({ purpose: 'default' });
    cachedDefaultModel = getGeminiFlashModel(modelId);
  }
  return cachedDefaultModel;
}
