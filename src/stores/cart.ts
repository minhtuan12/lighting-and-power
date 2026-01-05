import { ICartItem } from '@/types/cart';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Persist cart in localStorage
export const cartItemsAtom = atomWithStorage<ICartItem[]>('cart', []);

// Cart count
export const cartCountAtom = atom((get) => {
    const items = get(cartItemsAtom);
    return items.reduce((sum, item) => sum + item.quantity, 0);
});

// Cart total
export const cartTotalAtom = atom((get) => {
    const items = get(cartItemsAtom);
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// Add to cart action
export const addToCartAtom = atom(
    null,
    (get, set, item: ICartItem) => {
        const items = get(cartItemsAtom);
        const existingIndex = items.findIndex(i => i.productId === item.productId);

        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity += item.quantity;
            set(cartItemsAtom, newItems);
        } else {
            set(cartItemsAtom, [...items, item]);
        }
    }
);

// Remove from cart action
export const removeFromCartAtom = atom(
    null,
    (get, set, productId: string) => {
        const items = get(cartItemsAtom);
        set(cartItemsAtom, items.filter(i => i.productId !== productId));
    }
);

// Update quantity action
export const updateCartQuantityAtom = atom(
    null,
    (get, set, { productId, quantity }: { productId: string; quantity: number }) => {
        const items = get(cartItemsAtom);
        const newItems = items.map(item =>
            item.productId === productId ? { ...item, quantity } : item
        );
        set(cartItemsAtom, newItems);
    }
);

// Clear cart action
export const clearCartAtom = atom(
    null,
    (get, set) => {
        set(cartItemsAtom, []);
    }
);
