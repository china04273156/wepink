import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { Product } from "@/lib/api";
import { toast } from "sonner";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  buyNow: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [, setLocation] = useLocation();

  // Carregar carrinho do localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("wepink-cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erro ao carregar carrinho", e);
      }
    }
  }, []);

  // Salvar carrinho no localStorage
  useEffect(() => {
    localStorage.setItem("wepink-cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.productId === product.productId);
      
      if (existingItem) {
        toast.success("Quantidade atualizada no carrinho");
        return prev.map((item) =>
          item.product.productId === product.productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      toast.success("Produto adicionado ao carrinho");
      return [...prev, { product, quantity }];
    });
  };

  const buyNow = (product: Product, quantity = 1) => {
    addItem(product, quantity);
    setLocation("/checkout");
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.productId !== productId));
    toast.info("Produto removido do carrinho");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.product.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items && items.length > 0 ? items.reduce((acc, item) => {
    if (!item || !item.product) return acc;
    const price = item.product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || item.product.price || 0;
    return acc + price * item.quantity;
  }, 0) : 0;

  const total = subtotal; // Pode adicionar frete aqui depois

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        buyNow,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
