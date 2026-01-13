import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api";
import { calculateDiscount, getProductPrice } from "@/lib/utils";
import { useLazyLoadImage } from "@/hooks/useOptimizedProducts";

interface ProductCardOptimizedProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCardOptimized({
  product,
  onAddToCart,
}: ProductCardOptimizedProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lazy load da imagem
  const imageUrl = product.items?.[0]?.images?.[0]?.imageUrl || "";
  const { imageSrc, isLoading } = useLazyLoadImage(
    imageUrl,
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f0f0f0' width='400' height='400'/%3E%3C/svg%3E"
  );

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const { price, listPrice } = getProductPrice(product);
  const discount = calculateDiscount(price, listPrice);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div
      ref={ref}
      className="group relative flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Imagem */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {isInView && (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              src={imageSrc}
              alt={product.productName}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              loading="lazy"
            />
          </>
        )}

        {/* Badge de desconto */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-destructive text-white px-2 py-1 rounded-lg text-xs font-bold">
            -{discount}%
          </div>
        )}

        {/* Botão de wishlist */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="absolute top-3 left-3 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "fill-destructive text-destructive" : ""
            }`}
          />
        </button>

        {/* Overlay com botão de compra */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            onClick={handleAddToCart}
            className="bg-primary text-white hover:bg-primary/90 gap-2 rounded-full"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
          <Link href={`/product/${product.linkText}`}>
            <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors cursor-pointer">
              {product.productName}
            </h3>
          </Link>
        </div>

        {/* Preço */}
        <div className="mt-3">
          {listPrice > price && (
            <p className="text-xs text-muted-foreground line-through">
              R$ {listPrice.toFixed(2)}
            </p>
          )}
          <p className="text-lg font-bold text-primary">
            R$ {price.toFixed(2)}
          </p>

          {/* Parcelamento */}
          {product.items?.[0]?.sellers?.[0]?.commertialOffer?.Installments?.[0] && (
            <p className="text-xs text-muted-foreground mt-1">
              até{" "}
              {
                product.items[0].sellers[0].commertialOffer.Installments.length
              }
              x sem juros
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
