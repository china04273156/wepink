import axios from 'axios';
import { cache } from './cache';

const WEPINK_API_BASE = 'https://www.wepink.com.br/api/catalog_system/pub';
const CACHE_DURATION = 10 * 60; // 10 minutos para produtos
const CATEGORY_CACHE_DURATION = 60 * 60; // 1 hora para categorias

// Lista de proxies para fallback
const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
];

async function fetchWithFallback(url: string, timeout: number = 8000): Promise<any> {
  // Tentar primeiro sem proxy
  try {
    const response = await axios.get(url, { 
      timeout,
      headers: {
        'Accept-Encoding': 'gzip, deflate',
      }
    });
    return response.data;
  } catch (e) {
    console.log('Direct fetch failed, trying proxies...');
  }

  // Tentar com proxies
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      console.log(`Trying proxy: ${proxy}`);
      const response = await axios.get(proxyUrl, { timeout });
      return response.data;
    } catch (e) {
      console.warn(`Proxy ${proxy} failed`);
      continue;
    }
  }

  throw new Error('All proxies failed');
}

export async function getProductsOptimized(from: number = 0, to: number = 49, categoryPath?: string) {
  const cacheKey = `products_${from}_${to}_${categoryPath || 'all'}`;

  // Verificar cache primeiro
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }

  try {
    let url = `${WEPINK_API_BASE}/products/search?_from=${from}&_to=${to}`;

    if (categoryPath) {
      url = `${WEPINK_API_BASE}/products/search/${categoryPath}?_from=${from}&_to=${to}`;
    }

    console.log(`[FETCHING] ${cacheKey}`);
    const data = await fetchWithFallback(url);

    // Cachear resultado
    cache.set(cacheKey, data, CACHE_DURATION);

    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getProductByIdOptimized(productId: string) {
  const cacheKey = `product_${productId}`;

  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }

  try {
    const url = `${WEPINK_API_BASE}/products/search?fq=productId:${productId}`;
    console.log(`[FETCHING] ${cacheKey}`);
    const data = await fetchWithFallback(url);

    if (data && data.length > 0) {
      const product = data[0];
      cache.set(cacheKey, product, CACHE_DURATION);
      return product;
    }

    throw new Error('Product not found');
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function getCategoriesOptimized() {
  const cacheKey = 'categories';

  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }

  try {
    const url = `${WEPINK_API_BASE}/category/tree/3`;
    console.log(`[FETCHING] ${cacheKey}`);
    const data = await fetchWithFallback(url, 10000);

    cache.set(cacheKey, data, CATEGORY_CACHE_DURATION);
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function searchProductsOptimized(term: string) {
  const cacheKey = `search_${term.toLowerCase()}`;

  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }

  try {
    const url = `${WEPINK_API_BASE}/products/search?ft=${encodeURIComponent(term)}`;
    console.log(`[FETCHING] ${cacheKey}`);
    const data = await fetchWithFallback(url);

    cache.set(cacheKey, data, CACHE_DURATION);
    return data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

export function getCacheStats() {
  return cache.getStats();
}

export function clearCache() {
  cache.clear();
}
