import { useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en millisecondes
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes par défaut

/**
 * Hook pour cacher les données côté client
 * Utile pour éviter les requêtes répétées aux mêmes données
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const ttl = options.ttl ?? DEFAULT_TTL;

  const isCacheValid = useCallback((entry: CacheEntry<T>) => {
    return Date.now() - entry.timestamp < entry.ttl;
  }, []);

  const getCachedData = useCallback((): T | null => {
    const entry = cacheRef.current.get(key);
    if (entry && isCacheValid(entry)) {
      return entry.data;
    }
    return null;
  }, [key, isCacheValid]);

  const setCachedData = useCallback(
    (data: T) => {
      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    },
    [key, ttl]
  );

  const fetchData = useCallback(async (): Promise<T> => {
    const cached = getCachedData();
    if (cached) {
      return cached;
    }

    const data = await fetcher();
    setCachedData(data);
    return data;
  }, [getCachedData, setCachedData, fetcher]);

  const clearCache = useCallback(() => {
    cacheRef.current.delete(key);
  }, [key]);

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    fetchData,
    getCachedData,
    clearCache,
    clearAllCache,
  };
}

/**
 * Cache global pour partager les données entre composants
 */
class GlobalCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data;
    }
    return null;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        isValid: Date.now() - entry.timestamp < entry.ttl,
      })),
    };
  }
}

export const globalCache = new GlobalCache();
