import { Link } from "wouter";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Product } from "@/lib/api";
import { formatPrice, getProductImage, getProductPrice, calculateDiscount } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, buyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { price, listPrice, installments } = getProductPrice(product);
  const discount = calculateDiscount(price, listPrice);
  const imageUrl = getProductImage(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    buyNow(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link href={`/product/${product.productId}`} className="group block h-full">
        <Card className="h-full border-none shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden bg-card flex flex-col">
          <div className="relative aspect-[3/4] overflow-hidden bg-muted/20">
            {discount > 0 && (
              <span className="absolute top-3 left-3 z-10 bg-black text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
                {discount}% OFF
              </span>
            )}
            <button
              onClick={handleToggleWishlist}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm group/heart"
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${
                  isInWishlist(product.productId) 
                    ? "fill-pink-600 text-pink-600" 
                    : "text-gray-400 group-hover/heart:text-pink-600"
                }`} 
              />
            </button>
            <img
              src={imageUrl}
              alt={product.productName}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              width="300"
              height="400"
            />
            
            {/* Quick Add Button - Visible on Hover (Desktop) */}
            <div className="hidden md:block absolute bottom-4 left-0 right-0 px-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <Button 
                className="w-full btn-glow font-bold uppercase tracking-wide" 
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Comprar
              </Button>
            </div>
          </div>
          
          <CardContent className="p-4 flex-grow flex flex-col gap-2">
            <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {product.productName}
            </h3>
            
            <div className="mt-auto pt-2">
              {listPrice > price && (
                <span className="text-sm text-muted-foreground line-through block">
                  {formatPrice(listPrice)}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-primary">
                  {formatPrice(price)}
                </span>
              </div>
              {installments && (
                <p className="text-xs text-muted-foreground mt-1">
                  ou {installments.NumberOfInstallments}x de {formatPrice(installments.Value)}
                </p>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden grid grid-cols-4 gap-2 mt-3">
              <Button 
                variant="outline" 
                size="icon"
                className="col-span-1 border-primary text-primary hover:bg-primary hover:text-white"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
              <Button 
                className="col-span-3 font-bold text-xs uppercase bg-primary hover:bg-primary/90 text-white"
                onClick={handleBuyNow}
              >
                Comprar
              </Button>
            </div>
          </CardContent>
        </Card>
    </Link>
  );
}
