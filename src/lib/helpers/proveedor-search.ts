export interface ProveedorSearchable {
  id: string | number;
  razon_social: string;
  ruc?: string;
  email?: string;
}

/** Normaliza texto para búsqueda flexible (sin tildes, minúsculas, sin espacios) */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * Puntúa coincidencia entre consulta y texto objetivo (0–100).
 * Permite coincidencias parciales tipo "hola" vs "HOL", "holA".
 */
export function scoreTextMatch(query: string, target: string): number {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(target);
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.includes(q)) return 90;
  if (q.includes(t)) return 85;
  if (t.startsWith(q) || q.startsWith(t)) return 75;

  let hits = 0;
  for (const char of q) {
    if (t.includes(char)) hits += 1;
  }
  const ratio = hits / q.length;
  if (ratio >= 0.6) return Math.round(50 + ratio * 30);
  return 0;
}

export function filterProveedoresByQuery<T extends ProveedorSearchable>(
  proveedores: T[],
  query: string,
  minScore = 40,
): T[] {
  const q = query.trim();
  if (!q) return proveedores;

  return proveedores
    .map((p) => {
      const scoreRazon = scoreTextMatch(q, p.razon_social);
      const scoreRuc = p.ruc ? scoreTextMatch(q, p.ruc) : 0;
      const scoreEmail = p.email ? scoreTextMatch(q, p.email) : 0;
      return { p, score: Math.max(scoreRazon, scoreRuc, scoreEmail) };
    })
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p);
}
