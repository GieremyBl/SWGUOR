'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PortalCartDrawer } from './PortalCartDrawer';
import { normalizeCartItem, useCartStore } from '@/lib/store/useCartStore';

type PortalCartLayoutContextValue = {
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isCartOpen: boolean;
};

const PortalCartLayoutContext = createContext<PortalCartLayoutContextValue | null>(null);

export function PortalCartLayout({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fixLegacyCart = () => {
      const { items } = useCartStore.getState();
      const normalized = items.map((item) =>
        normalizeCartItem(item as Parameters<typeof normalizeCartItem>[0]),
      );
      const needsFix = items.some(
        (item, i) =>
          item.moq !== normalized[i].moq ||
          !Number.isFinite(item.moq) ||
          item.moq <= 0,
      );
      if (needsFix) {
        useCartStore.setState({ items: normalized });
      }
    };

    const unsub = useCartStore.persist.onFinishHydration(fixLegacyCart);
    fixLegacyCart();
    return unsub;
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((v) => !v), []);

  const value = useMemo(
    () => ({ openCart, closeCart, toggleCart, isCartOpen }),
    [openCart, closeCart, toggleCart, isCartOpen],
  );

  return (
    <PortalCartLayoutContext.Provider value={value}>
      {children}
      <PortalCartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </PortalCartLayoutContext.Provider>
  );
}

export function usePortalCart() {
  const ctx = useContext(PortalCartLayoutContext);
  if (!ctx) {
    throw new Error('usePortalCart debe usarse dentro de PortalCartLayout');
  }
  return ctx;
}
