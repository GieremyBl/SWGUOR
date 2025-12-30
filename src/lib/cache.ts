/**
 * Cache en memoria para reducir queries a BD en middleware
 * TTL: 5 minutos por defecto
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Retornar estadísticas (útil para debugging)
  stats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Instancia global para caché de usuarios
export const userCache = new MemoryCache<{
  rol: string;
  estado: string;
}>(5 * 60 * 1000); // 5 minutos

// Instancia global para caché de permisos
export const permissionsCache = new MemoryCache<Record<string, string[]>>(
  10 * 60 * 1000 // 10 minutos
);

// Función helper para invalidar caché de usuario
export function invalidateUserCache(userId: string) {
  userCache.invalidate(userId);
  permissionsCache.invalidate(userId);
}

// Función helper para obtener caché con fallback
export async function getCachedUser(
  userId: string,
  fetchFn: () => Promise<{ rol: string; estado: string } | null>
) {
  // Intentar obtener del caché
  const cached = userCache.get(userId);
  if (cached) {
    return cached;
  }

  // Si no está en caché, obtener de la fuente y guardar
  const data = await fetchFn();
  if (data) {
    userCache.set(userId, data);
  }

  return data;
}
