import { useState, useEffect } from "react";

// Interfaces para tipagem dos dados da API VTEX
export interface Product {
  productId: string;
  productName: string;
  brand: string;
  brandId: number;
  brandImageUrl: string | null;
  linkText: string;
  productReference: string;
  categoryId: string;
  productTitle: string;
  metaTagDescription: string;
  releaseDate: string;
  clusterHighlights: Record<string, string>;
  productClusters: Record<string, string>;
  searchableClusters: Record<string, string>;
  categories: string[];
  categoriesIds: string[];
  link: string;
  description: string;
  items: Sku[];
}

export interface Sku {
  itemId: string;
  name: string;
  nameComplete: string;
  complementName: string;
  ean: string;
  referenceId: { Key: string; Value: string }[];
  measurementUnit: string;
  unitMultiplier: number;
  modalType: string | null;
  isKit: boolean;
  images: ProductImage[];
  sellers: Seller[];
  Videos: string[];
  estimatedDateArrival: string | null;
}

export interface ProductImage {
  imageId: string;
  imageLabel: string | null;
  imageTag: string;
  imageUrl: string;
  imageText: string;
}

export interface Seller {
  sellerId: string;
  sellerName: string;
  addToCartLink: string;
  sellerDefault: boolean;
  commertialOffer: CommertialOffer;
}

export interface CommertialOffer {
  DeliverySlaSamplesPerRegion: Record<string, any>;
  Installments: Installment[];
  DiscountHighLight: any[];
  GiftSkuIds: string[];
  Teasers: any[];
  PromotionTeasers: any[];
  BuyTogether: any[];
  ItemMetadataAttachment: any[];
  Price: number;
  ListPrice: number;
  PriceWithoutDiscount: number;
  RewardValue: number;
  PriceValidUntil: string;
  AvailableQuantity: number;
  IsAvailable: boolean;
  Tax: number;
  DeliverySlaSamples: {
    DeliverySlaPerTypes: any[];
    Region: string | null;
  }[];
  GetInfoErrorMessage: string | null;
  CacheVersionUsedToCallCheckout: string;
}

export interface Installment {
  Value: number;
  InterestRate: number;
  TotalValuePlusInterestRate: number;
  NumberOfInstallments: number;
  PaymentSystemName: string;
  PaymentSystemGroupName: string;
  Name: string;
}

export interface Category {
  id: number;
  name: string;
  hasChildren: boolean;
  url: string;
  children: Category[];
  Title: string;
  MetaTagDescription: string;
}

// Lista de proxies para fallback em caso de falha (CORS)
const PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://thingproxy.freeboard.io/fetch/",
  "https://api.codetabs.com/v1/proxy?quest="
];

// Cache em memória para evitar requisições repetidas na mesma sessão
const memoryCache: Record<string, any> = {};

// Função auxiliar para fazer fetch com fallback de proxies e cache
async function fetchWithFallback(url: string): Promise<any> {
  // 1. Verificar cache em memória
  if (memoryCache[url]) {
    console.log(`[CACHE MEMORY] ${url}`);
    return memoryCache[url];
  }

  // 2. Verificar cache persistente (LocalStorage)
  const cachedData = localStorage.getItem(`wepink_cache_${url}`);
  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      // Cache válido por 1 hora (3600000 ms)
      if (Date.now() - timestamp < 3600000) {
        console.log(`[CACHE LOCAL] ${url}`);
        memoryCache[url] = data; // Atualizar memória
        return data;
      }
    } catch (e) {
      console.warn("Erro ao ler cache local", e);
      localStorage.removeItem(`wepink_cache_${url}`);
    }
  }

  // 3. Tentar buscar na rede
  let lastError;

  // Tentar primeiro sem proxy (caso a API suporte CORS no futuro ou estejamos no mesmo domínio)
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      saveToCache(url, data);
      return data;
    }
  } catch (e) {
    console.log("Direct fetch failed, trying proxies...");
  }

  // Tentar com proxies
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      console.log(`Trying proxy: ${proxy}`);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      
      const data = await response.json();
      saveToCache(url, data);
      return data;
    } catch (e) {
      lastError = e;
      console.warn(`Proxy ${proxy} failed:`, e);
      continue;
    }
  }

  throw lastError || new Error("All proxies failed");
}

// Função para salvar no cache
function saveToCache(url: string, data: any) {
  memoryCache[url] = data;
  try {
    localStorage.setItem(`wepink_cache_${url}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("LocalStorage full or unavailable", e);
  }
}

// Hook para buscar produtos
export function useProducts(from = 0, to = 49, categoryPath?: string) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = `https://www.wepink.com.br/api/catalog_system/pub/products/search?_from=${from}&_to=${to}`;
        
        if (categoryPath) {
          // Se tiver categoria, adiciona ao path da URL
          // A API da VTEX aceita /products/search/categoria/subcategoria
          url = `https://www.wepink.com.br/api/catalog_system/pub/products/search/${categoryPath}?_from=${from}&_to=${to}`;
        }

        const result = await fetchWithFallback(url);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [from, to, categoryPath]);

  return { data, loading, error };
}

// Hook para buscar um único produto por ID ou Slug
export function useProduct(identifier: string) {
  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!identifier) return;
      
      try {
        setLoading(true);
        // Tenta buscar por ID primeiro (fq=productId:ID)
        let url = `https://www.wepink.com.br/api/catalog_system/pub/products/search?fq=productId:${identifier}`;
        
        // Se o identificador parecer um slug (contém hífens ou letras), busca pelo slug
        if (isNaN(Number(identifier))) {
           url = `https://www.wepink.com.br/api/catalog_system/pub/products/search/${identifier}`;
        }

        const result = await fetchWithFallback(url);
        
        if (result && result.length > 0) {
          setData(result[0]);
        } else {
          setError(new Error("Product not found"));
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [identifier]);

  return { data, loading, error };
}

// Hook para buscar categorias
export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const url = "https://www.wepink.com.br/api/catalog_system/pub/category/tree/3";
        const result = await fetchWithFallback(url);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { data, loading, error };
}

// Hook para busca de produtos (search bar)
export function useSearch(term: string) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const searchProducts = async () => {
      if (!term) {
        setData([]);
        return;
      }

      try {
        setLoading(true);
        // ft = Full Text search
        const url = `https://www.wepink.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(term)}`;
        const result = await fetchWithFallback(url);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce simples
    const timeoutId = setTimeout(() => {
      searchProducts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [term]);

  return { data, loading, error };
}
