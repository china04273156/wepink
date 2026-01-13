import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories } from "@/lib/api";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoryPage() {
  const [match, params] = useRoute("/category/:slug");
  const slug = params?.slug || "";
  
  // Buscar a árvore de categorias para encontrar o nome correto e ID se necessário
  const { data: categories } = useCategories();
  const currentCategory = categories.find(c => c.url.endsWith(`/${slug}`));
  
  // Usar o slug diretamente na API, pois a VTEX aceita o path da categoria
  // Isso garante que a filtragem seja exata (ex: /perfumaria traz só perfumes)
  const { data: products, loading, error } = useProducts(0, 19, slug);

  const categoryName = currentCategory ? currentCategory.name : slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  if (loading) {
    return (
      <div className="container py-16 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-16 flex flex-col justify-center items-center min-h-[50vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erro ao carregar produtos</h2>
        <p className="text-muted-foreground mb-6">Não foi possível carregar os produtos desta categoria.</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/">
          <span className="hover:text-primary cursor-pointer">Home</span>
        </Link>
        <span>/</span>
        <span className="capitalize text-foreground font-medium">{categoryName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-primary">
            {categoryName}
          </h1>
          <p className="text-muted-foreground">
            {products.length} produtos encontrados
          </p>
        </div>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-muted/30 rounded-xl">
          <p className="text-xl text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
          <Link href="/">
            <Button variant="link" className="mt-4 text-primary">
              Voltar para a Home
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
