import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useDrag } from "@use-gesture/react";
import { useProduct } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, ShoppingBag, Truck, ShieldCheck, CreditCard, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { ProductZoom } from "@/components/ProductZoom";
import { ProductReviews } from "@/components/ProductReviews";

export default function ProductDetail() {
  const [match, params] = useRoute("/product/:id");
  // Usar o ID ou slug para buscar o produto. A API suporta ambos.
  const { data: product, loading } = useProduct(params?.id || "");
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const bind = useDrag(({ swipe: [swipeX] }) => {
    if (!product) return;
    const images = product.items[0].images;
    
    if (swipeX === -1) {
      // Swipe Left -> Next Image
      setSelectedImage((prev) => (prev + 1) % images.length);
    } else if (swipeX === 1) {
      // Swipe Right -> Prev Image
      setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <Link href="/">
          <Button>Voltar para a loja</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.productId,
      productName: product.productName,
      items: [{
        images: [{ imageUrl: product.items[0].images[0].imageUrl }],
        sellers: [{
          commertialOffer: {
            Price: product.items[0].sellers[0].commertialOffer.Price
          }
        }]
      }]
    } as any, quantity);
    toast.success("Produto adicionado ao carrinho!");
  };

  const sku = product.items[0];
  const offer = sku.sellers[0].commertialOffer;
  const discount = offer.ListPrice > offer.Price 
    ? Math.round(((offer.ListPrice - offer.Price) / offer.ListPrice) * 100) 
    : 0;

  // Parcelamento simulado (padrão WePink: até 10x sem juros)
  const installments = offer.Installments.length > 0 
    ? offer.Installments.reduce((prev: any, current: any) => (prev.NumberOfInstallments > current.NumberOfInstallments) ? prev : current)
    : { NumberOfInstallments: 1, Value: offer.Price };

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/">
          <span className="hover:text-primary cursor-pointer">Home</span>
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
          {product.productName}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galeria de Imagens */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-2xl border bg-white touch-pan-y" {...bind()}>
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-bold rounded-full z-10">
                {discount}% OFF
              </span>
            )}
            <ProductZoom
              src={sku.images[selectedImage].imageUrl}
              alt={product.productName}
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {sku.images.map((image: any, index: number) => (
              <button
                key={image.imageId}
                onClick={() => setSelectedImage(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden bg-white ${
                  selectedImage === index ? "border-primary" : "border-transparent hover:border-border"
                }`}
              >
                <img
                  src={image.imageUrl}
                  alt=""
                  className="w-full h-full object-contain p-1"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Informações do Produto */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(4.9 de 5 estrelas)</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight text-foreground">
              {product.productName}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Ref: {product.productId}</p>
          </div>

          <div className="space-y-1 border-y py-6">
            {offer.ListPrice > offer.Price && (
              <p className="text-muted-foreground line-through text-lg">
                {formatPrice(offer.ListPrice)}
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-primary">
                {formatPrice(offer.Price)}
              </p>
              <span className="text-sm font-medium text-muted-foreground">à vista</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Até {installments.NumberOfInstallments}x de {formatPrice(installments.Value)} sem juros
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center border rounded-full w-fit">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-l-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-r-full"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              size="lg" 
              className="flex-1 rounded-full text-lg font-bold h-14 shadow-lg shadow-primary/25 animate-pulse hover:animate-none"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              ADICIONAR AO CARRINHO
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="bg-background p-2 rounded-full shadow-sm">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Frete Grátis</p>
                <p className="text-xs text-muted-foreground">Para compras acima de R$ 199,90</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="bg-background p-2 rounded-full shadow-sm">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Compra Segura</p>
                <p className="text-xs text-muted-foreground">Garantia de qualidade WePink</p>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="description">
              <AccordionTrigger className="text-lg font-bold uppercase">Descrição do Produto</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {product.description || "Descrição detalhada não disponível."}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="specs">
              <AccordionTrigger className="text-lg font-bold uppercase">Especificações Técnicas</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {Object.entries(product).map(([key, value]) => {
                    if (typeof value === 'string' && key !== 'description' && key !== 'linkText' && value.length < 100) {
                      return (
                        <div key={key} className="flex justify-between py-2 border-b last:border-0">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <ProductReviews productId={product.productId} />
      </div>
    </div>
  );
}
