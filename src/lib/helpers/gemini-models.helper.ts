import { genAI } from '@/lib/gemini';
import { GEMINI_MODEL_FLASH } from '@/lib/constants/gemini';

export interface GeminiModelInfo {
  name: string;
  id: string;
  displayName?: string;
  supportedMethods: string[];
}

let cachedModelId: string | null = null;
let cachedModelsList: GeminiModelInfo[] | null = null;

function isGeminiDebugEnabled(): boolean {
  return (
    process.env.GEMINI_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development'
  );
}

function logGeminiDebug(message: string, data?: unknown): void {
  if (!isGeminiDebugEnabled()) return;
  if (data !== undefined) {
    console.log(`[Gemini Debug] ${message}`, data);
  } else {
    console.log(`[Gemini Debug] ${message}`);
  }
}

export function stripGeminiModelPrefix(name: string): string {
  return name.replace(/^models\//, '');
}

/** Lista modelos con generateContent desde la API de Google */
export async function listAvailableGeminiModels(): Promise<GeminiModelInfo[]> {
  if (cachedModelsList) return cachedModelsList;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { cache: 'no-store' },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`No se pudo listar modelos Gemini (${res.status}): ${errText}`);
  }

  const json = (await res.json()) as {
    models?: Array<{
      name: string;
      displayName?: string;
      supportedGenerationMethods?: string[];
    }>;
  };

  cachedModelsList = (json.models ?? [])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => ({
      name: m.name,
      id: stripGeminiModelPrefix(m.name),
      displayName: m.displayName,
      supportedMethods: m.supportedGenerationMethods ?? [],
    }));

  logGeminiDebug('Modelos disponibles (generateContent)', {
    total: cachedModelsList.length,
    ids: cachedModelsList.map((m) => m.id),
  });

  return cachedModelsList;
}

function pickBestModelId(
  availableIds: string[],
  preferred?: string,
): string | null {
  const normalizedPreferred = preferred?.trim();

  if (normalizedPreferred && availableIds.includes(normalizedPreferred)) {
    return normalizedPreferred;
  }

  const candidates = [
    normalizedPreferred,
    process.env.GEMINI_MODEL,
    GEMINI_MODEL_FLASH,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash',
  ].filter((c): c is string => Boolean(c));

  for (const candidate of candidates) {
    if (availableIds.includes(candidate)) {
      return candidate;
    }
  }

  const flashPdf = availableIds.find(
    (id) =>
      id.includes('flash') &&
      !id.includes('tts') &&
      !id.includes('image') &&
      !id.includes('robotics') &&
      !id.includes('computer-use') &&
      !id.includes('preview-tts'),
  );

  return flashPdf ?? availableIds[0] ?? null;
}

/**
 * Resuelve el ID exacto de un modelo disponible (con caché en memoria).
 */
export async function resolveGeminiModelId(options?: {
  preferred?: string;
  purpose?: string;
  forceRefresh?: boolean;
}): Promise<string> {
  if (cachedModelId && !options?.forceRefresh) {
    logGeminiDebug('Modelo en caché', { modelId: cachedModelId, purpose: options?.purpose });
    return cachedModelId;
  }

  const available = await listAvailableGeminiModels();
  const availableIds = available.map((m) => m.id);

  logGeminiDebug('Resolviendo modelo', {
    purpose: options?.purpose ?? 'general',
    preferred: options?.preferred ?? process.env.GEMINI_MODEL ?? GEMINI_MODEL_FLASH,
    availableCount: availableIds.length,
  });

  const resolved = pickBestModelId(availableIds, options?.preferred);

  if (!resolved) {
    throw new Error(
      'No hay modelos Gemini compatibles con generateContent para esta API key',
    );
  }

  cachedModelId = resolved;

  logGeminiDebug('Modelo seleccionado', {
    requested: options?.preferred ?? process.env.GEMINI_MODEL ?? GEMINI_MODEL_FLASH,
    resolved,
    purpose: options?.purpose,
  });

  return resolved;
}

/** Invalida caché (útil tras cambiar GEMINI_MODEL en .env) */
export function clearGeminiModelCache(): void {
  cachedModelId = null;
  cachedModelsList = null;
}

/** Prueba rápida de que el modelo responde */
export async function probeGeminiModel(modelId: string): Promise<boolean> {
  try {
    const m = genAI.getGenerativeModel({ model: modelId });
    await m.generateContent('Responde solo: OK');
    logGeminiDebug(`Probe OK: ${modelId}`);
    return true;
  } catch (e: unknown) {
    logGeminiDebug(`Probe FAIL: ${modelId}`, {
      error: e instanceof Error ? e.message : String(e),
    });
    return false;
  }
}
