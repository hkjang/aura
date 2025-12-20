"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavigationState {
  lastPath: string;
  favorites: string[];
  recentPaths: string[];
}

interface NavigationContextType {
  state: NavigationState;
  addFavorite: (path: string) => void;
  removeFavorite: (path: string) => void;
  isFavorite: (path: string) => boolean;
  getRecentPaths: () => string[];
}

const STORAGE_KEY = "aura-navigation-state";
const MAX_RECENT_PATHS = 10;

const defaultState: NavigationState = {
  lastPath: "/dashboard",
  favorites: [],
  recentPaths: [],
};

const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load navigation state:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save navigation state:", e);
      }
    }
  }, [state, isLoaded]);

  // Track current path
  useEffect(() => {
    if (isLoaded && pathname) {
      setState((prev) => {
        const recentPaths = [
          pathname,
          ...prev.recentPaths.filter((p) => p !== pathname),
        ].slice(0, MAX_RECENT_PATHS);
        return {
          ...prev,
          lastPath: pathname,
          recentPaths,
        };
      });
    }
  }, [pathname, isLoaded]);

  const addFavorite = (path: string) => {
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(path)
        ? prev.favorites
        : [...prev.favorites, path],
    }));
  };

  const removeFavorite = (path: string) => {
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.filter((f) => f !== path),
    }));
  };

  const isFavorite = (path: string) => state.favorites.includes(path);

  const getRecentPaths = () => state.recentPaths;

  return (
    <NavigationContext.Provider
      value={{
        state,
        addFavorite,
        removeFavorite,
        isFavorite,
        getRecentPaths,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
