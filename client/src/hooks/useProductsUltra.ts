import { useState, useEffect, useCallback, useRef } from "react";
import { Product } from "@/lib/api";

interface UseProductsUltraOptions {
  pageSize?: number;
  prefetch?: boolean;
}

export function useProductsUltra(
  from: number = 0,
  to: number = 49,
  categoryPath?: string,
  options: UseProductsUltraOptions = {}
) {
  const { pageSize = 50, prefetch = true } = options;
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cacheRef = useRef<Map<string, any>>(new Map());

  const cacheKey = `products_${from}_${to}_${categoryPath || "all"}`;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Verificar cache em memória
      if (cacheRef.current.has(cacheKey)) {
        console.log(`[ULTRA CACHE] ${cacheKey}`);
        setData(cacheRef.current.get(cacheKey));
        setLoading(false);
        return;
      }

      // Buscar do servidor
      const params = new URLSearchParams({
        from: from.toString(),
        to: to.toString(),
        ...(categoryPath && { category: categoryPath }),
      });

      console.log(`[FETCHING] ${cacheKey}`);
      const response = await fetch(`/api/products?${params}`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate',
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result = await response.json();

      // Salvar no cache
      cacheRef.current.set(cacheKey, result);

      setData(result);
      setHasMore(result.length >= pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [from, to, categoryPath, cacheKey, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Prefetch próxima página
  useEffect(() => {
    if (prefetch && data.length > 0) {
      const nextFrom = to + 1;
      const nextTo = nextFrom + pageSize - 1;
      const nextCacheKey = `products_${nextFrom}_${nextTo}_${categoryPath || "all"}`;

      if (!cacheRef.current.has(nextCacheKey)) {
        const params = new URLSearchParams({
          from: nextFrom.toString(),
          to: nextTo.toString(),
          ...(categoryPath && { category: categoryPath }),
        });

        // Prefetch silenciosamente
        fetch(`/api/products?${params}`)
          .then((res) => res.json())
          .then((result) => {
            cacheRef.current.set(nextCacheKey, result);
          })
          .catch((err) => console.warn("Prefetch failed:", err));
      }
    }
  }, [data, to, pageSize, categoryPath, prefetch]);

  return { data, loading, error, hasMore, refetch: fetchProducts };
}

// Hook para lazy load com intersection observer
export function useLazyLoadImages() {
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());

  const observeImage = useCallback((imageUrl: string, element: HTMLImageElement | null) => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleImages((prev) => new Set(prev).add(imageUrl));
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { visibleImages, observeImage };
}

// Hook para precarregar imagens
export function usePrefetchImages(imageUrls: string[]) {
  useEffect(() => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [imageUrls]);
}
