import { useState, useEffect } from 'react';

interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar wishlist do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wepink_wishlist');
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar wishlist no localStorage
  const saveWishlist = (items: WishlistItem[]) => {
    try {
      localStorage.setItem('wepink_wishlist', JSON.stringify(items));
      setWishlist(items);
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  };

  const addToWishlist = (item: WishlistItem) => {
    const exists = wishlist.some((w) => w.productId === item.productId);
    if (!exists) {
      saveWishlist([...wishlist, { ...item, addedAt: new Date().toISOString() }]);
    }
  };

  const removeFromWishlist = (productId: string) => {
    saveWishlist(wishlist.filter((w) => w.productId !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((w) => w.productId === productId);
  };

  const clearWishlist = () => {
    saveWishlist([]);
  };

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    count: wishlist.length,
  };
}
