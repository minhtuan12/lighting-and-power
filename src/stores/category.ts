import { ICategory, IFilter } from "@/types/category";
import { atom } from "jotai";

export const filterAtom = atom<IFilter | null>({
    isActive: undefined,
    search: '',
});

export const selectedCategoryAtom = atom<ICategory | null>(null);
