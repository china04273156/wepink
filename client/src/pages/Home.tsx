import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Star, Sparkles, Timer, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { useProducts } from "@/lib/api";
import { Product } from "@/lib/api";
import { calculateDiscount, getProductPrice } from "@/lib/utils";

export default function Home() {
  // Carregar mais produtos para ter uma boa seleção de promoções
  const { data: allProducts, loading } = useProducts(0, 49);
  
  // Filtrar produtos em promoção (desconto > 0)
  const promoProducts = allProducts.filter(product => {
    const { price, listPrice } = getProductPrice(product);
    return calculateDiscount(price, listPrice) > 0;
  }).slice(0, 4); // Pegar os top 4 com desconto

  // Produtos para "Destaques" (excluindo os que já estão na promo para não repetir)
  const featuredProducts = allProducts
    .filter(p => !promoProducts.find(pp => pp.productId === p.productId))
    .slice(0, 4);

  // Produtos para "Lançamentos"
  const newArrivals = allProducts
    .filter(p => !promoProducts.find(pp => pp.productId === p.productId) && !featuredProducts.find(fp => fp.productId === p.productId))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Marquee */}
      <div className="bg-primary py-4 overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-marquee items-center gap-8 text-white font-display font-black text-2xl uppercase tracking-widest">
          <span>Frete Grátis acima de R$ 199</span>
          <Star className="h-6 w-6 fill-white" />
          <span>Parcelamento em até 10x</span>
          <Star className="h-6 w-6 fill-white" />
          <span>Produtos Originais</span>
          <Star className="h-6 w-6 fill-white" />
          <span>Entrega Rápida</span>
          <Star className="h-6 w-6 fill-white" />
          <span>Frete Grátis acima de R$ 199</span>
          <Star className="h-6 w-6 fill-white" />
          <span>Parcelamento em até 10x</span>
          <Star className="h-6 w-6 fill-white" />
          <span>Produtos Originais</span>
          <Star className="h-6 w-6 fill-white" />
          <span>Entrega Rápida</span>
        </div>
      </div>

      {/* Seção de Promoções */}
      <section className="container">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Timer className="h-3 w-3" /> Oferta por tempo limitado
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-primary flex items-center gap-3">
              PINK SALE <Percent className="h-8 w-8 md:h-10 md:w-10" />
            </h2>
            <p className="text-muted-foreground text-lg mt-2">Descontos imperdíveis nos seus produtos favoritos.</p>
          </div>
          <Link href="/category/kits">
            <Button variant="outline" className="font-bold border-primary text-primary hover:bg-primary hover:text-white group">
              Ver todas as ofertas <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {promoProducts.length > 0 ? (
              promoProducts.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))
            ) : (
              // Fallback caso não encontre produtos com desconto explícito
              allProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))
            )}
          </div>
        )}
      </section>

      {/* Banner Promocional */}
      <section className="container">
        <div className="relative rounded-3xl overflow-hidden bg-black text-white h-[500px] flex items-center group">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=2574&auto=format&fit=crop" 
              alt="Promoção" 
              className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="relative z-10 p-12 md:p-24 max-w-3xl">
            <div className="flex items-center gap-2 text-primary mb-4 font-bold tracking-widest uppercase">
              <Sparkles className="h-5 w-5" />
              <span>Oferta Especial</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black mb-6 leading-tight">
              KITS COM ATÉ<br />
              <span className="text-primary text-outline stroke-white">50% OFF</span>
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-lg">
              Aproveite nossa seleção especial de kits para presentear ou se presentear com o melhor da WePink.
            </p>
            <Link href="/category/kits">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-8 h-14 rounded-full text-lg transition-transform hover:scale-105">
                APROVEITAR OFERTA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products - Queridinhos */}
      <section className="container">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-display font-black mb-2">QUERIDINHOS DA WEPINK</h2>
            <p className="text-muted-foreground">Os produtos mais amados pelas nossas clientes.</p>
          </div>
          <Link href="/category/best-sellers">
            <Button variant="link" className="text-primary font-bold group">
              Ver todos <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
            ))
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-display font-black mb-2">Lançamentos</h2>
            <p className="text-muted-foreground">As novidades mais frescas acabaram de chegar.</p>
          </div>
          <Link href="/category/lancamentos">
            <Button variant="link" className="text-primary font-bold group">
              Ver todos <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
            ))
          ) : (
            newArrivals.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container">
        <div className="bg-primary/10 rounded-3xl p-12 md:p-24 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
             <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl"></div>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4 relative z-10">
            ENTRE PARA O CLUBE
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto relative z-10">
            Cadastre-se para receber ofertas exclusivas, lançamentos em primeira mão e dicas de beleza dos nossos especialistas.
          </p>
          <form className="flex flex-col md:flex-row gap-4 max-w-md mx-auto relative z-10" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Seu melhor e-mail" 
              className="flex-1 h-14 px-6 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
            <Button size="lg" className="h-14 px-8 rounded-full font-bold bg-primary text-white hover:bg-primary/90 btn-glow">
              CADASTRAR
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
