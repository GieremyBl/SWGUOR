/**
 * Formatear precio en soles peruanos
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Formatear fecha
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Formatear fecha y hora
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Formatear fecha corta
 */
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

/**
 * Formatear RUC
 */
export function formatRUC(ruc: number | string): string {
  const rucStr = ruc.toString();
  return rucStr.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4');
}

/**
 * Formatear teléfono
 */
export function formatPhone(phone: number | string): string {
  const phoneStr = phone.toString();
  if (phoneStr.length === 9) {
    return phoneStr.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phoneStr;
}
