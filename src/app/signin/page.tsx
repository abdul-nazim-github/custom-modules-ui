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
                                    {/* <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer accent-purple-600"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none font-medium">
                                        Remember me
                                    </label> */}
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

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600 font-medium">
                                Don&apos;t have an account?{' '}
                                <Link href="/signup" className="font-bold text-purple-600 hover:text-pink-600 transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    );
}
