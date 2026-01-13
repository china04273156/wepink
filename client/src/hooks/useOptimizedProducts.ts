import { useState, useEffect, useCallback } from "react";
import { Product } from "@/lib/api";

interface UseOptimizedProductsOptions {
  pageSize?: number;
  enableCache?: boolean;
}

export function useOptimizedProducts(
  from: number = 0,
  to: number = 49,
  categoryPath?: string,
  options: UseOptimizedProductsOptions = {}
) {
  const { pageSize = 50, enableCache = true } = options;
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const cacheKey = `products_${from}_${to}_${categoryPath || "all"}`;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Verificar cache local
      if (enableCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          // Cache válido por 30 minutos
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            console.log(`[CACHE] Using cached products for ${cacheKey}`);
            setData(cachedData);
            setLoading(false);
            return;
          }
        }
      }

      // Buscar do servidor
      const params = new URLSearchParams({
        from: from.toString(),
        to: to.toString(),
        ...(categoryPath && { category: categoryPath }),
      });

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result = await response.json();

      // Salvar no cache
      if (enableCache) {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: result,
            timestamp: Date.now(),
          })
        );
      }

      setData(result);
      setHasMore(result.length >= pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [from, to, categoryPath, cacheKey, pageSize, enableCache]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, loading, error, hasMore, refetch: fetchProducts };
}

// Hook para lazy loading de imagens
export function useLazyLoadImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    img.src = src;
  }, [src]);

  return { imageSrc, isLoading };
}

// Hook para infinite scroll
export function useInfiniteScroll(
  callback: () => void,
  options: { threshold?: number } = {}
) {
  const { threshold = 0.1 } = options;
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, callback, threshold]);

  return setRef;
}
