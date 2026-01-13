import React, { useState } from 'react';
import { useLocation } from 'wouter';

interface HeaderImprovedProps {
  cartCount?: number;
  onSearch?: (query: string) => void;
}

export default function HeaderImproved({ cartCount = 0, onSearch }: HeaderImprovedProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = [
    'Kits',
    'Bath & Body',
    'Body Splash',
    'Perfumaria',
    'Skincare',
    'Body Cream',
    'The Cream',
    'The Oil',
    'Make',
    'Hair',
    'Roll-on',
    'Bem-estar',
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-pink-600 text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>Frete Grátis acima de R$ 100</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Rastreio</a>
            <a href="#" className="hover:underline">Trocar e Devolver</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Logo */}
          <div 
            onClick={() => setLocation('/')}
            className="flex-shrink-0 cursor-pointer"
          >
            <h1 className="text-3xl font-bold text-pink-600">WePink</h1>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite aqui o que procura..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-600"
              >
                🔍
              </button>
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLocation('/wishlist')}
              className="text-2xl hover:text-pink-600 transition"
              title="Wishlist"
            >
              ❤️
            </button>
            <button 
              onClick={() => setLocation('/cart')}
              className="relative"
              title="Carrinho"
            >
              <span className="text-2xl hover:text-pink-600 transition">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setLocation('/account')}
              className="text-2xl hover:text-pink-600 transition"
              title="Minha Conta"
            >
              👤
            </button>
          </div>
        </div>

        {/* Categories Menu */}
        <nav className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setLocation(`/category/${category.toLowerCase()}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-full whitespace-nowrap transition"
            >
              {category}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
