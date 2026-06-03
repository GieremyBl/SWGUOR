import { getGeminiFlashModel } from '@/lib/gemini';
import { resolveGeminiModelId } from '@/lib/helpers/gemini-models.helper';
import * as fs from 'fs';
import * as path from 'path';

export interface ExtraccionCotizacionProveedor {
  numero_cotizacion?: string;
  fecha_cotizacion?: string;
  fecha_vencimiento?: string;
  proveedor_nombre?: string;
  proveedor_ruc?: string;
  proveedor_email?: string;
  proveedor_telefono?: string;
  moneda?: string;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  total?: number;
  notas?: string;
}

export interface ExtraccionFichaTecnica {
  version?: string;
  descripcion?: string;
  sam_total?: number;
  costo_estimado?: number;
  medidas: Array<{
    punto_medida: string;
    talla: string;
    valor_cm: number;
    tolerancia?: number;
  }>;
  materiales?: Array<{
    nombre: string;
    composicion: string;
    porcentaje?: number;
  }>;
}

// ─── tipos internos para el resultado del schema ──────────────────────────────

interface CotizacionCampos {
  numero_externo?: string | null;
  fecha_solicitud?: string | null;
  fecha_vencimiento?: string | null;
  moneda?: string | null;
  total_estimado?: number;
  notas?: string | null;
}

interface ProveedorCampos {
  ruc?: string | null;
  razon_social?: string | null;
  email?: string | null;
  telefono?: string | null;
  contacto?: string | null;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fileToBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64');
}

function getMimeType(filePath: string): 'image/png' | 'image/jpeg' | 'image/webp' {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, 'image/png' | 'image/jpeg' | 'image/webp'> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };
  return map[ext] ?? 'image/png';
}

function parseJSON<T>(raw: string): T {
  const patterns = [
    /```json\n?([\s\S]*?)\n?```/,
    /```\n?([\s\S]*?)\n?```/,
    /\{[\s\S]*\}/,
  ];

  let jsonStr = raw.trim();

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) {
      jsonStr = match[1] ?? match[0];
      break;
    }
  }

  jsonStr = jsonStr.trim();

  if (!jsonStr.startsWith('{')) {
    const firstBrace = jsonStr.indexOf('{');
    if (firstBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace);
    }
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('❌ Error parseando JSON. Raw response:', raw);
    console.error('❌ Extracted string:', jsonStr);
    throw new Error(`JSON inválido de Gemini: ${error instanceof Error ? error.message : 'desconocido'}`);
  }
}

// ─── extracción desde imagen geometral ───────────────────────────────────────

export async function extraerFichaTecnica(
  imagePath: string
): Promise<ExtraccionFichaTecnica> {
  const base64Data = fileToBase64(imagePath);
  const mimeType = getMimeType(imagePath);

  const prompt = `
Eres un experto en patronaje y fichas técnicas de confección textil.
Analiza detenidamente esta imagen geometral (dibujo técnico) de una prenda.
Tu objetivo principal es extraer TODA la tabla de medidas o las cotas indicadas en el dibujo.

Extrae la información en el siguiente formato JSON:
{
  "medidas": [
    {
      "punto_medida": "Descripción clara del punto (ej: Ancho de Pecho, Largo Total, Caída de Hombro)",
      "talla": "Talla especificada o 'M' por defecto",
      "valor_cm": número (solo el valor numérico en cm),
      "tolerancia": número o null (ej: 0.5 si indica ±0.5)
    }
  ],
  "materiales": [
    {
      "nombre": "Nombre del material",
      "composicion": "Composición (ej: 100% Algodón)",
      "porcentaje": número o null
    }
  ],
  "sam_total": número (minutos de manufactura si están presentes),
  "costo_estimado": número (si está presente),
  "descripcion": "Descripción técnica breve del modelo"
}

INSTRUCCIONES CRÍTICAS:
1. Si ves flechas con números sobre la prenda, asocia cada número a un punto de medida.
2. Si hay una tabla de medidas de texto en la imagen, procésala completa.
3. Asegúrate de que "valor_cm" sea siempre un número. Si ves una fracción como 1/2, conviértela a decimal.
4. Responde ÚNICAMENTE con el objeto JSON.
`;

  try {
    const modelId = await resolveGeminiModelId({ purpose: 'extract-ficha-tecnica' });
    const model = getGeminiFlashModel(modelId);
    const response = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const content = response.response.text();
    console.log('📤 Respuesta de Gemini (primeros 500 chars):', content.substring(0, 500));

    return parseJSON<ExtraccionFichaTecnica>(content);
  } catch (error: any) {
    console.error('❌ Error al extraer ficha técnica desde imagen:', error.message);
    throw new Error(`Fallo al extraer información de la imagen geometral: ${error.message}`);
  }
}

// ─── extracción de cotización ─────────────────────────────────────────────────

export async function extraerCotizacionProveedor(
  pdfPath: string,
): Promise<ExtraccionCotizacionProveedor> {
  const { extraerCotizacionProveedorDesdeArchivo } = await import(
    '@/lib/helpers/cotizacion-gemini-extraction'
  );
  const data = await extraerCotizacionProveedorDesdeArchivo(pdfPath);

  // Tipamos los fallbacks explícitamente para que TypeScript
  // conozca la forma del objeto aunque cotizacion/proveedor sean undefined
  const p: ProveedorCampos = data.proveedor ?? {};
  const c: CotizacionCampos = data.cotizacion ?? {};

  return {
    numero_cotizacion: c.numero_externo ?? undefined,
    fecha_cotizacion: c.fecha_solicitud ?? undefined,
    fecha_vencimiento: c.fecha_vencimiento ?? undefined,
    proveedor_nombre: p.razon_social ?? undefined,
    proveedor_ruc: p.ruc ?? undefined,
    proveedor_email: p.email ?? undefined,
    proveedor_telefono: p.telefono ?? undefined,
    moneda: c.moneda ?? undefined,
    items: (data.items ?? []).map((item) => ({
      descripcion: item.descripcion ?? '',
      cantidad: Number(item.cantidad) || 0,
      precio_unitario: Number(item.precio_unitario) || 0,
      subtotal: Number(item.subtotal) || 0,
    })),
    total: Number(c.total_estimado) || 0,
    notas: c.notas ?? undefined,
  };
}

// ─── extracción genérica ──────────────────────────────────────────────────────

export async function extraerConPromptCustom(
  filePath: string,
  tipoExtraccion: 'cotizacion' | 'ficha_tecnica' | 'medidas' | 'custom',
  promptCustom?: string
): Promise<any> {
  const base64Data = fileToBase64(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);

  const mimeType = isImage
    ? getMimeType(filePath)
    : 'application/pdf';

  const prompts: Record<string, string> = {
    cotizacion: 'Extrae datos de cotización: número, fecha, proveedor, items. Retorna JSON.',
    ficha_tecnica: 'Extrae medidas, materiales, SAM y costo estimado. Retorna JSON.',
    medidas: 'Extrae tabla de medidas con puntos, tallas y valores en cm. Retorna JSON.',
  };

  const prompt = promptCustom ?? prompts[tipoExtraccion] ?? 'Extrae toda la información relevante en JSON.';

  try {
    const modelId = await resolveGeminiModelId({ purpose: `extract-${tipoExtraccion}` });
    const model = getGeminiFlashModel(modelId);
    const response = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: base64Data } },
    ]);

    const content = response.response.text();
    return parseJSON<any>(content);
  } catch (error: any) {
    console.error('Error en extracción personalizada:', error);
    throw new Error(`Fallo en extracción: ${error.message}`);
  }
}