import { ItemCotizacion, MAX_UNIDADES } from './PortalContext';

export interface PortalState {
    itemsBorrador: ItemCotizacion[];
    itemsCarrito: ItemCotizacion[];
}

export type PortalAction =
    | { type: 'SET_INITIAL_STATES'; borrador: ItemCotizacion[]; carrito: ItemCotizacion[] }
    | { type: 'AGREGAR_A_BORRADOR'; item: ItemCotizacion }
    | { type: 'AGREGAR_A_CARRITO'; item: ItemCotizacion }
    | { type: 'ACTUALIZAR_CANTIDAD_BORRADOR'; variante_id: number; cantidad: number }
    | { type: 'ACTUALIZAR_CANTIDAD_CARRITO'; variante_id: number; cantidad: number }
    | { type: 'ELIMINAR_DE_BORRADOR'; variante_id: number }
    | { type: 'ELIMINAR_DE_CARRITO'; variante_id: number }
    | { type: 'LIMPIAR_BORRADOR' }
    | { type: 'LIMPIAR_CARRITO' };

function mergeItem(prev: ItemCotizacion[], nuevoItem: ItemCotizacion): ItemCotizacion[] {
    const idx = prev.findIndex(i => i.variante_id === nuevoItem.variante_id);
    if (idx >= 0) {
        return prev.map((item, n) => {
            if (n !== idx) return item;
            const nuevaCantidad = Math.min(MAX_UNIDADES, item.cantidad + nuevoItem.cantidad);
            return { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precio_unitario };
        });
    }
    return [...prev, nuevoItem];
}

export function portalReducer(state: PortalState, action: PortalAction): PortalState {
    switch (action.type) {
        case 'SET_INITIAL_STATES':
            return { itemsBorrador: action.borrador, itemsCarrito: action.carrito };

        case 'AGREGAR_A_BORRADOR':
            return { ...state, itemsBorrador: mergeItem(state.itemsBorrador, action.item) };

        case 'AGREGAR_A_CARRITO':
            return { ...state, itemsCarrito: mergeItem(state.itemsCarrito, action.item) };

        case 'ACTUALIZAR_CANTIDAD_BORRADOR':
            return {
                ...state,
                itemsBorrador: state.itemsBorrador.map(i => {
                    if (i.variante_id !== action.variante_id) return i;
                    const cant = Math.min(MAX_UNIDADES, Math.max(1, action.cantidad));
                    return { ...i, cantidad: cant, subtotal: cant * i.precio_unitario };
                })
            };

        case 'ACTUALIZAR_CANTIDAD_CARRITO':
            return {
                ...state,
                itemsCarrito: state.itemsCarrito.map(i => {
                    if (i.variante_id !== action.variante_id) return i;
                    const cant = Math.min(MAX_UNIDADES, Math.max(1, action.cantidad));
                    return { ...i, cantidad: cant, subtotal: cant * i.precio_unitario };
                })
            };

        case 'ELIMINAR_DE_BORRADOR':
            return { ...state, itemsBorrador: state.itemsBorrador.filter(i => i.variante_id !== action.variante_id) };

        case 'ELIMINAR_DE_CARRITO':
            return { ...state, itemsCarrito: state.itemsCarrito.filter(i => i.variante_id !== action.variante_id) };

        case 'LIMPIAR_BORRADOR':
            return { ...state, itemsBorrador: [] };

        case 'LIMPIAR_CARRITO':
            return { ...state, itemsCarrito: [] };

        default:
            return state;
    }
}