'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/error-utils';
import { validateEmail, validatePassword, validateName } from '@/lib/validation';
import axios from '@/lib/axios';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import toast from 'react-hot-toast';

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; form?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = () => {
        const trimmedData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
            confirmPassword: formData.confirmPassword.trim(),
        };

        const newErrors: typeof errors = {};

        const nameError = validateName(trimmedData.name);
        if (nameError) newErrors.name = nameError;

        const emailError = validateEmail(trimmedData.email);
        if (emailError) newErrors.email = emailError;

        if (!trimmedData.password) {
            newErrors.password = 'Password is required';
        } else {
            const passwordError = validatePassword(trimmedData.password);
            if (passwordError) newErrors.password = passwordError;
        }

        if (!trimmedData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (trimmedData.password !== trimmedData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validate()) return;

        setIsLoading(true);
        const loadingToast = toast.loading('Creating account...');

        try {
            // Call our Next.js API route
            await axios.post('/api/auth/register', {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password.trim()
            });

            toast.success('Account created! Please sign in.', { id: loadingToast });
            router.push('/signin');
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            toast.error(message, { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-purple-500 to-pink-500 p-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-400/30 blur-[100px] animate-pulse" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-400/30 blur-[100px] animate-pulse delay-1000" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-400/30 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="max-w-md w-full z-10">
                <ErrorBoundary>
                    <div className="space-y-8 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 transition-all duration-300 hover:shadow-purple-500/20">
                        <div className="text-center">
                            <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl -rotate-3 flex items-center justify-center shadow-lg transform transition-transform hover:rotate-0 hover:scale-110 group">
                                <UserPlus className="h-10 w-10 text-white group-hover:animate-bounce" />
                            </div>
                            <h2 className="mt-6 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
                                Create Account
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 font-medium">
                                Join our community today
                            </p>
                        </div>

                        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
                            <div className="group">
                                <Input
                                    id="name"
                                    label="Full Name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: undefined });
                                    }}
                                    error={errors.name}
                                    disabled={isLoading}
                                    className="group-hover:bg-white"
                                />
                            </div>

                            <div className="group">
                                <Input
                                    id="email"
                                    label="Email address"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: undefined });
                                    }}
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
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                    error={errors.password}
                                    disabled={isLoading}
                                    className="group-hover:bg-white"
                                />
                            </div>

                            <div className="group">
                                <Input
                                    id="confirmPassword"
                                    label="Confirm Password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                                    }}
                                    error={errors.confirmPassword}
                                    disabled={isLoading}
                                    className="group-hover:bg-white"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95 mt-4"
                                isLoading={isLoading}
                            >
                                Sign up
                            </Button>
                        </form>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 font-medium">
                                Already have an account?{' '}
                                <Link href="/signin" className="font-bold text-purple-600 hover:text-pink-600 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    );
}
