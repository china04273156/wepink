import React, { useState } from 'react';
import { useLocation } from 'wouter';

interface ProductCardImprovedProps {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  originalPrice?: number;
  isNew?: boolean;
  rating?: number;
  reviews?: number;
  onAddToCart?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  isInWishlist?: boolean;
}

export default function ProductCardImproved({
  id,
  name,
  description,
  image,
  price,
  originalPrice,
  isNew = false,
  rating = 0,
  reviews = 0,
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false,
}: ProductCardImprovedProps) {
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const installments = Math.ceil(price / 6);

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 h-64">
        <img
          src={image}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              lançamento
            </span>
          )}
          {discount > 0 && (
            <span className="bg-green-400 text-black text-xs font-bold px-3 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => onAddToWishlist?.(id)}
          className="absolute top-3 right-3 text-2xl hover:scale-125 transition"
        >
          {isInWishlist ? '❤️' : '🤍'}
        </button>

        {/* Add Button (on hover) */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2">
            <button
              onClick={() => onAddToCart?.(id)}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-full font-semibold transition"
            >
              Comprar
            </button>
            <button
              onClick={() => onAddToCart?.(id)}
              className="bg-white hover:bg-gray-100 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center font-bold transition"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Name */}
        <h3
          onClick={() => setLocation(`/product/${id}`)}
          className="font-semibold text-gray-800 hover:text-pink-600 cursor-pointer line-clamp-2 mb-1"
        >
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-1 mb-2">{description}</p>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-600">({reviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="mb-3">
          {originalPrice && originalPrice > price && (
            <p className="text-sm text-gray-500 line-through">R$ {originalPrice.toFixed(2)}</p>
          )}
          <p className="text-2xl font-bold text-pink-600">R$ {price.toFixed(2)}</p>
          <p className="text-xs text-gray-600">em até 6x de R$ {installments.toFixed(2)}</p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onAddToCart?.(id)}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-semibold transition"
          >
            Comprar
          </button>
          <button
            onClick={() => onAddToCart?.(id)}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center font-bold transition"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
