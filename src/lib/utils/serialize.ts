/**
 * Serializa recursivamente un objeto convirtiendo BigInt en tipos JSON-safe.
 *
 * Estrategia:
 * - Si el BigInt cabe en Number.MAX_SAFE_INTEGER → se convierte a `number`
 * - Si excede el rango seguro → se convierte a `string` (preserva precisión)
 *
 * Uso típico en rutas de API:
 * return NextResponse.json(serializeBigInt(data));
 */

const SAFE_LIMIT = BigInt(Number.MAX_SAFE_INTEGER);

function serializeBigIntValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    if (value >= -SAFE_LIMIT && value <= SAFE_LIMIT) {
      return Number(value);
    }
    return value.toString();
  }
  return value;
}

/**
 * Guardia de tipo seguro para validar si un objeto desconocido implementa 
 * la interfaz de un objeto Decimal de Prisma sin usar casting a 'any'.
 */
function isDecimalLike(obj: object): obj is { toNumber: () => number } {
  return (
    ('_isDecimal' in obj && (obj as { _isDecimal: unknown })._isDecimal === true) ||
    (obj.constructor && obj.constructor.name === 'Decimal') ||
    ('toDecimalPlaces' in obj && typeof (obj as { toDecimalPlaces: unknown }).toDecimalPlaces === 'function')
  );
}

export function serializeBigInt<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return serializeBigIntValue(data) as T;
  }

  if (typeof data !== "object") {
    return data;
  }

  // Date → ISO string
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  // Decimal objects de Prisma → extraer valor numérico sin usar 'any'
  if (isDecimalLike(data)) {
    return Number(data.toNumber()) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInt(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = serializeBigInt(value);
  }
  return result as T;
}

/**
 * Convierte cualquier BigInt del objeto a string (siempre seguro, sin pérdida).
 * Útil cuando necesitas IDs como string en el frontend.
 */
export function stringifyBigInts<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return data.toString() as T;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => stringifyBigInts(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = stringifyBigInts(value);
  }
  return result as T;
}