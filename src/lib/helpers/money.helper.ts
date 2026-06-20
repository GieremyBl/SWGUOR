/** Redondeo monetario a 2 decimales evitando errores de coma flotante */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function multiplyMoney(a: number, b: number): number {
  return roundMoney(a * b);
}
