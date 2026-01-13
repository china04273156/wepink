import React from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, getProductImage, getProductPrice } from "@/lib/utils";
import { CartTimer } from "@/components/CartTimer";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, total } = useCart();
  const [, setLocation] = useLocation();

  if (items.length === 0) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="bg-primary/10 p-8 rounded-full mb-6">
          <ShoppingBag className="h-16 w-16 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">Sua sacola está vazia</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Parece que você ainda não escolheu seus produtos favoritos. Que tal dar uma olhada nas novidades?
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full px-8 font-bold btn-glow">
            COMEÇAR A COMPRAR
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-black mb-8 flex items-center gap-3">
        <ShoppingBag className="h-8 w-8 text-primary" />
        MEU CARRINHO
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-6">
          <CartTimer />
          {items.map((item) => {
            const { price } = getProductPrice(item.product);
            const imageUrl = getProductImage(item.product);

            return (
              <div 
                key={item.product.productId} 
                className="flex gap-4 p-4 bg-card border border-border/50 rounded-xl hover:border-primary/30 transition-colors"
              >
                <div className="h-24 w-24 flex-shrink-0 bg-muted/20 rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt={item.product.productName} 
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-sm md:text-base line-clamp-2">
                        {item.product.productName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ref: {item.product.productReference}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.product.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center border border-border rounded-full h-8">
                      <button 
                        onClick={() => updateQuantity(item.product.productId, item.quantity - 1)}
                        className="w-8 h-full flex items-center justify-center hover:text-primary transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.productId, item.quantity + 1)}
                        className="w-8 h-full flex items-center justify-center hover:text-primary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <span className="block text-xs text-muted-foreground">Total</span>
                      <span className="font-black text-lg text-primary">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo do Pedido */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 shadow-sm">
            <h2 className="font-display font-bold text-xl mb-6">Resumo do Pedido</h2>
            
            <div className="space-y-3 mb-6 pb-6 border-b border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-green-600 font-bold">Grátis</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descontos</span>
                <span className="font-bold">- R$ 0,00</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-8">
              <span className="font-bold text-lg">Total</span>
              <div className="text-right">
                <span className="block font-black text-2xl text-primary">{formatPrice(total)}</span>
                <span className="text-xs text-muted-foreground">em até 10x sem juros</span>
              </div>
            </div>
            
            <Link href="/checkout">
              <button 
                className="w-full h-12 rounded-full font-bold text-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                FINALIZAR COMPRA <ArrowRight className="ml-2 h-5 w-5 inline" />
              </button>
            </Link>
            
            <Link href="/">
              <Button variant="link" className="w-full mt-4 text-muted-foreground hover:text-primary">
                Continuar comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
