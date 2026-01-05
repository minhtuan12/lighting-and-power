import { IUser } from "@/types/user";
import { atom } from "jotai";
import { atomWithStorage } from 'jotai/utils';

export const accessTokenAtom = atomWithStorage<string | null>('accessToken', null);

// User info atom
export const userAtom = atom<IUser | null>(null);

// Auth loading state
export const authLoadingAtom = atom(false);

// Computed: isAuthenticated
export const isAuthenticatedAtom = atom((get) => {
    const token = get(accessTokenAtom);
    const user = get(userAtom);
    return !!token && !!user;
});

// Computed: isAdmin
export const isAdminAtom = atom((get) => {
    const user = get(userAtom);
    return user?.role === 'admin';
});
