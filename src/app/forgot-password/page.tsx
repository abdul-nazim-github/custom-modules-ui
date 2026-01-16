'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { validateEmail, validatePassword } from '@/lib/validation';
import { ErrorBoundary } from '@/components/error-boundary';
import { getErrorMessage } from '@/lib/error-utils';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<{ email?: string; newPassword?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = () => {
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.newPassword);
        let confirmError = null;

        if (formData.newPassword !== formData.confirmPassword) {
            confirmError = 'Passwords do not match';
        }

        const newErrors = {
            email: emailError || undefined,
            newPassword: passwordError || undefined,
            confirmPassword: confirmError || undefined,
        };

        setErrors(newErrors);
        return !emailError && !passwordError && !confirmError;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validate()) return;

        setIsLoading(true);
        const loadingToast = toast.loading('Resetting password...');

        try {
            await axios.post('/api/auth/reset-password', {
                email: formData.email,
                password: formData.newPassword,
            });

            toast.success('Password reset successful!', { id: loadingToast });
            router.push('/signin');
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            toast.error(message, { id: loadingToast });
            setErrors({ email: message });
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
                            <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl rotate-12 flex items-center justify-center shadow-lg transform transition-transform hover:rotate-0 hover:scale-110 group">
                                <KeyRound className="h-10 w-10 text-white group-hover:animate-spin-slow" />
                            </div>
                            <h2 className="mt-6 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
                                Reset Password
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 font-medium">
                                Enter your email and new password to reset your account.
                            </p>
                        </div>

                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="group">
                                    <Input
                                        id="email"
                                        label="Email address"
                                        type="email"
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
                                        id="newPassword"
                                        label="New Password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        error={errors.newPassword}
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
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        error={errors.confirmPassword}
                                        disabled={isLoading}
                                        className="group-hover:bg-white"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                                isLoading={isLoading}
                            >
                                Reset Password
                            </Button>
                        </form>

                        <div className="text-center">
                            <Link href="/signin" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors group">
                                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Back to Sign in
                            </Link>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    );
}
