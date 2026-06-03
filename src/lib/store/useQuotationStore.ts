import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ZonaEnvio = 'cercana_sjl' | 'media' | 'lejana';

export type QuotationItem = {
    producto_id: number;
    variante_id: number;
    nombre: string;
    sku: string;
    precio_unitario: number;
    cantidad: number;
    talla: string;
    color: string;
    imagen: string | null;
    stock_disponible: number;
};

type QuotationState = {
    itemsBorrador: QuotationItem[];
    zonaEnvio: ZonaEnvio;
    setZonaEnvio: (z: ZonaEnvio) => void;
    addItemToBorrador: (item: Omit<QuotationItem, 'cantidad'>, cantidad: number) => void;
    removeItemFromBorrador: (variante_id: number) => void;
    updateBorradorQuantity: (variante_id: number, cantidad: number) => void;
    clearBorrador: () => void;
    actualizarZonaEnvio: (zona: ZonaEnvio) => void;
};

export const useQuotationStore = create<QuotationState>()(
    persist(
        (set) => ({
            itemsBorrador: [],
            zonaEnvio: 'cercana_sjl',
            setZonaEnvio: (z) => set({ zonaEnvio: z }),
            addItemToBorrador: (item, cantidad) => {
                set((state) => {
                    const idx = state.itemsBorrador.findIndex((i) => i.variante_id === item.variante_id);
                    if (idx >= 0) {
                        const next = [...state.itemsBorrador];
                        next[idx].cantidad += cantidad;
                        return { itemsBorrador: next };
                    }
                    return { itemsBorrador: [...state.itemsBorrador, { ...item, cantidad }] };
                });
            },

            removeItemFromBorrador: (variante_id) => {
                set((state) => ({
                    itemsBorrador: state.itemsBorrador.filter((i) => i.variante_id !== variante_id),
                }));
            },

            updateBorradorQuantity: (variante_id, cantidad) => {
                set((state) => ({
                    itemsBorrador: state.itemsBorrador.map((i) =>
                        i.variante_id === variante_id ? { ...i, cantidad: Math.max(1, cantidad) } : i
                    ),
                }));
            },

            clearBorrador: () => set({ itemsBorrador: [] }),

            actualizarZonaEnvio: (zona) => set({ zonaEnvio: zona }),
        }),
        {
            name: 'b2b-quotation-storage',
            // Como el borrador original usaba sessionStorage, puedes mantenerlo aquí:
            storage: createJSONStorage(() => localStorage),
        }
    )
);