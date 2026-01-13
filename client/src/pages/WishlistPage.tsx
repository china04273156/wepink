import { Link } from "wouter";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="bg-pink-50 p-8 rounded-full mb-6 animate-in zoom-in duration-500">
          <Heart className="h-16 w-16 text-pink-500" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4 text-pink-900">Sua lista de desejos está vazia</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Salve seus produtos favoritos aqui para não perdê-los de vista. Que tal começar a explorar agora?
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full px-8 font-bold btn-glow bg-pink-600 hover:bg-pink-700">
            EXPLORAR PRODUTOS
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="font-display text-3xl font-black flex items-center gap-3 text-pink-900">
          <Heart className="h-8 w-8 text-pink-600 fill-pink-600" />
          MEUS FAVORITOS
          <span className="text-sm font-medium text-muted-foreground bg-pink-50 px-3 py-1 rounded-full ml-2">
            {items.length} itens
          </span>
        </h1>
        
        <Link href="/">
          <Button variant="outline" className="gap-2 border-pink-200 text-pink-700 hover:bg-pink-50">
            Continuar Comprando <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((product) => (
          <div key={product.productId} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
