import React, { useState } from 'react';

interface FilterOptions {
  priceRange: [number, number];
  categories: string[];
  ratings: number[];
  sortBy: string;
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  categories?: string[];
}

export default function ProductFilters({ onFilterChange, categories = [] }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 500],
    categories: [],
    ratings: [],
    sortBy: 'relevance',
  });

  const [showFilters, setShowFilters] = useState(false);

  const handlePriceChange = (min: number, max: number) => {
    const newFilters = { ...filters, priceRange: [min, max] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    const newRatings = filters.ratings.includes(rating)
      ? filters.ratings.filter((r) => r !== rating)
      : [...filters.ratings, rating];
    const newFilters = { ...filters, ratings: newRatings };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (sortBy: string) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Mobile Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden w-full mb-4 px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold"
      >
        {showFilters ? 'Fechar Filtros' : 'Abrir Filtros'}
      </button>

      <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-6`}>
        {/* Sort */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Ordenar por</h3>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
          >
            <option value="relevance">Relevância</option>
            <option value="newest">Mais Novos</option>
            <option value="price-low">Menor Preço</option>
            <option value="price-high">Maior Preço</option>
            <option value="best-sellers">Mais Vendidos</option>
            <option value="rating">Melhor Avaliação</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Preço</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceChange(parseInt(e.target.value), filters.priceRange[1])}
                placeholder="Mín"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceChange(filters.priceRange[0], parseInt(e.target.value))}
                placeholder="Máx"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
            </div>
            <input
              type="range"
              min="0"
              max="500"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceChange(filters.priceRange[0], parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-600">
              R$ {filters.priceRange[0].toFixed(2)} - R$ {filters.priceRange[1].toFixed(2)}
            </p>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Categorias</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-600"
                  />
                  <span className="text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Avaliação</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.ratings.includes(rating)}
                  onChange={() => handleRatingChange(rating)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-600"
                />
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-700">e acima</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            const newFilters: FilterOptions = {
              priceRange: [0, 500],
              categories: [],
              ratings: [],
              sortBy: 'relevance',
            };
            setFilters(newFilters);
            onFilterChange(newFilters);
          }}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}
