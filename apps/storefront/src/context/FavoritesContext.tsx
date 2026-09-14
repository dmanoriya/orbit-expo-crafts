'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEnquiry } from './EnquiryContext';
import { useAuth } from './AuthContext';

export interface FavoriteItem {
  id: string;
  name: string;
  catName?: string;
  image?: string;
  material?: string;
  finish?: string;
  type?: string;
  moq?: number;
  price?: number;
  slug?: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: any) => void;
  addFavorite: (product: any) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  moveAllToEnquiry: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'orbit_favorites';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { addEnquiry, openDrawer } = useEnquiry();
  const { user } = useAuth();

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  }, [favorites]);

  // Sync with WordPress user meta when user logs in
  useEffect(() => {
    if (user?.id) {
      // Sync cloud favorites if available
      if (user.favorites && user.favorites.length > 0) {
        setFavorites((prev) => {
          const ids = new Set(prev.map((f) => f.id));
          const newMerged = [...prev];
          // Keep existing merged
          return newMerged;
        });
      }

      // Send local favorites to WordPress
      if (favorites.length > 0) {
        fetch('/api/wp/customers/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: favorites.map((f) => f.id) }),
        }).catch(() => {});
      }
    }
  }, [user?.id]);

  const isFavorite = (id: string): boolean => {
    if (!id) return false;
    return favorites.some((f) => String(f.id) === String(id));
  };

  const normalizeItem = (product: any): FavoriteItem => {
    return {
      id: String(product.id || product.sku || Math.random().toString()),
      name: product.name || 'Untitled Piece',
      catName: product.catName || product.category || product.cat || 'Furniture',
      image: product.image || (Array.isArray(product.images) && product.images[0]) || '/categories/tables.jpg',
      material: product.material || 'Solid Wood',
      finish: product.finish || product.color || 'Natural',
      type: product.type || 'Contract Furniture',
      moq: product.moq || 1,
      price: typeof product.price === 'number' ? product.price : undefined,
      slug: product.slug || product.id,
    };
  };

  const addFavorite = (product: any) => {
    const item = normalizeItem(product);
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => String(f.id) !== String(id)));
  };

  const toggleFavorite = (product: any) => {
    const item = normalizeItem(product);
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      if (exists) {
        return prev.filter((f) => f.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const moveAllToEnquiry = () => {
    if (favorites.length === 0) return;

    favorites.forEach((item) => {
      addEnquiry({
        id: item.id,
        name: item.name,
        catName: item.catName,
        q: item.moq || 1,
        image: item.image,
        moq: item.moq,
        unitPrice: item.price || 0,
        slug: item.slug,
      });
    });

    openDrawer();
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        moveAllToEnquiry,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
