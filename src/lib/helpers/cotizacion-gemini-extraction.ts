import * as fs from 'fs';
import { getGeminiJsonModel } from '@/lib/gemini';
import { resolveGeminiModelId } from '@/lib/helpers/gemini-models.helper';
import {
  cotizacionExtraccionIASchema,
  type CotizacionExtraccionIA,
} from '@/lib/schemas/cotizacion-extraccion-ia';

const SYSTEM_PROMPT = `Eres un extractor de datos para un ERP textil (Perú).
Analiza el PDF de cotización de proveedor y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:

{
  "proveedor": {
    "ruc": "11 dígitos si aparece, sino null",
    "razon_social": "razón social o nombre comercial",
    "email": "correo o null",
    "telefono": "teléfono o null",
    "contacto": "persona de contacto o null"
  },
  "cotizacion": {
    "numero_externo": "número/código de cotización del proveedor",
    "fecha_solicitud": "YYYY-MM-DD fecha del documento",
    "fecha_vencimiento": "YYYY-MM-DD validez/vencimiento o null",
    "moneda": "PEN | USD | EUR (normalizar)",
    "total_estimado": número,
    "notas": "condiciones u observaciones generales o null"
  },
  "items": [
    {
      "descripcion": "texto del producto/servicio",
      "cantidad": número,
      "unidad": "unidades | metros | kg | etc.",
      "precio_unitario": número,
      "subtotal": número,
      "tipo_item": "insumo | material"
    }
  ]
}

Reglas:
- Mapea campos al esquema anterior; no inventes claves extra.
- Incluye TODOS los ítems tabulados del PDF.
- Si un campo no existe: null en strings, 0 en números.
- moneda solo PEN, USD o EUR.
- tipo_item: "material" si es tela/hilo/tela; si no, "insumo".
- Fechas siempre YYYY-MM-DD o null.`;

function parseGeminiJson(raw: string): unknown {
  const cleaned = raw
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('La respuesta de Gemini no contiene JSON');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Compatibilidad con extracciones legacy (campos planos) */
function normalizarLegacy(raw: Record<string, unknown>): CotizacionExtraccionIA {
  const items = Array.isArray(raw.items)
    ? raw.items
    : [];

  return cotizacionExtraccionIASchema.parse({
    proveedor: {
      ruc: raw.proveedor_ruc ?? raw.ruc,
      razon_social: raw.proveedor_nombre ?? raw.razon_social,
      email: raw.proveedor_email ?? raw.email,
      telefono: raw.proveedor_telefono ?? raw.telefono,
      contacto: raw.contacto,
    },
    cotizacion: {
      numero_externo: raw.numero_externo ?? raw.numero_cotizacion,
      fecha_solicitud: raw.fecha_solicitud ?? raw.fecha_cotizacion,
      fecha_vencimiento: raw.fecha_vencimiento,
      moneda: raw.moneda,
      total_estimado: raw.total_estimado ?? raw.total,
      notas: raw.notas,
    },
    items,
  });
}

function normalizarAnidado(raw: Record<string, unknown>): CotizacionExtraccionIA {
  if (raw.proveedor || raw.cotizacion) {
    return cotizacionExtraccionIASchema.parse(raw);
  }
  return normalizarLegacy(raw);
}

/**
 * Extrae datos de cotización desde un buffer PDF (CUS_44).
 */
export async function extraerCotizacionProveedorDesdeBuffer(
  pdfBuffer: Buffer,
): Promise<CotizacionExtraccionIA> {
  const base64Data = pdfBuffer.toString('base64');
  const modelId = await resolveGeminiModelId({
    purpose: 'extract-cotizacion-pdf',
  });
  const jsonModel = getGeminiJsonModel(modelId);

  const response = await jsonModel.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: 'Extrae la cotización del PDF según el esquema indicado. Responde solo con el JSON.',
    },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data,
      },
    },
  ]);

  const content = response.response.text();
  const parsed = parseGeminiJson(content) as Record<string, unknown>;
  return normalizarAnidado(parsed);
}

export async function extraerCotizacionProveedorDesdeArchivo(
  pdfPath: string,
): Promise<CotizacionExtraccionIA> {
  const buffer = fs.readFileSync(pdfPath);
  return extraerCotizacionProveedorDesdeBuffer(buffer);
}
