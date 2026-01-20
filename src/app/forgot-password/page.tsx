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
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(undefined);

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading('Sending reset link...');

        try {
            await axios.post('/api/auth/forgot-password', { email: email.trim() });

            toast.success('Reset link sent! Check your email.', { id: loadingToast });
            setIsSubmitted(true);
        } catch (err: unknown) {
            const message = getErrorMessage(err);
            toast.error(message, { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-400 via-purple-500 to-pink-500 p-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-400/30 blur-[100px] animate-pulse" />
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-400/30 blur-[100px] animate-pulse delay-1000" />
                    <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-400/30 blur-[100px] animate-pulse delay-2000" />
                </div>

                <div className="max-w-md w-full z-10">
                    <div className="space-y-8 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 text-center">
                        <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <KeyRound className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="mt-6 text-3xl font-black text-gray-900 tracking-tight">
                            Check your email
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 font-medium">
                            We&apos;ve sent a password reset link to <span className="font-bold text-purple-600">{email}</span>.
                        </p>
                        <div className="mt-8">
                            <Link href="/signin" className="inline-flex items-center text-sm font-bold text-purple-600 hover:text-pink-600 transition-colors group">
                                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Back to Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                                Forgot Password
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 font-medium">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>
                        </div>

                        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                            <div className="space-y-4">
                                <div className="group">
                                    <Input
                                        id="email"
                                        label="Email address"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error) setError('');
                                        }}
                                        error={error || undefined}
                                        hideErrorText={error === 'Email is required'}
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
                                Send Reset Link
                            </Button>
                        </form>

                        <div className="text-center">
                            <Link href="/signin" className="inline-flex items-center text-sm font-bold text-purple-600 group">
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
