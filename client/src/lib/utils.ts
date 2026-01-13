import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Product } from "./api"

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export function getProductPrice(product: Product) {
  const seller = product.items[0]?.sellers[0];
  if (!seller) return { price: 0, listPrice: 0, installments: null };
  
  const { Price, ListPrice, Installments } = seller.commertialOffer;
  
  // Encontrar a melhor opção de parcelamento (maior número de parcelas sem juros ou com juros baixos)
  const bestInstallment = Installments.reduce((prev, current) => {
    return (prev.NumberOfInstallments > current.NumberOfInstallments) ? prev : current;
  }, Installments[0]);

  return {
    price: Price,
    listPrice: ListPrice,
    installments: bestInstallment
  };
}

export function getProductImage(product: Product, index = 0): string {
  if (!product.items[0]?.images[index]) return '/placeholder.png';
  return product.items[0].images[index].imageUrl;
}

export function calculateDiscount(price: number, listPrice: number): number {
  if (listPrice <= price) return 0;
  return Math.round(((listPrice - price) / listPrice) * 100);
}
