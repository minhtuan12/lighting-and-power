'use client'

import { routes } from '@/constants/routes';
import { useAuth } from '@/hooks/use-me';
import { showMessage } from '@/hooks/use-message';
import { EUserRole } from '@/types/user';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function AdminLogin() {
    const [emailOrPhone, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginAsync, isAuthenticated } = useAuth();

    const validateForm = () => {
        if (!emailOrPhone) {
            setError('Vui lòng nhập email');
            return false;
        }

        if (!/\S+@\S+\.\S+/.test(emailOrPhone)) {
            setError('Email không hợp lệ');
            return false;
        }

        if (!password) {
            setError('Vui lòng nhập mật khẩu');
            return false;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const result = await loginAsync({ emailOrPhone, password });

            // Check if password change required
            // if (result.requirePasswordChange) {
            //     router.push(`/change-password?userId=${result.userId}&required=true`);
            //     return;
            // }

            // Check role
            if (result.data.role !== EUserRole.admin) {
                showMessage.error('Bạn không có quyền truy cập trang quản trị');
                return;
            }

            router.push(routes.account.url);
            router.refresh();
        } catch (err: any) {
            showMessage.error(err.message || 'Đăng nhập thất bại');
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            router.push(routes.account.url);
            return;
        }
    }, [isAuthenticated])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaC0ydjJoMnYtMmgydi0yaC0yem0tMiAwdjJoLTJ2Mmgydi0yaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>

            <div className="w-full max-w-md relative">
                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-purple-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
                        <p className="text-purple-100">Đăng nhập để quản lý hệ thống</p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="emailOrPhone"
                                        type="emailOrPhone"
                                        value={emailOrPhone}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        placeholder="example@example.com"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Đang đăng nhập...</span>
                                    </>
                                ) : (
                                    <span>Đăng nhập</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;