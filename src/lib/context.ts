import { AsyncLocalStorage } from 'async_hooks';

interface AuthContext {
    userId: string;
    role: string;
    email?: string;
}

export const authContext = new AsyncLocalStorage<AuthContext>();

export function setAuthContext(user: AuthContext) {
    return user;
}

export function getAuthContext(): AuthContext | undefined {
    return authContext.getStore();
}
