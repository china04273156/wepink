import { Link, useLocation } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/lib/api";
import { ArrowLeft, Search } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  
  // Extrair query param da URL manualmente já que wouter não tem hook nativo para query params
  const getQueryParam = (name: string) => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    return params.get(name) || "";
  };

  const query = getQueryParam("q");
  const { data: products, loading } = useSearch(query);

  return (
    <div className="container py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" asChild>
            <span><ArrowLeft className="h-5 w-5" /></span>
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-black text-primary flex items-center gap-2">
            <Search className="h-6 w-6" />
            Resultados para "{query}"
          </h1>
          <p className="text-muted-foreground">
            {loading ? "Buscando produtos..." : `${products.length} produtos encontrados`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-3xl">
          <div className="bg-background p-6 rounded-full inline-block mb-4 shadow-sm">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Nenhum produto encontrado</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Não encontramos produtos correspondentes a "{query}". Tente usar termos mais genéricos ou verifique a ortografia.
          </p>
          <Link href="/">
            <Button asChild><span>Voltar para a loja</span></Button>
          </Link>
        </div>
      )}
    </div>
  );
}
