'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from '@/lib/axios';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { validateEmail, validatePassword } from '@/lib/validation';
import { getErrorMessage } from '@/lib/error-utils';

import toast from 'react-hot-toast';

export default function SignInPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = () => {
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.password);

        const newErrors = {
            email: emailError || undefined,
            password: passwordError || undefined,
        };

        setErrors(newErrors);
        return !emailError && !passwordError;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validate()) return;

        setIsLoading(true);
        const loadingToast = toast.loading('Signing in...');

        try {
            // Call our Next.js API route
            await axios.post('/api/auth/login', formData);

            toast.success('Welcome back!', { id: loadingToast });

            // Redirect on success
            router.push('/dashboard');
            router.refresh(); // Refresh to update middleware state
        } catch (error: unknown) {
            console.error('Sign in error:', error);
            const message = getErrorMessage(error);

            toast.error(message, { id: loadingToast });

            setErrors({
                form: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-purple-500 to-pink-500 p-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-400/30 blur-[100px] animate-pulse" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-400/30 blur-[100px] animate-pulse delay-1000" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-400/30 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="max-w-md w-full z-10">
                <ErrorBoundary>
                    <div className="space-y-8 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 transition-all duration-300 hover:shadow-purple-500/20">
                        <div className="text-center">
                            <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl rotate-3 flex items-center justify-center shadow-lg transform transition-transform hover:rotate-6 hover:scale-110 group">
                                <Lock className="h-10 w-10 text-white group-hover:animate-bounce" />
                            </div>
                            <h2 className="mt-6 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 font-medium">
                                Sign in to access your colorful dashboard
                            </p>
                        </div>

                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="group">
                                    <Input
                                        id="email"
                                        label="Email address"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        error={errors.email}
                                        disabled={isLoading}
                                        className="group-hover:bg-white"
                                    />
                                </div>

                                <div className="group">
                                    <Input
                                        id="password"
                                        label="Password"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        error={errors.password}
                                        disabled={isLoading}
                                        className="group-hover:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer accent-purple-600"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none font-medium">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <Link href="/forgot-password" className="font-semibold text-purple-600 hover:text-pink-600 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            {errors.form && (
                                <div className="rounded-xl bg-red-50 p-4 border border-red-100 animate-in fade-in slide-in-from-top-2 shadow-sm">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-bold text-red-800">
                                                {errors.form}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                                isLoading={isLoading}
                            >
                                Sign in
                            </Button>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white/90 text-gray-500 font-medium rounded-full">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-purple-200 hover:text-purple-600 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
                                    aria-label="Sign in with Google"
                                >
                                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-purple-200 hover:text-purple-600 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
                                    aria-label="Sign in with GitHub"
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path
                                            fillRule="evenodd"
                                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-purple-200 hover:text-purple-600 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
                                    aria-label="Sign in with Microsoft"
                                >
                                    <svg className="h-6 w-6" viewBox="0 0 23 23">
                                        <path fill="#f35325" d="M1 1h10v10H1z" />
                                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-600 font-medium">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/signup" className="font-bold text-purple-600 hover:text-pink-600 transition-colors">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    );
}
