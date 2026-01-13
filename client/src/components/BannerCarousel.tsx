import React, { useState, useEffect } from 'react';

interface Banner {
  id: number;
  title: string;
  description: string;
  image: string;
  link?: string;
  buttonText?: string;
}

interface BannerCarouselProps {
  banners?: Banner[];
  autoPlay?: boolean;
  interval?: number;
}

export default function BannerCarousel({ 
  banners = [
    {
      id: 1,
      title: 'Coleção Primavera',
      description: 'Descubra os novos aromas da estação',
      image: 'https://via.placeholder.com/1200x400/FF1493/FFFFFF?text=Colecao+Primavera',
      buttonText: 'Ver Coleção',
    },
    {
      id: 2,
      title: 'Frete Grátis',
      description: 'Em compras acima de R$ 100',
      image: 'https://via.placeholder.com/1200x400/FF69B4/FFFFFF?text=Frete+Gratis',
      buttonText: 'Comprar Agora',
    },
    {
      id: 3,
      title: 'Promoção Especial',
      description: 'Até 50% de desconto em produtos selecionados',
      image: 'https://via.placeholder.com/1200x400/00FF00/000000?text=Promocao+Especial',
      buttonText: 'Aproveitar',
    },
  ],
  autoPlay = true,
  interval = 5000,
}: BannerCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden group">
      {/* Slides */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute w-full h-full transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-center items-center text-white text-center">
              <h2 className="text-4xl font-bold mb-2">{banner.title}</h2>
              <p className="text-lg mb-6">{banner.description}</p>
              {banner.buttonText && (
                <button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-semibold transition">
                  {banner.buttonText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 w-12 h-12 rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
      >
        ❮
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 w-12 h-12 rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
      >
        ❯
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition ${
              index === currentSlide ? 'bg-pink-600' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
