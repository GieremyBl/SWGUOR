// lib/cache.ts
import type { Database } from "@/types/supabase.types";

/**
 * Sistema de caché en memoria con soporte para TTL (Time To Live)
 * Optimizado para prevenir memory leaks y sincronización
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutos por defecto
  }

  /**
   * Almacena un valor en caché
   */
  set(key: string, value: T, timestamp?: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: timestamp ?? Date.now()
    };

    // Limpiar caché si excede el tamaño máximo
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  /**
   * Obtiene un valor del caché validando TTL
   */
  get(key: string, ttl?: number): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const maxAge = ttl ?? this.defaultTTL;
    const age = Date.now() - entry.timestamp;

    // Si el caché expiró, eliminarlo y retornar null
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Elimina una entrada específica
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpia todas las entradas
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalida entradas expiradas
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Elimina la entrada más antigua
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizacion: `${((this.cache.size / this.maxSize) * 100).toFixed(2)}%`
    };
  }
}

// ============================================
// INSTANCIAS DE CACHÉ
// ============================================

// ✅ Usar tipo generado desde la base de datos
type UserCacheData = Database['public']['Tables']['usuarios']['Row'];

/**
 * Caché de usuarios con TTL de 5 minutos
 * Previene consultas repetitivas a la BD en el middleware
 */
export const userCache = new MemoryCache<UserCacheData>(1000, 5 * 60 * 1000);

/**
 * Limpieza automática del caché cada 10 minutos
 */
if (typeof window === 'undefined') {
  setInterval(() => {
    const cleaned = userCache.cleanup();
    if (cleaned > 0) {
      console.log(`[Cache] Limpiadas ${cleaned} entradas expiradas`);
    }
  }, 10 * 60 * 1000);
}

/**
 * Utilidad para invalidar caché de un usuario específico
 * Usar después de actualizar rol o estado
 */
export function invalidateUserCache(authId: string): void {
  userCache.delete(authId);
}

/**
 * Utilidad para limpiar todo el caché de usuarios
 * Usar con precaución - solo en cambios masivos
 */
export function clearAllUserCache(): void {
  userCache.clear();
}