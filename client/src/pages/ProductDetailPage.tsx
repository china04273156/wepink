import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import ReviewsSection from '@/components/ReviewsSection';
import ShareProduct from '@/components/ShareProduct';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  rating: number;
  reviews: number;
  stock: number;
  details: string;
  ingredients?: string;
  usage?: string;
}

export default function ProductDetailPage() {
  const [match, params] = useRoute('/product/:id');
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchProduct(params.id);
    }
  }, [params?.id]);

  const fetchProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.product);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando produto...</div>;
  }

  if (!product) {
    return <div className="text-center py-12">Produto não encontrado</div>;
  }

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === index ? 'border-pink-600' : 'border-gray-300'
                }`}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600">({product.reviews} avaliações)</span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-pink-50 rounded-lg p-4 mb-6">
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-gray-600 line-through mb-2">R$ {product.originalPrice.toFixed(2)}</p>
            )}
            <p className="text-4xl font-bold text-pink-600 mb-2">R$ {product.price.toFixed(2)}</p>
            {discount > 0 && (
              <p className="text-green-600 font-semibold">Economize {discount}%</p>
            )}
            <p className="text-gray-600 mt-2">em até 6x de R$ {(product.price / 6).toFixed(2)} sem juros</p>
          </div>

          {/* Stock */}
          <div className="mb-6">
            <p className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
            </p>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <label className="font-semibold">Quantidade:</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100"
              >
                −
              </button>
              <span className="px-4 py-2">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mb-6">
            <button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-semibold transition">
              Comprar Agora
            </button>
            <button className="flex-1 border-2 border-pink-600 text-pink-600 hover:bg-pink-50 py-3 rounded-lg font-semibold transition">
              Adicionar ao Carrinho
            </button>
          </div>

          {/* Share */}
          <ShareProduct productId={product.id} productName={product.name} />

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6 space-y-3">
            <div className="flex gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold">Frete Grátis</p>
                <p className="text-sm text-gray-600">Em compras acima de R$ 100</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold">Parcelamento</p>
                <p className="text-sm text-gray-600">Até 6x sem juros</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold">Garantia</p>
                <p className="text-sm text-gray-600">Satisfação garantida</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-8">
          <button className="px-4 py-3 border-b-2 border-pink-600 text-pink-600 font-semibold">
            Descrição
          </button>
          <button className="px-4 py-3 text-gray-600 hover:text-pink-600">
            Ingredientes
          </button>
          <button className="px-4 py-3 text-gray-600 hover:text-pink-600">
            Como Usar
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-12">
        <p className="text-gray-700 leading-relaxed">{product.details}</p>
      </div>

      {/* Reviews */}
      <ReviewsSection productId={product.id} />
    </div>
  );
}
