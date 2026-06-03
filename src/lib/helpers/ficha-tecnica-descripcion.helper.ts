export interface DescripcionFichaJson {
  texto: string;
  evidencias: string[];
}

export function parseDescripcionDetallada(
  raw: string | null | undefined,
): DescripcionFichaJson {
  if (!raw?.trim()) {
    return { texto: '', evidencias: [] };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      ('texto' in parsed || 'evidencias' in parsed)
    ) {
      const obj = parsed as Record<string, unknown>;
      return {
        texto: String(obj.texto ?? ''),
        evidencias: Array.isArray(obj.evidencias)
          ? obj.evidencias.map((u) => String(u))
          : [],
      };
    }
  } catch {
    /* texto plano legacy */
  }

  return { texto: raw, evidencias: [] };
}

export function buildDescripcionDetallada(
  texto: string,
  evidencias: string[],
): string {
  return JSON.stringify({
    texto: texto.trim(),
    evidencias: evidencias.filter(Boolean),
  });
}
