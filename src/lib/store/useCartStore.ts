import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { resolveCartMoq } from '@/lib/constants/portal-b2b';

export type CartItem = {
  producto_id: number;
  variante_id?: number;
  nombre: string;
  precio: number;
  cantidad: number;
  moq: number;
  imagen_url: string | null;
  talla: string;
  color: string;
};

export type CartItemInput = Omit<CartItem, 'cantidad'>;

export type CartState = {
  items: CartItem[];
  addItem: (item: CartItemInput, cantidad: number) => void;
  removeItem: (producto_id: number, variante_id?: number) => void;
  updateQuantity: (producto_id: number, variante_id: number | undefined, cantidad: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  isValidForCheckout: () => boolean;
  getItemCount: () => number;
};

/** Ítems guardados antes de Zustand o sin campo moq tipado. */
export function normalizeCartItem(raw: Partial<CartItem> & Record<string, unknown>): CartItem {
  const precioRaw = raw.precio ?? raw.precio_unitario ?? 0;
  const rawVid = raw.variante_id as unknown;
  const varianteStr = rawVid == null ? '' : String(rawVid).trim();
  const varianteNum =
    varianteStr !== '' && !Number.isNaN(Number(rawVid)) ? Number(rawVid) : NaN;
  return {
    producto_id: Number(raw.producto_id),
    variante_id:
      varianteStr !== '' && Number.isFinite(varianteNum) && varianteNum > 0
        ? varianteNum
        : undefined,
    nombre: String(raw.nombre ?? 'Producto'),
    precio: Number(precioRaw) || 0,
    cantidad: Math.max(1, Math.floor(Number(raw.cantidad) || 1)),
    moq: resolveCartMoq(raw.moq),
    imagen_url: (raw.imagen_url ?? raw.imagen ?? null) as string | null,
    talla: String(raw.talla ?? 'M'),
    color: String(raw.color ?? 'Estándar'),
  };
}

function normalizeCartItems(items: unknown[]): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) =>
    normalizeCartItem((item ?? {}) as Partial<CartItem> & Record<string, unknown>),
  );
}

function lineMeetsMoq(item: CartItem): boolean {
  return item.cantidad >= resolveCartMoq(item.moq);
}

export function selectCanCheckout(state: CartState): boolean {
  return state.items.length > 0 && state.items.every(lineMeetsMoq);
}

function sameLine(
  a: Pick<CartItem, 'producto_id' | 'variante_id'>,
  producto_id: number,
  variante_id?: number,
): boolean {
  return a.producto_id === producto_id && (a.variante_id ?? undefined) === (variante_id ?? undefined);
}

function findLineIndex(items: CartItem[], producto_id: number, variante_id?: number): number {
  return items.findIndex((i) => sameLine(i, producto_id, variante_id));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, cantidad) => {
        const line = normalizeCartItem({
          ...item,
          variante_id: item.variante_id != null ? Number(item.variante_id) : undefined,
          cantidad: 0,
        } as Partial<CartItem> & Record<string, unknown>);
        const qty = Math.max(line.moq, Math.max(1, Math.floor(cantidad)));

        set((state) => {
          const idx = findLineIndex(state.items, line.producto_id, line.variante_id);
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = {
              ...next[idx],
              cantidad: next[idx].cantidad + qty,
              moq: resolveCartMoq(next[idx].moq ?? line.moq),
            };
            return { items: next };
          }
          return {
            items: [...state.items, { ...line, cantidad: qty }],
          };
        });
      },

      removeItem: (producto_id, variante_id) => {
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, producto_id, variante_id)),
        }));
      },

      updateQuantity: (producto_id, variante_id, cantidad) => {
        const qty = Math.max(1, Math.floor(Number(cantidad) || 1));
        set((state) => ({
          items: state.items.map((i) =>
            sameLine(i, producto_id, variante_id) ? { ...i, cantidad: qty } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),

      isValidForCheckout: () => selectCanCheckout(get()),

      getItemCount: () => get().items.length,
    }),
    {
      name: 'b2b-cart-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const p = persisted as { items?: unknown[] } | undefined;
        return {
          ...current,
          items: normalizeCartItems(p?.items ?? []),
        };
      },
    },
  ),
);
