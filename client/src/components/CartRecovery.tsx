import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

export function CartRecovery() {
  const { items, total } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Mostrar aviso apenas se houver itens no carrinho e não estiver no checkout/carrinho
    if (items.length > 0 && location !== "/cart" && location !== "/checkout") {
      // Delay para não ser intrusivo imediatamente
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [items.length, location]);

  if (!isVisible || items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-card border border-primary/20 shadow-lg shadow-primary/10 rounded-xl p-4 relative overflow-hidden">
        {/* Efeito de brilho de fundo */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-4 items-start">
          <div className="bg-primary/10 p-3 rounded-full shrink-0">
            <ShoppingBag className="h-6 w-6 text-primary animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-lg leading-tight">
              Não esqueça seus itens!
            </h3>
            <p className="text-sm text-muted-foreground">
              Você tem <span className="font-bold text-primary">{items.length} itens</span> no carrinho totalizando <span className="font-bold text-primary">{formatPrice(total)}</span>.
            </p>
            <p className="text-xs font-medium text-green-600 flex items-center gap-1">
              ✨ Frete Grátis disponível!
            </p>
            
            <Button 
              className="w-full mt-2 font-bold uppercase tracking-wide btn-glow" 
              onClick={() => setLocation("/cart")}
            >
              Finalizar Compra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
