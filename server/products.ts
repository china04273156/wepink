import axios from 'axios';
import { getDatabase } from './db';
import { productCache } from '../shared/schema';
import { eq, lt } from 'drizzle-orm';

const WEPINK_API_BASE = 'https://www.wepink.com.br/api/catalog_system/pub';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora em ms

// Lista de proxies para fallback em caso de falha (CORS)
const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest=',
];

async function fetchWithFallback(url: string): Promise<any> {
  // Tentar primeiro sem proxy
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.data;
  } catch (e) {
    console.log('Direct fetch failed, trying proxies...');
  }

  // Tentar com proxies
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      console.log(`Trying proxy: ${proxy}`);
      const response = await axios.get(proxyUrl, { timeout: 5000 });
      return response.data;
    } catch (e) {
      console.warn(`Proxy ${proxy} failed:`, e);
      continue;
    }
  }

  throw new Error('All proxies failed');
}

export async function getProducts(from: number = 0, to: number = 49, categoryPath?: string) {
  try {
    let url = `${WEPINK_API_BASE}/products/search?_from=${from}&_to=${to}`;

    if (categoryPath) {
      url = `${WEPINK_API_BASE}/products/search/${categoryPath}?_from=${from}&_to=${to}`;
    }

    const data = await fetchWithFallback(url);
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getProductById(productId: string) {
  try {
    const db = await getDatabase();

    // Verificar cache no banco de dados
    const cachedProduct = await db
      .select()
      .from(productCache)
      .where(eq(productCache.productId, productId));

    if (cachedProduct.length > 0 && new Date(cachedProduct[0].expiresAt) > new Date()) {
      console.log(`[DB CACHE] Product ${productId}`);
      return cachedProduct[0].data;
    }

    // Buscar da API
    const url = `${WEPINK_API_BASE}/products/search?fq=productId:${productId}`;
    const data = await fetchWithFallback(url);

    if (data && data.length > 0) {
      const product = data[0];

      // Salvar no cache
      const expiresAt = new Date(Date.now() + CACHE_DURATION);
      await db
        .insert(productCache)
        .values({
          productId,
          data: product,
          expiresAt,
        })
        .onDuplicateKeyUpdate({
          set: {
            data: product,
            expiresAt,
          },
        });

      return product;
    }

    throw new Error('Product not found');
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function getCategories() {
  try {
    const url = `${WEPINK_API_BASE}/category/tree/3`;
    const data = await fetchWithFallback(url);
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function searchProducts(term: string) {
  try {
    const url = `${WEPINK_API_BASE}/products/search?ft=${encodeURIComponent(term)}`;
    const data = await fetchWithFallback(url);
    return data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

export async function cleanExpiredCache() {
  try {
    const db = await getDatabase();
    const now = new Date();

    await db.delete(productCache).where(lt(productCache.expiresAt, now));

    console.log('✅ Expired cache cleaned');
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
}
