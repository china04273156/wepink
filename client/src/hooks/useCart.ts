import { useState, useCallback, useEffect } from "react";

export interface CartItem {
  id: number;
  productId: string;
  skuId: string;
  quantity: number;
  price: number;
  productData: any;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const token = localStorage.getItem("auth_token");

  // Carregar carrinho ao autenticar
  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

  const fetchCart = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const addItem = useCallback(
    async (
      productId: string,
      skuId: string,
      quantity: number,
      price: number,
      productData: any
    ) => {
      if (!token) {
        throw new Error("Not authenticated");
      }

      try {
        setLoading(true);
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            skuId,
            quantity,
            price,
            productData,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add item");
        }

        const data = await response.json();
        setItems((prev) => [...prev, data]);
        return data;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!token) {
        throw new Error("Not authenticated");
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/cart/${itemId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to remove item");
        }

        setItems((prev) => prev.filter((item) => item.id !== itemId));
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const clearCart = useCallback(async () => {
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      setLoading(true);
      const response = await fetch("/api/cart/clear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to clear cart");
      }

      setItems([]);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    loading,
    error,
    total,
    addItem,
    removeItem,
    clearCart,
    refetch: fetchCart,
  };
}
