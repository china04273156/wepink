import { useEffect, useState } from "react";
import { X, Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    // Não mostrar no checkout ou se já foi mostrado nesta sessão
    if (location === "/checkout" || hasShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setIsOpen(true);
        setHasShown(true);
        // Salvar no sessionStorage para não mostrar novamente na mesma sessão
        sessionStorage.setItem("exitIntentShown", "true");
      }
    };

    // Verificar se já foi mostrado na sessão atual
    const sessionShown = sessionStorage.getItem("exitIntentShown");
    if (sessionShown) {
      setHasShown(true);
      return;
    }

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [location, hasShown]);

  const copyCoupon = () => {
    navigator.clipboard.writeText("PINK10");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-pink-500/20 bg-white/95 backdrop-blur-xl">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-pink-600 p-4 rounded-full shadow-xl shadow-pink-600/30 animate-bounce">
          <Gift className="w-8 h-8 text-white" />
        </div>
        
        <DialogHeader className="pt-8 text-center space-y-2">
          <DialogTitle className="text-3xl font-black text-pink-600 uppercase tracking-tighter">
            ESPERA! NÃO VÁ! 😱
          </DialogTitle>
          <p className="text-muted-foreground font-medium">
            Temos um presente especial para sua primeira compra.
          </p>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="bg-pink-50 border-2 border-dashed border-pink-200 rounded-xl p-6 text-center space-y-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            <p className="text-sm font-bold text-pink-900 uppercase tracking-widest">Cupom Exclusivo</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black text-pink-600 tracking-tighter">PINK10</span>
            </div>
            <p className="text-xs text-pink-600/80 font-medium">10% OFF em todo o site</p>
          </div>

          <div className="grid gap-3">
            <Button 
              onClick={copyCoupon} 
              variant="outline" 
              className="w-full border-pink-200 hover:bg-pink-50 hover:text-pink-700 h-12 font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  CUPOM COPIADO!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  COPIAR CÓDIGO
                </>
              )}
            </Button>
            <Button 
              onClick={() => setIsOpen(false)} 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white h-12 font-bold shadow-lg shadow-pink-600/20"
            >
              APROVEITAR DESCONTO AGORA
            </Button>
          </div>
        </div>
        
        <div className="text-center">
          <button 
            onClick={() => setIsOpen(false)}
            className="text-xs text-muted-foreground hover:text-pink-600 underline decoration-pink-300 underline-offset-2 transition-colors"
          >
            Não quero desconto, prefiro pagar o preço total
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
