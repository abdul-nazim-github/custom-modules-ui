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
import { cn } from '@/lib/utils';
import axios from '@/lib/axios';
import toast from 'react-hot-toast';

function ResetPasswordForm({
    onTokenVerified,
    onLoadingChange
}: {
    onTokenVerified: (isValid: boolean) => void;
    onLoadingChange?: (isLoading: boolean) => void;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoadingState] = useState(false);

    const setIsLoading = (loading: boolean) => {
        setIsLoadingState(loading);
        onLoadingChange?.(loading);
    };
    const [isVerifying, setIsVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const t = searchParams.get('token');
        setToken(t);

        if (t) {
            verifyToken(t);
        } else {
            setIsVerifying(false);
            setIsValidToken(false);
            onTokenVerified(false);
        }
    }, [searchParams, onTokenVerified]);

    const verifyToken = async (tokenValue: string) => {
        setIsVerifying(true);
        try {
            const response = await axios.get(`/api/auth/verify-reset-token?token=${tokenValue}`);
            const isValid = response.data.isValid;
            setIsValidToken(isValid);
            onTokenVerified(isValid);
        } catch (err) {
            console.error('Token verification failed:', err);
            setIsValidToken(false);
            onTokenVerified(false);
        } finally {
            setIsVerifying(false);
        }
    };

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

    if (isVerifying) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 font-medium">Verifying reset link...</p>
            </div>
        );
    }

    if (!isValidToken) {
        return (
            <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <KeyRound className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Link Expired</h3>
                    <p className="text-gray-600">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                </div>
                <div className="pt-4">
                    <Link
                        href="/forgot-password"
                        className={cn(
                            "inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg",
                            isLoading && "pointer-events-none opacity-50"
                        )}
                        tabIndex={isLoading ? -1 : undefined}
                    >
                        Request New Link
                    </Link>
                </div>
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
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
                        {isValidToken !== false && (
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
                        )}

                        <Suspense fallback={<div className="text-center">Loading...</div>}>
                            <ResetPasswordForm
                                onTokenVerified={setIsValidToken}
                                onLoadingChange={setIsLoading}
                            />
                        </Suspense>

                        <div className="text-center">
                            <Link
                                href="/signin"
                                className={cn(
                                    "inline-flex items-center text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors group",
                                    isLoading && "pointer-events-none opacity-50"
                                )}
                                tabIndex={isLoading ? -1 : undefined}
                            >
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
