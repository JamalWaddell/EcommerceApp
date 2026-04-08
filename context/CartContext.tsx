// context/CartContext.tsx

// Defines the types for cart items and the context value
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api-to-front/client';
import { useAuth } from './AuthContext';

// 1. Define the types
interface CartItem {
  productId: string;
  quantity: number;
}

// 2. Define what the CartContext "provides" to the rest of the app
interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: any;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// Create the actual context object with a default value of null
const CartContext = createContext<CartContextType | null>(null);

const localStorageKey = 'estore_cart';

// 3. The CartProvider component that wraps the app and provides cart state and actions
export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  // Helper to save to phone storage
  const saveLocalCart = async (cart: CartItem[]) => {
    try {
      await AsyncStorage.setItem(localStorageKey, JSON.stringify(cart));
    } catch (e) {
      console.error("Error saving local cart", e);
    }
  };

  // Helper to load from phone storage
  const loadLocalCart = async (): Promise<CartItem[]> => {
    try {
      const raw = await AsyncStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  // Function to refresh cart items from the server or local storage based on login status
  const refreshCart = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLoggedIn) {
        const data = await apiFetch('/api/cart');
        setItems(data.cart ?? []);
      } else {
        const local = await loadLocalCart();
        setItems(local);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync logic when Login status changes
  useEffect(() => {
    const syncCart = async () => {
      if (isLoggedIn) {
        const local = await loadLocalCart();
        if (local.length > 0) {
          // Merge local guest items into the database
          for (const item of local) {
            try {
              await apiFetch('/api/cart', {
                method: 'POST',
                body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
              });
            } catch (e) {
              console.error("Failed to sync item", item.productId);
            }
          }
          await AsyncStorage.removeItem(localStorageKey);
        }
      }
      await refreshCart();
    };

    syncCart();
  }, [isLoggedIn]);

  // Cart manipulation functions that handle both local and server state based on login
  const addItem = async (productId: string, quantity: number = 1) => {
    const existing = items.find((item) => item.productId === productId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    // If user is logged in, update server cart. Otherwise, update local cart.
    if (isLoggedIn) {
      try {
        const data = await apiFetch('/api/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity: nextQuantity }),
        });
        setItems(data.cart ?? []);
      } catch (err) {
        setError(err);
      }
    } else {
      const next = items.filter((item) => item.productId !== productId);
      next.push({ productId, quantity: nextQuantity });
      setItems(next);
      await saveLocalCart(next);
    }
  };

  // Update quantity or remove item if quantity is set to 0
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return removeItem(productId);

    if (isLoggedIn) {
      try {
        const data = await apiFetch('/api/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity }),
        });
        setItems(data.cart ?? []);
      } catch (err) {
        setError(err);
      }
    } else {
      const next = items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      setItems(next);
      await saveLocalCart(next);
    }
  };
  // Remove item from cart
  const removeItem = async (productId: string) => {
    if (isLoggedIn) {
      try {
        const data = await apiFetch(`/api/cart/${productId}`, {
          method: 'DELETE',
        });
        setItems(data.cart ?? []);
      } catch (err) {
        setError(err);
      }
    } else {
      const next = items.filter((item) => item.productId !== productId);
      setItems(next);
      await saveLocalCart(next);
    }
  };

  // Clear the entire cart
  const clear = async () => {
    setItems([]);
    await saveLocalCart([]);

    if (isLoggedIn) {
      try {
        // Note: Make sure your backend has a DELETE /api/cart route
        // If not, you might need to call updateQuantity for each item with 0
        await apiFetch(`/api/cart`, { method: 'DELETE' });
      } catch (err) {
        console.error("Server cart clear failed", err);
      }
    }
  };

  // Memoize the context value to optimize performance
  const value = useMemo(
    () => ({ items, loading, error, addItem, updateQuantity, removeItem, clear, refreshCart }),
    [items, loading, error]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 4. Custom hook to easily access the CartContext in other components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}