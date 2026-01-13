import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useDrag } from "@use-gesture/react";

const slides = [
  {
    id: 1,
    image: "/images/banners/banner-pink-revolution.png",
    title: "",
    subtitle: "",
    cta: "COMPRAR AGORA",
    link: "/products",
    align: "left",
    textColor: "text-white",
    overlay: ""
  },
  {
    id: 2,
    image: "/images/banners/banner-promo-especial.webp",
    title: "",
    subtitle: "",
    cta: "VER PRODUTOS",
    link: "/category/kits",
    align: "center",
    textColor: "text-pink-950",
    overlay: ""
  }
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Troca a cada 5 segundos

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const bind = useDrag(({ swipe: [swipeX] }) => {
    if (swipeX === -1) {
      nextSlide();
    } else if (swipeX === 1) {
      prevSlide();
    }
  });

  return (
    <div className="relative w-full aspect-[16/9] md:h-[600px] md:aspect-auto overflow-hidden bg-black" {...bind()}>
      {/* Slides */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full touch-pan-y"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative w-full h-full flex-shrink-0">
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover"
            />
            {/* Overlay apenas se necessário */}
            {slide.overlay && <div className={`absolute inset-0 ${slide.overlay}`} />}
            
            {/* Conteúdo (Texto e Botões) - Renderizar apenas se houver título */}
            {slide.title && (
              <div className={`absolute inset-0 container flex flex-col justify-center ${
                slide.align === "left" ? "items-start text-left" : 
                slide.align === "right" ? "items-end text-right" : 
                "items-center text-center"
              }`}>
                <div className="max-w-2xl space-y-6 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <span className="inline-block px-4 py-1 border border-current rounded-full text-sm font-bold tracking-wider uppercase mb-2 text-white/90">
                    Lançamento Exclusivo
                  </span>
                  <h2 className={`font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none ${slide.textColor}`}>
                    {slide.title}
                  </h2>
                  <p className={`text-lg md:text-xl font-medium max-w-lg ${
                    slide.align === "center" ? "mx-auto" : ""
                  } ${slide.textColor === "text-white" ? "text-white/90" : "text-pink-950/80"}`}>
                    {slide.subtitle}
                  </p>
                  <div className="pt-4">
                    <Link href={slide.link}>
                      <Button 
                        size="lg" 
                        className="rounded-full px-8 py-6 text-lg font-bold bg-pink-600 hover:bg-pink-700 text-white border-none shadow-lg shadow-pink-600/30 transition-all hover:scale-105"
                      >
                        {slide.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Botão invisível cobrindo todo o slide para banners que já têm texto na imagem */}
            {!slide.title && (
              <Link href={slide.link} className="absolute inset-0 z-10">
                <span className="sr-only">{slide.cta}</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110 hidden md:block"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110 hidden md:block"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index 
                ? "bg-pink-500 w-8" 
                : "bg-white/50 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
