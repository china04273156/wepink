import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AllProductsPage() {
  const [page, setPage] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const pageSize = 20;
  
  // Buscar produtos com paginação
  const { data: newProducts, loading } = useProducts(page * pageSize, (page + 1) * pageSize - 1);

  useEffect(() => {
    if (newProducts && newProducts.length > 0) {
      // Evitar duplicatas ao adicionar novos produtos
      setAllProducts(prev => {
        const existingIds = new Set(prev.map(p => p.productId));
        const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.productId));
        return [...prev, ...uniqueNewProducts];
      });
    }
  }, [newProducts]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-black text-primary mb-2 uppercase">
          Todos os Produtos
        </h1>
        <p className="text-muted-foreground">
          Explore nosso catálogo completo de fragrâncias e cosméticos
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allProducts.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>

      {loading && (
        <div className="py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && newProducts.length > 0 && (
        <div className="py-10 flex justify-center">
          <Button 
            onClick={handleLoadMore} 
            size="lg" 
            variant="outline"
            className="rounded-full px-8 font-bold border-2 hover:bg-primary hover:text-primary-foreground"
          >
            CARREGAR MAIS PRODUTOS
          </Button>
        </div>
      )}
      
      {!loading && allProducts.length > 0 && newProducts.length === 0 && (
        <div className="py-10 text-center text-muted-foreground">
          Você chegou ao fim do catálogo! 💖
        </div>
      )}
    </div>
  );
}
