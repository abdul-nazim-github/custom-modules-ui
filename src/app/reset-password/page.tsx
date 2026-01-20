'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { validatePassword, generatePassword } from '@/lib/validation';
import { PasswordChecklist } from '@/components/password-checklist';
import { Wand2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { getErrorMessage } from '@/lib/error-utils';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        setToken(searchParams.get('token'));
        setEmail(searchParams.get('email'));
    }, [searchParams]);

    const validate = () => {
        const trimmedPassword = formData.newPassword.trim();
        const trimmedConfirm = formData.confirmPassword.trim();
        const newErrors: typeof errors = {};

        if (!trimmedPassword) {
            newErrors.newPassword = 'Password is required';
        } else {
            const passwordError = validatePassword(trimmedPassword);
            if (passwordError) newErrors.newPassword = passwordError;
        }

        if (!trimmedConfirm) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (trimmedPassword !== trimmedConfirm) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!token) {
            toast.error('Invalid or missing reset token');
            return;
        }

        if (!validate()) return;

        setIsLoading(true);
        const loadingToast = toast.loading('Resetting password...');

        try {
            await axios.post('/api/auth/reset-password', {
                password: formData.newPassword.trim(),
                token,
            });

            toast.success('Password reset successful!', { id: loadingToast });
            router.push('/signin');
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            toast.error(message, { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <p className="text-red-500 font-bold">Invalid or expired reset link.</p>
                <Link href="/forgot-password" title="Go to forgot password" className="text-purple-600 hover:underline">
                    Request a new link
                </Link>
            </div>
        );
    }

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
                <div className="group">
                    <Input
                        id="newPassword"
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.newPassword}
                        onChange={(e) => {
                            setFormData({ ...formData, newPassword: e.target.value });
                            if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                        }}
                        error={errors.newPassword}
                        hideErrorText={errors.newPassword === 'Password is required'}
                        disabled={isLoading}
                        className="group-hover:bg-white"
                        rightElement={
                            <div className="tooltip-trigger">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newPass = generatePassword();
                                        setFormData(prev => ({ ...prev, newPassword: newPass, confirmPassword: newPass }));
                                        setErrors(prev => ({ ...prev, newPassword: undefined, confirmPassword: undefined }));
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors focus:outline-none cursor-pointer"
                                >
                                    <Wand2 size={18} />
                                </button>
                                <span className="tooltip">Generate strong password</span>
                            </div>
                        }
                    />
                    <PasswordChecklist password={formData.newPassword} />
                </div>

                <div className="group">
                    <Input
                        id="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        error={errors.confirmPassword}
                        hideErrorText={errors.confirmPassword === 'Please confirm your password'}
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
    );
}

export default function ResetPasswordPage() {
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
                            <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group">
                                <KeyRound className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="mt-6 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
                                New Password
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 font-medium">
                                Create a new password for your account.
                            </p>
                        </div>

                        <Suspense fallback={<div className="text-center">Loading...</div>}>
                            <ResetPasswordForm />
                        </Suspense>

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
