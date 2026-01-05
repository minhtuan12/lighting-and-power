import { IProduct } from '@/types/product';
import { atom } from 'jotai';

// Selected product atom
export const selectedProductAtom = atom<IProduct | null>(null);

// Product filter atom
export const filterProductAtom = atom({
    page: 1,
    categoryId: undefined as string | undefined,
    status: undefined as string | undefined,
    isFeatured: undefined as boolean | undefined,
    tags: undefined as string[] | undefined,
    search: undefined as string | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: 'newest' as 'name' | 'price' | 'soldCount' | 'rating' | 'newest',
    sortOrder: 'desc' as 'asc' | 'desc',
});
