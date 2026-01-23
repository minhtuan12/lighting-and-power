'use client';

import { routes } from '@/constants/routes';
import { useAuth } from '@/hooks/use-me';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isAdmin, isLoading } = useAuth();

    const publicRoutes = [
        routes.dangKy.url,
        routes.dangNhap.url,
        routes.trangChu.url,
        routes.gioHang.url,
        routes.taiLieuDienTu.url,
        routes.lienHe.url,
        routes.sanPham.url,
        routes.login.url,
    ];
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    useEffect(() => {
        if (isPublicRoute) return;

        if (!isLoading && !isAuthenticated) {
            const loginUrl = requireAdmin ? routes.login.url : routes.dangNhap.url;
            router.push(loginUrl);
            return;
        }

        if (requireAdmin && !isLoading && !isAdmin) {
            // router.push('/403');
            // return;
        }
    }, [isAuthenticated, isAdmin, requireAdmin, isLoading, router, pathname, isPublicRoute]);

    if (isPublicRoute) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || (requireAdmin && !isAdmin)) {
        return null;
    }

    return <>{children}</>;
}